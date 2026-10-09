/**
 * Turns a boolean into a value for an HTML boolean attribute such as `data-count`.
 * @param on - Whether the attribute should be present.
 * @returns An empty string when `on` is `true`, so the attribute is written, and `undefined` otherwise.
 */
const flag = (on: boolean): "" | undefined => {
  // An empty string makes Astro write the bare attribute.
  if (on) {
    return "";
  }
  // `undefined` makes Astro leave the attribute out.
  return undefined;
};

export default flag;
