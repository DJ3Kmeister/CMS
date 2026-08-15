# Palette's Journal

## 2026-07-25 - Icon-only Close Buttons in Modals
**Learning:** Icon-only modal close buttons (using `<i class="fa-solid fa-times"></i>`) are non-descriptive to screen reader users without an explicit `aria-label`. Adding `aria-label="Fermer"` makes modal dialog navigation accessible and accessible for assistive technology users.
**Action:** Always include `aria-label` attribute on icon-only interactive elements like close buttons or icon action triggers.
