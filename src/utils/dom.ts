/**
 * Convenience functions for creating and removing DOM elements.
 */

/**
 * Make HTML element, with optional `attributes`, `data` key/values and `classes`
 * specified through `options.
 */
export function makeHTMLElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    attributes?: Record<string, string>;
    data?: Record<string, string>;
    classes?: string[];
  }
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const key in options.attributes) {
    e.setAttribute(key, options.attributes[key]);
  }
  for (const key in options.data) {
    e.dataset[key] = options.data[key];
  }
  if (options.classes) {
    e.classList.add(...options.classes);
  }
  return e;
}
