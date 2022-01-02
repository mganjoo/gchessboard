/**
 * Wrapper for Typescript `never` type to be used in exhaustive type checks.
 */
export function assertUnreachable(x: never): never {
  /* istanbul ignore next */
  throw new Error(`Unreachable code reached with value ${x}`)
}
