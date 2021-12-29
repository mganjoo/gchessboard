const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

/**
 * Create and return SVG element of type `tag` (<tag>..</tag>), with
 * optional attributes, `data-*` attributes, and CSS classes set via `options`.
 */
export function makeSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>
    data?: Record<string, string>
    classes?: string[]
  }
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NAMESPACE, tag)
  if (options) {
    for (const key in options.attributes) {
      e.setAttribute(key, options.attributes[key])
    }
    for (const key in options.data) {
      e.dataset[key] = options.data[key]
    }
    if (options.classes) {
      e.classList.add(...options.classes)
    }
  }
  return e
}

/**
 * Remove `element` from DOM tree (if it exists).
 */
export function removeSvgElement(element: SVGElement) {
  element.parentNode?.removeChild(element)
}
