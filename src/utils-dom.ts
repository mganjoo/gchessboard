const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export function makeSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>
    data?: Record<string, string>
    classes?: string[]
  }
): SVGElementTagNameMap[K] {
  return addOptionsToElement(
    document.createElementNS(SVG_NAMESPACE, tag),
    options
  )
}

export function makeHTMLElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>
    data?: Record<string, string>
    classes?: string[]
  }
): HTMLElementTagNameMap[K] {
  return addOptionsToElement(document.createElement(tag), options)
}

function addOptionsToElement<
  K extends
    | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
    | SVGElementTagNameMap[keyof SVGElementTagNameMap]
>(
  e: K,
  options?: {
    attributes?: Record<string, string>
    data?: Record<string, string>
    classes?: string[]
  }
) {
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
export function removeElement(element: Element) {
  element.parentNode?.removeChild(element)
}
