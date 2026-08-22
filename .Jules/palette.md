## 2026-08-22 - Explicit Label Associations and Focus Rings in Dark-Themed Forms
**Learning:** Icon-only overlay buttons and custom-styled input fields in dark neon Tailwind themes often lack explicit `for` attribute linkages to labels and visible focus rings (`focus-visible:ring-2`), making keyboard and screen reader navigation inaccessible.
**Action:** Always link `<label for="...">` to input `id`s, provide `type="button"` and `aria-label` for modal close/icon buttons, and ensure tab controls use `role="tab"` with `aria-selected` state.
