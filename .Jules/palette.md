# Palette's Journal - Critical UX & Accessibility Learnings

## 2026-03-31 - Tabbed Interfaces in Cybercafe Lockers
**Learning:** In kiosk locker interfaces, modal/tab buttons often lack semantic `role="tab"`, `aria-selected`, `aria-controls`, and label associations (`for`/`id`), preventing screen reader users and keyboard navigation from operating input controls smoothly.
**Action:** Always link labels to inputs with `for` and `id`, attach `role="tab"`, `aria-selected`, and `aria-controls` to tab toggle buttons, and maintain dynamic ARIA attribute synchronization in JS tab handlers.
