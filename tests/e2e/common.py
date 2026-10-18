"""Shared Selenium/Chromium helpers for the RGB bulb e2e suite.

Everything runs inside the Podman container. Touch is enabled explicitly via
CDP (Emulation.setTouchEmulationEnabled + setDeviceMetricsOverride); Selenium's
mobileEmulation alone does not reliably set maxTouchPoints.
"""
import json
import os
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service

CHROME_BIN = os.environ.get("CHROME_BIN", "/usr/bin/chromium")
CHROMEDRIVER = os.environ.get("CHROMEDRIVER", "/usr/bin/chromedriver")


def make_driver():
    opts = webdriver.ChromeOptions()
    opts.binary_location = CHROME_BIN
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1400,1400")
    opts.add_argument("--hide-scrollbars")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    return webdriver.Chrome(service=Service(CHROMEDRIVER), options=opts)


def apply_profile(driver, width, height, touch=True, scale=1):
    driver.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {
            "width": width,
            "height": height,
            "deviceScaleFactor": scale,
            "mobile": touch,
            "screenWidth": width,
            "screenHeight": height,
        },
    )
    if touch:
        driver.execute_cdp_cmd(
            "Emulation.setTouchEmulationEnabled",
            {"enabled": True, "maxTouchPoints": 5},
        )
    else:
        driver.execute_cdp_cmd("Emulation.setTouchEmulationEnabled", {"enabled": False})


def load(driver, url, wait_hook=False, timeout=15):
    driver.get(url)
    end = time.time() + timeout
    selector = "window.__RGB_E2E__ && window.__RGB_E2E__.Reveal" if wait_hook else (
        "document.querySelector('.reveal .slides section')"
    )
    while time.time() < end:
        try:
            if driver.execute_script(f"return !!(%s);" % selector):
                break
        except Exception:
            pass
        time.sleep(0.05)
    else:
        raise RuntimeError("page did not become ready: %s" % url)
    time.sleep(0.35)


def layout_info(driver):
    return driver.execute_script(
        """
        const html = document.documentElement;
        const vp = document.querySelector('.reveal-viewport');
        const controls = document.querySelector('.controls');
        const number = document.querySelector('.slide-number');
        return {
          layout: html.dataset.layout || null,
          touch: html.dataset.touch || null,
          scrollView: !!(vp && vp.classList.contains('reveal-scroll')),
          controls: controls ? getComputedStyle(controls).display : 'missing',
          slideNumber: number ? getComputedStyle(number).display : 'missing',
          viewport: [window.innerWidth, window.innerHeight],
          scale: window.__RGB_E2E__ ? window.__RGB_E2E__.Reveal.getScale() : null,
        };
        """
    )


def slide_keys(driver):
    return driver.execute_script(
        """
        const R = window.__RGB_E2E__.Reveal;
        const seen = new Set();
        const keys = [];
        for (const slide of R.getSlides()) {
          const i = R.getIndices(slide);
          const key = i.h + ':' + i.v;
          if (!seen.has(key)) { seen.add(key); keys.push([i.h, i.v]); }
        }
        return keys;
        """
    )


def goto_slide(driver, h, v=0, settle=0.18):
    driver.execute_script(
        "window.__RGB_E2E__.Reveal.slide(arguments[0], arguments[1]);", h, v
    )
    time.sleep(settle)


def current_slide_metrics(driver):
    return driver.execute_script(
        """
        const R = window.__RGB_E2E__.Reveal;
        const s = R.getCurrentSlide();
        const i = R.getIndices();
        const parent = s.parentElement && s.parentElement.tagName === 'SECTION'
          ? s.parentElement : null;
        return {
          h: i.h, v: i.v,
          scrollHeight: s.scrollHeight,
          scrollWidth: s.scrollWidth,
          clientHeight: s.clientHeight,
          clientWidth: s.clientWidth,
          top: parseFloat(s.style.top || '0'),
          parentScrollHeight: parent ? parent.scrollHeight : null,
          parentScrollWidth: parent ? parent.scrollWidth : null,
        };
        """
    )


TARGET_SELECTORS = [
    ".cup-container",
    ".cup-btn",
    ".light-switch",
    ".preset-chip",
    ".challenge-controls button",
    "#cubeBlue",
    ".swatch-target",
]


def touch_targets(driver):
    return driver.execute_script(
        """
        const selectors = arguments[0];
        const out = [];
        for (const sel of selectors) {
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0) continue;
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            // Ignore elements on hidden (non-current) slides.
            const section = el.closest('section');
            if (section && !section.classList.contains('present')) continue;
            out.push({ selector: sel, width: Math.round(r.width * 10) / 10,
                       height: Math.round(r.height * 10) / 10 });
          }
        }
        return out;
        """,
        TARGET_SELECTORS,
    )


def touch(driver, kind, points):
    driver.execute_cdp_cmd(
        "Input.dispatchTouchEvent",
        {
            "type": kind,
            "touchPoints": [
                {
                    "x": p[0],
                    "y": p[1],
                    "radiusX": 6,
                    "radiusY": 6,
                    "force": 1,
                    "id": i + 1,
                }
                for i, p in enumerate(points)
            ],
        },
    )


def tap(driver, x, y, settle=0.35):
    touch(driver, "touchStart", [(x, y)])
    time.sleep(0.06)
    touch(driver, "touchEnd", [])
    time.sleep(settle)


def tap_element(driver, selector, settle=0.35):
    rect = driver.execute_script(
        """
        const el = document.querySelector(arguments[0]);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height};
        """,
        selector,
    )
    if not rect or rect["w"] <= 0:
        raise AssertionError("element not visible: %s" % selector)
    tap(driver, rect["x"], rect["y"], settle)
    return rect


def swipe(driver, start, end, steps=8, settle=0.6):
    x0, y0 = start
    x1, y1 = end
    touch(driver, "touchStart", [(x0, y0)])
    time.sleep(0.05)
    for i in range(1, steps + 1):
        x = x0 + (x1 - x0) * i / steps
        y = y0 + (y1 - y0) * i / steps
        touch(driver, "touchMove", [(x, y)])
        time.sleep(0.03)
    touch(driver, "touchEnd", [])
    time.sleep(settle)


def console_errors(driver):
    errors = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") == "SEVERE":
                msg = entry.get("message", "")
                if "favicon" in msg.lower():
                    continue
                errors.append(msg)
    except Exception:
        pass
    return errors


def screenshot(driver, artifacts, name):
    os.makedirs(artifacts, exist_ok=True)
    path = os.path.join(artifacts, name + ".png")
    driver.save_screenshot(path)
    return path


def slide_state(driver, selector):
    return driver.execute_script(
        "const el=document.querySelector(arguments[0]); return el ? el.textContent.trim() : null;",
        selector,
    )


class Report:
    def __init__(self, name):
        self.name = name
        self.failures = []
        self.notes = []

    def check(self, condition, message):
        if condition:
            print("  ok   %s" % message)
        else:
            print("  FAIL %s" % message)
            self.failures.append(message)
        return bool(condition)

    def note(self, message):
        print("  ..   %s" % message)
        self.notes.append(message)

    def finish(self):
        if self.failures:
            print("\n%s: %d failure(s)" % (self.name, len(self.failures)))
            for f in self.failures:
                print("  - %s" % f)
            return 1
        print("\n%s: all checks passed" % self.name)
        return 0
