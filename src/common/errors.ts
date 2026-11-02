export function getErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const maybe = err as { message?: unknown };
    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return maybe.message;
    }
  }
  try {
    return String(err ?? fallback);
  } catch {
    return fallback;
  }
}

export function getErrorStack(err: unknown): string | undefined {
  if (err instanceof Error && err.stack) return err.stack;
  return undefined;
}

export function formatError(err: unknown): { message: string; stack?: string } {
  return {
    message: getErrorMessage(err),
    stack: getErrorStack(err),
  };
}

export function getErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

export function getErrorName(err: unknown): string | undefined {
  if (err instanceof Error && err.name) return err.name;
  if (!err || typeof err !== 'object') return undefined;
  const name = (err as { name?: unknown; Code?: unknown }).name
    ?? (err as { Code?: unknown }).Code;
  return typeof name === 'string' ? name : undefined;
}

export function getErrorHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const meta = (err as { $metadata?: { httpStatusCode?: unknown } }).$metadata;
  const status = meta?.httpStatusCode;
  return typeof status === 'number' ? status : undefined;
}
