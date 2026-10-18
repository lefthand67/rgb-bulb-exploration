#!/usr/bin/env python3
"""Responsive/touch e2e matrix for the RGB bulb deck.

Run inside the project container:
  python3 tests/e2e/android_webdriver.py --url file:///work/web/index.html \
      --artifacts /work/tests/e2e/artifacts
"""
import argparse
import time

from common import (
    Report,
    apply_profile,
    console_errors,
    current_slide_metrics,
    goto_slide,
    layout_info,
    load,
    make_driver,
    screenshot,
    slide_keys,
    swipe,
    tap,
    tap_element,
    touch,
    touch_targets,
)

PROFILES = [
    ("phone-portrait-small", 360, 640, True, "portrait"),
    ("phone-portrait", 360, 800, True, "portrait"),
    ("phone-portrait-large", 412, 915, True, "portrait"),
    ("tablet-portrait", 800, 1280, True, "portrait"),
    ("phone-landscape", 640, 360, True, "landscape"),
    ("phone-landscape-wide", 800, 360, True, "landscape"),
    ("desktop", 1280, 720, False, "landscape"),
    ("desktop-large", 1920, 1080, False, "landscape"),
]

CANVAS = {"portrait": (720, 1280), "landscape": (1280, 720)}
TOLERANCE = 8


def value_of(driver, selector):
    return driver.execute_script(
        "const el=document.querySelector(arguments[0]); return el ? el.textContent.trim() : null;",
        selector,
    )


def red_cup_value(driver):
    return int(value_of(driver, "#cup-r .cup-val-num") or "0")


