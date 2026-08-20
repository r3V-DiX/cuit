"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

type StyleMap = Record<string, string | number | undefined>;

/**
 * Applies styles via direct CSSOM assignment (element.style[prop] = value)
 * instead of the JSX `style` prop. This site's CSP (`style-src` with a
 * nonce, no `unsafe-inline`) blocks the browser from applying inline
 * `style="..."` HTML attributes outright — a nonce only covers
 * <style>/<script> elements, never attributes — but does not affect
 * script-driven CSSOM writes. Use this for genuinely runtime-computed
 * values (percentages, positions) that can't be expressed as a static
 * Tailwind class.
 *
 * Pass an existing ref as the second argument to apply styles to an element
 * you already have a ref for (e.g. also used for click-outside detection);
 * otherwise a new ref is created and returned.
 */
export function useInlineStyle<T extends HTMLElement = HTMLDivElement>(
  style: StyleMap,
  existingRef?: RefObject<T | null>,
) {
  const ownRef = useRef<T>(null);
  const ref = existingRef ?? ownRef;
  const styleKey = JSON.stringify(style);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const [prop, value] of Object.entries(style)) {
      if (value === undefined) continue;
      (el.style as unknown as Record<string, string>)[prop] = String(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey]);

  return ref;
}
