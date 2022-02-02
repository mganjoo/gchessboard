/**
 * Wrapper for Typescript `never` type to be used in exhaustive type checks.
 */
// istanbul ignore next
export function assertUnreachable(x: never): never {
  throw new Error(`Unreachable code reached with value ${x}`);
}

/**
 * Simple type guard for EventTarget ensuring there is a dataset field on the
 * target.
 */
export function hasDataset(
  x: EventTarget | undefined
): x is EventTarget & { dataset: DOMStringMap } {
  return !!x && !!(x as HTMLElement | SVGElement).dataset;
}
