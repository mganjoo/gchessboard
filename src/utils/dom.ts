/**
 * Convenience functions for creating and removing DOM elements.
 */

/**
 * Make HTML element, with optional `attributes`, `data` key/values and `classes`
 * specified through `options.
 */
export function makeHTMLElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>;
    data?: Record<string, string>;
    classes?: string[];
  }
): HTMLElementTagNameMap[K] {
  return addOptionsToElement(document.createElement(tag), options);
}

/**
 * Make SVG element, with optional `attributes`, `data` key/values and `classes`
 * specified through `options.
 */
export function makeSVGElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>;
    data?: Record<string, string>;
    classes?: string[];
  }
): SVGElementTagNameMap[K] {
  return addOptionsToElement(
    document.createElementNS("http://www.w3.org/2000/svg", tag),
    options
  );
}

function addOptionsToElement<
  K extends
    | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
    | SVGElementTagNameMap[keyof SVGElementTagNameMap]
>(
  e: K,
  options?: {
    attributes?: Record<string, string>;
    data?: Record<string, string>;
    classes?: string[];
  }
) {
  if (options !== undefined) {
    for (const key in options.attributes) {
      e.setAttribute(key, options.attributes[key]);
    }
    for (const key in options.data) {
      e.dataset[key] = options.data[key];
    }
    if (options.classes) {
      e.classList.add(...options.classes);
    }
  }
  return e;
}
