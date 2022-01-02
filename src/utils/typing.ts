/**
 * Wrapper for Typescript `never` type to be used in exhaustive type checks.
 */
export function assertUnreachable(x: never): never {
  // istanbul ignore next
  throw new Error(`Unreachable code reached with value ${x}`)
}

/**
 * Simple type guard for EventTarget ensuring there is a dataset field on the
 * target.
 */
export function hasDataset(
  x: EventTarget | null
): x is EventTarget & { dataset: DOMStringMap } {
  return x !== null && (x as HTMLElement | SVGElement).dataset !== undefined
}

export function hasParentNode(
  x: EventTarget | null
): x is Element & { parentNode: ParentNode } {
  return x !== null && (x as Element).parentNode != null
}
