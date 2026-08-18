## 2026-08-18 - Password Input Visibility & ARIA Controls
**Learning:** In kiosk/locker interfaces with password inputs, users often need quick visibility feedback on input errors, but screen readers require dynamic ARIA attribute updates (`aria-label` and `title`) when toggling between `type="password"` and `type="text"`.
**Action:** When adding password visibility toggle buttons, ensure `button[type="button"]` includes explicit `aria-label`, `title`, and visible focus ring (`focus-visible:ring-2`) and update attributes dynamically via JS.
