export type Result<T, E extends string = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };

export const Ok = <T, E extends string = never>(value: T): Result<T, E> => ({
  ok: true,
  value,
});

export const Fail = <E extends string>(
  error: E,
  message: string,
): Result<never, E> => ({
  ok: false,
  error,
  message,
});
