/**
 * Wrapper for Typescript `never` type to be used in exhaustive type checks.
 */
// istanbul ignore next
export function assertUnreachable(x: never): never {
  throw new Error(`Unreachable code reached with value ${x}`);
}
