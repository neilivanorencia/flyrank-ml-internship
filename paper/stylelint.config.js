/** @type {import('stylelint').Config} */
const config = {
  // The standard rules, the parser for the `style` blocks in `.astro` files, and a fixed order for properties.
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/astro",
    "stylelint-config-recess-order",
  ],
  // Build output is generated, so it is not linted.
  ignoreFiles: ["dist/**", ".astro/**"],
  // Rules added to or changed from the shared configs above.
  rules: {
    // Overrides come from the cascade layers and not from `!important`.
    "declaration-no-important": true,
    // Class names follow BEM, which is also why `lenis.css` disables this rule for the names Lenis sets.
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      { message: "Use BEM: block__element--modifier, each part kebab-case." },
    ],
    // Selectors stay short, which keeps specificity low and overrides easy.
    "selector-max-compound-selectors": 3,
    // Ids are for anchors and labels, never for styling.
    "selector-max-id": 0,
    // Astro's `:global()` wrapper is not a standard pseudo-class, so it is allowed.
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
  },
};

export default config;
