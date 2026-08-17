## 2026-08-17 - Tab and Action Button Accessibility in Client Locker
**Learning:** Icon buttons and tab interfaces in `client_locker.html` lacked keyboard focus indicators (`focus-visible`) and proper ARIA role attributes (`role="tab"`, `aria-selected`, `aria-label`).
**Action:** When working on HTML templates in this app, ensure tab components use `role="tablist"`/`role="tab"`, dynamically sync `aria-selected` in tab switching JS functions, and apply `focus-visible:ring-2` for accessible keyboard navigation.
