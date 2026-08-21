# Palette's Journal - DEK-DRIVSIM UX & Accessibility Insights

## 2026-07-25 - Password Visibility Toggles on Mobile/WebView Setup Forms
**Learning:** Security key input on touchscreen or mobile WebViews (such as initial terminal role activation) frequently suffers from user mistypes due to input masking. Adding an accessible toggle button with dynamic `aria-label` ("Afficher/Masquer le mot de passe") and explicit `focus-visible:ring-2` styling ensures keyboard navigation and screen readers remain fully supported while drastically improving user confidence when typing activation passwords.
**Action:** Always pair masked password/key inputs on setup and login modals with an accessible show/hide toggle button and dynamic ARIA label updates.
