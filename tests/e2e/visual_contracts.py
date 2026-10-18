#!/usr/bin/env python3
"""Visual contracts ported from the legacy host-Firefox BiDi scripts."""
import argparse
import time

from common import (
    Report,
    apply_profile,
    console_errors,
    goto_slide,
    load,
    make_driver,
    screenshot,
)


def js(driver, code, *args):
    return driver.execute_script(code, *args)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--artifacts", default="tests/e2e/artifacts")
    args = ap.parse_args()

    driver = make_driver()
    report = Report("visual_contracts")
    try:
        apply_profile(driver, 1280, 720, touch=False)
        load(driver, args.url, wait_hook=True)

        # The desktop title slide must keep the original "wow" effect: the
        # bulb breathes by changing the red channel and the RGB/hex numbers run.
        goto_slide(driver, 0, 0, settle=0.5)
        intro = js(
            driver,
            """
            return {
              readout: document.querySelector('[data-bulb-intro] .readout-rgb').textContent,
              hex: document.querySelector('[data-bulb-intro] .readout-hex').textContent,
              filter: getComputedStyle(
                document.querySelector('[data-bulb-intro] .bulb-emissive path[filter]')
              ).filter
            };
            """,
        )
        report.check(intro["filter"] != "none", "desktop keeps the SVG glow filter")
        time.sleep(0.35)
        intro_later = js(
            driver,
            """
            return {
              readout: document.querySelector('[data-bulb-intro] .readout-rgb').textContent,
              hex: document.querySelector('[data-bulb-intro] .readout-hex').textContent
            };
            """,
        )
        report.check(
            intro_later["readout"] != intro["readout"] or intro_later["hex"] != intro["hex"],
            "desktop intro numbers run while the title slide is present",
        )
        screenshot(driver, args.artifacts, "visual-intro-desktop")
        goto_slide(driver, 1, 0, settle=0.5)
        stopped = js(
            driver,
            "return document.querySelector('[data-bulb-intro] .readout-rgb').textContent;",
        )
        time.sleep(0.5)
        stopped_later = js(
            driver,
            "return document.querySelector('[data-bulb-intro] .readout-rgb').textContent;",
        )
        report.check(stopped_later == stopped, "intro bulb animation stops after leaving its slide")

        # Additive light stage: intentionally dark, pure RGB circles.
        goto_slide(driver, 2, 0, settle=0.35)
        stage = js(
            driver,
            """
            const stage = document.querySelector('.lightmix-stage');
            const cs = getComputedStyle(stage);
            const circles = {};
            for (const [name, sel] of [['red', '.lightmix-circle.red'],
                                       ['green', '.lightmix-circle.green'],
                                       ['blue', '.lightmix-circle.blue']]) {
              const el = document.querySelector(sel);
              const s = getComputedStyle(el);
              circles[name] = {bg: s.backgroundColor, opacity: parseFloat(s.opacity)};
            }
            return {bg: cs.backgroundColor, circles};
            """,
        )
        report.check(
            stage["bg"] in ("rgb(4, 6, 12)", "rgba(4, 6, 12, 1)"),
            "additive light stage stays dark (%s)" % stage["bg"],
        )
        report.check(stage["circles"]["red"]["bg"] == "rgb(255, 0, 0)", "red circle is pure red")
        report.check(stage["circles"]["green"]["bg"] == "rgb(0, 255, 0)", "green circle is pure green")
        report.check(stage["circles"]["blue"]["bg"] == "rgb(0, 0, 255)", "blue circle is pure blue")
        report.check(
            all(c["opacity"] == 1 for c in stage["circles"].values()),
            "white light mixes all three circles at full opacity",
        )
        screenshot(driver, args.artifacts, "visual-lightmix")

        # Bulb states: off -> on.
        goto_slide(driver, 3, 0, settle=0.35)
        off = js(
            driver,
            """
            const svg = document.querySelector('[data-bulb-switch] svg');
            const readout = document.querySelector('[data-bulb-switch] .readout-rgb');
            return {state: svg.dataset.bulbState, rgb: readout.textContent};
            """,
        )
        report.check(off["state"] == "off", "switch slide starts with bulb off")
        report.check(off["rgb"] == "rgb(0, 0, 0)", "off bulb readout is black")
        js(driver, "document.querySelector('[data-light-switch]').click();")
        time.sleep(0.25)
        on = js(
            driver,
            """
            const svg = document.querySelector('[data-bulb-switch] svg');
            const readout = document.querySelector('[data-bulb-switch] .readout-rgb');
            return {state: svg.dataset.bulbState, rgb: readout.textContent};
            """,
        )
        report.check(on["state"] == "on", "switch turns the bulb fully on")
        report.check(on["rgb"] == "rgb(255, 255, 255)", "on bulb readout is white")
        screenshot(driver, args.artifacts, "visual-bulb-on")

        # Cube collapse: blue 0 is one sheet; blue 255 is the full illustrative stack.
        goto_slide(driver, 7, 0, settle=0.35)
        js(
            driver,
            """
            const s = document.querySelector('#cubeBlue');
            s.value = 0;
            s.dispatchEvent(new Event('input', {bubbles: true}));
            """,
        )
        time.sleep(0.2)
        collapsed = js(
            driver,
            """
            const c = document.querySelector('.cube-iso__canvas');
            return {sheets: c.dataset.sheetCount, blue: c.dataset.blue,
                    caption: document.querySelector('[data-cube-caption]').textContent};
            """,
        )
        report.check(collapsed["sheets"] == "1" and collapsed["blue"] == "0", "blue 0 collapses the cube to one sheet")
        report.check("квадрат" in collapsed["caption"], "collapsed cube explains the 65 536 square")
        js(
            driver,
            """
            const s = document.querySelector('#cubeBlue');
            s.value = 255;
            s.dispatchEvent(new Event('input', {bubbles: true}));
            """,
        )
        time.sleep(0.2)
        full = js(
            driver,
            "const c=document.querySelector('.cube-iso__canvas');"
            "return {sheets:c.dataset.sheetCount, blue:c.dataset.blue};",
        )
        report.check(full["sheets"] == "6" and full["blue"] == "255", "blue 255 shows the full cube stack")
        screenshot(driver, args.artifacts, "visual-cube")

        # Challenge data is present and starts unsolved.
        goto_slide(driver, 9, 0, settle=0.4)
        challenge = js(
            driver,
            """
            const el = document.querySelector('#challenge-game');
            return {targets: el.dataset.targetCount, solved: el.dataset.solvedCount,
                    title: document.querySelector('.challenge-title').textContent};
            """,
        )
        report.check(int(challenge["targets"]) >= 15, "challenge exposes at least 15 targets")
        report.check(challenge["solved"] == "0", "challenge starts unsolved")
        report.check("Солнце" in challenge["title"], "challenge starts with the Sun target")

        errors = console_errors(driver)
        report.check(not errors, "visual contracts load without JavaScript errors %s" % errors[:3])
    finally:
        driver.quit()
    raise SystemExit(report.finish())


if __name__ == "__main__":
    main()
