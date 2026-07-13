type ApiErrorEnvelope = {
  error?: {
    message?: string;
  };
};

type ApiEnvelope<T> = ApiErrorEnvelope & {
  data?: T;
};

export async function requestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers
  });
  const payload = await response.json().catch(() => ({})) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed: ${response.status}`);
  }
  return payload.data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