def run_profile(driver, report, url, artifacts, name, w, h, touch_device, expected):
    print("\n== %s (%sx%s) ==" % (name, w, h))
    apply_profile(driver, w, h, touch=touch_device)
    load(driver, url, wait_hook=True)
    info = layout_info(driver)
    report.note("layout info: %s" % info)
    report.check(info["layout"] == expected, "%s: data-layout=%s" % (name, expected))
    report.check(info["touch"] == str(touch_device).lower(), "%s: data-touch=%s" % (name, str(touch_device).lower()))
    report.check(not info["scrollView"], "%s: Reveal is not in scroll view" % name)
    report.check(info["controls"] not in ("none", "missing"), "%s: controls visible" % name)
    report.check(info["slideNumber"] not in ("none", "missing"), "%s: slide number visible" % name)

    if touch_device:
        # Mobile GPU safety: no SVG blur filter and no continuous title
        # animation on touch devices (Yandex Browser / Android WebView).
        goto_slide(driver, 0, 0, settle=0.45)
        gpu_safety = driver.execute_script(
            """
            const intro = document.querySelector('[data-bulb-intro] .bulb-container');
            return {
              animation: intro ? getComputedStyle(intro).animationName : null,
              readout: document.querySelector('[data-bulb-intro] .readout-rgb').textContent
            };
            """
        )
        report.check(gpu_safety["animation"] == "none", "%s: title bulb has no continuous animation on touch" % name)
        time.sleep(0.4)
        touch_readout = driver.execute_script(
            "return document.querySelector('[data-bulb-intro] .readout-rgb').textContent;"
        )
        report.check(
            touch_readout == gpu_safety["readout"],
            "%s: title bulb numbers stay static on touch" % name,
        )
        goto_slide(driver, 3, 0, settle=0.45)
        bulb_filter = driver.execute_script(
            """
            const path = document.querySelector('[data-bulb-switch] .bulb-emissive path[filter]');
            return path ? getComputedStyle(path).filter : null;
            """
        )
        report.check(bulb_filter == "none", "%s: bulb drops the SVG blur filter on touch (%s)" % (name, bulb_filter))

    cw, ch = CANVAS[expected]
    keys = slide_keys(driver)
    report.check(len(keys) >= 10, "%s: all slides discoverable (%d)" % (name, len(keys)))
    targets = []
    clipped = []
    for hh, vv in keys:
        goto_slide(driver, hh, vv, settle=0.12)
        m = current_slide_metrics(driver)
        if expected == "portrait":
            fits = m["scrollHeight"] <= ch + TOLERANCE and m["scrollWidth"] <= cw + TOLERANCE
        else:
            fits = m["scrollHeight"] <= ch + TOLERANCE and m["scrollWidth"] <= cw + TOLERANCE
        if not fits:
            clipped.append(m)
        if touch_device:
            targets.extend(touch_targets(driver))
    report.check(
        not clipped,
        "%s: every slide fits %sx%s %s" % (name, cw, ch, clipped[:4]),
    )
    if touch_device:
        small = [t for t in targets if t["width"] < 43.5 or t["height"] < 43.5]
        report.check(
            not small,
            "%s: touch targets >=44px (smallest %s, offenders %s)"
            % (
                name,
                min([(t["width"], t["height"]) for t in targets], default=None),
                small[:6],
            ),
        )
        report.note("measured %d touch targets" % len(targets))

    # Screenshots of the most layout-sensitive slides.
    for idx, slide_name in [(0, "title"), (3, "switch"), (4, "playground"), (7, "cube"), (9, "challenge")]:
        goto_slide(driver, idx, 0, settle=0.9)
        screenshot(driver, artifacts, "%s-slide%d-%s" % (name, idx, slide_name))

    if touch_device:
        # A real touch swipe reveals slide fragments before advancing slides.
        goto_slide(driver, 1, 0, settle=0.5)
        driver.execute_script("window.__RGB_E2E__.Reveal.slide(1, 0, -1);")
        time.sleep(0.35)
        before = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices()")
        swipe(driver, (w * 0.82, h * 0.18), (w * 0.18, h * 0.18), settle=0.7)
        after = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices()")
        report.check(
            after["h"] == before["h"] and after["f"] > before["f"],
            "%s: real touch swipe advances fragments (%s -> %s)" % (name, before, after),
        )

        # Touch swipe on a slide without fragments advances to the next slide.
        goto_slide(driver, 9, 0, settle=0.25)
        before = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices().h")
        swipe(driver, (w * 0.82, h * 0.18), (w * 0.18, h * 0.18), settle=0.7)
        after = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices().h")
        report.check(after == before + 1, "%s: real touch swipe advances slides (%s -> %s)" % (name, before, after))

        # Cup drag.
        goto_slide(driver, 4, 0, settle=0.35)
        rect = driver.execute_script(
            "const r=document.querySelector('#cup-r .cup-container').getBoundingClientRect();"
            "return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};"
        )
        before = red_cup_value(driver)
        touch(driver, "touchStart", [(rect["x"], rect["y"])])
        time.sleep(0.05)
        for i in range(1, 6):
            touch(driver, "touchMove", [(rect["x"], rect["y"] - rect["h"] * 0.12 * i)])
            time.sleep(0.03)
        touch(driver, "touchEnd", [])
        time.sleep(0.3)
        after = red_cup_value(driver)
        report.check(after != before, "%s: cup drag changes the value (%s -> %s)" % (name, before, after))

        # pointercancel must never commit a tap.
        driver.execute_script(
            "window.__cancelCount=0;"
            "document.addEventListener('pointercancel',()=>window.__cancelCount++,true);"
        )
        goto_slide(driver, 4, 0, settle=0.3)
        rect = driver.execute_script(
            "const r=document.querySelector('#cup-r .cup-container').getBoundingClientRect();"
            "return {x:r.left+r.width/2,y:r.top+r.height*0.15,w:r.width,h:r.height};"
        )
        before = red_cup_value(driver)
        touch(driver, "touchStart", [(rect["x"], rect["y"])])
        time.sleep(0.08)
        touch(driver, "touchCancel", [])
        time.sleep(0.3)
        after = red_cup_value(driver)
        cancels = driver.execute_script("return window.__cancelCount || 0")
        report.check(cancels > 0, "%s: touch cancel produced a pointercancel" % name)
        report.check(after == before, "%s: pointercancel does not commit a value (%s -> %s)" % (name, before, after))

        # Switch tap toggles 0 <-> 255.
        goto_slide(driver, 3, 0, settle=0.55)
        before = value_of(driver, "[data-switch-value]")
        tap_element(driver, "[data-light-switch]")
        after = value_of(driver, "[data-switch-value]")
        report.check(before == "0" and after == "255", "%s: switch tap toggles 0 -> 255 (%s -> %s)" % (name, before, after))

        # Cube slider touch drag changes the blue value / sheet count.
        goto_slide(driver, 7, 0, settle=0.55)
        rect = driver.execute_script(
            "const r=document.querySelector('#cubeBlue').getBoundingClientRect();"
            "return {x:r.left+r.width*0.2,y:r.top+r.height/2};"
        )
        before = driver.execute_script("return document.querySelector('.cube-iso__canvas').dataset.blue")
        tap(driver, rect["x"], rect["y"])
        after = driver.execute_script("return document.querySelector('.cube-iso__canvas').dataset.blue")
        report.check(after != before, "%s: cube slider touch changes blue (%s -> %s)" % (name, before, after))

        # Challenge buttons respond to real taps.
        goto_slide(driver, 9, 0, settle=0.55)
        before_title = value_of(driver, ".challenge-title")
        tap_element(driver, ".btn-skip")
        after_title = value_of(driver, ".challenge-title")
        report.check(after_title != before_title, "%s: challenge skip responds" % name)
        tap_element(driver, ".btn-check")
        time.sleep(0.3)
        status = value_of(driver, ".challenge-status")
        report.check(bool(status), "%s: challenge check responds" % name)

    # Orientation change must preserve the current slide and layout.
    if touch_device and expected == "portrait":
        goto_slide(driver, 5, 0, settle=0.3)
        before = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices().h")
        apply_profile(driver, h, w, touch=True)
        time.sleep(0.8)
        info = layout_info(driver)
        after = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices().h")
        report.check(info["layout"] == "landscape", "%s: rotate -> landscape layout" % name)
        report.check(not info["scrollView"], "%s: rotate -> landscape stays in slide view" % name)
        report.check(after == before, "%s: rotation preserves the current slide (%s -> %s)" % (name, before, after))
        apply_profile(driver, w, h, touch=True)
        time.sleep(0.8)
        info = layout_info(driver)
        after = driver.execute_script("return window.__RGB_E2E__.Reveal.getIndices().h")
        report.check(info["layout"] == "portrait", "%s: rotate back -> portrait layout" % name)
        report.check(after == before, "%s: rotate back preserves the current slide (%s -> %s)" % (name, before, after))
        m = current_slide_metrics(driver)
        report.check(
            m["scrollHeight"] <= 1280 + TOLERANCE and m["scrollWidth"] <= 720 + TOLERANCE,
            "%s: slide fits after rotating back %s" % (name, m),
        )

    errors = console_errors(driver)
    report.check(not errors, "%s: no uncaught JavaScript errors %s" % (name, errors[:3]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--artifacts", default="tests/e2e/artifacts")
    args = ap.parse_args()

    driver = make_driver()
    report = Report("android_webdriver")
    try:
        for name, w, h, is_touch, expected in PROFILES:
            run_profile(driver, report, args.url + "?e2e=1", args.artifacts, name, w, h, is_touch, expected)

        # The normal URL must work and must not leak the test hook.
        apply_profile(driver, 1280, 720, touch=False)
        load(driver, args.url)
        hook = driver.execute_script("return !!window.__RGB_E2E__")
        report.check(not hook, "normal load does not expose the e2e hook")
        report.check(
            driver.execute_script("return document.querySelectorAll('.reveal .slides section').length > 5"),
            "normal load renders the deck",
        )
        screenshot(driver, args.artifacts, "normal-load-desktop")
        errors = console_errors(driver)
        report.check(not errors, "normal load has no JavaScript errors %s" % errors[:3])
    finally:
        driver.quit()
    raise SystemExit(report.finish())


if __name__ == "__main__":
    main()
