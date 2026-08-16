## 2026-08-10 - Accessibility for Icon-Only Action Controls in Modals
**Learning:** Icon-only close buttons in modal dialogs require explicit `aria-label` attributes and accessible focus rings so screen readers can announce them properly and keyboard users can navigate to them smoothly without losing visual focus.
**Action:** Always include `aria-label="Fermer la fenêtre"` (or context-appropriate text) and `focus:outline-none focus:ring-2` styling on icon-only buttons across templates.
