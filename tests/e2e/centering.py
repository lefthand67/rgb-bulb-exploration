#!/usr/bin/env python3
"""Per-layout vertical-centering contract (ported from check-centering.mjs)."""
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
    slide_keys,
)

PROFILES = [
    ("desktop", 1280, 720, False, "landscape", 720),
    ("phone-portrait", 360, 800, True, "portrait", 1280),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--artifacts", default="tests/e2e/artifacts")
    args = ap.parse_args()

    driver = make_driver()
    report = Report("centering")
    try:
        for name, w, h, is_touch, layout, canvas_h in PROFILES:
            print("\n== centering %s ==" % name)
            apply_profile(driver, w, h, touch=is_touch)
            load(driver, args.url, wait_hook=True)
            info = layout_info(driver)
            report.check(info["layout"] == layout, "%s: layout is %s" % (name, layout))
            bad = []
            for hh, vv in slide_keys(driver):
                goto_slide(driver, hh, vv, settle=0.18)
                m = current_slide_metrics(driver)
                expected_top = (canvas_h - m["scrollHeight"]) / 2
                if abs(m["top"] - expected_top) > 2.5:
                    bad.append(
                        {
                            "h": m["h"],
                            "v": m["v"],
                            "top": round(m["top"], 1),
                            "expected": round(expected_top, 1),
                            "scrollHeight": m["scrollHeight"],
                        }
                    )
            report.check(not bad, "%s: every slide is vertically centred %s" % (name, bad[:5]))
            errors = console_errors(driver)
            report.check(not errors, "%s: no JavaScript errors %s" % (name, errors[:3]))
    finally:
        driver.quit()
    raise SystemExit(report.finish())


if __name__ == "__main__":
    main()
