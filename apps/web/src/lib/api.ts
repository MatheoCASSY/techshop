export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

/** Petit client fetch typé : préfixe /api, envoie les cookies et normalise les erreurs. */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const response = await fetch(`/api${path}`, {
    method,
    signal,
    credentials: 'include',
    // Content-Type seulement s'il y a un corps : Fastify refuse un JSON vide
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const payload = (data ?? {}) as { error?: unknown; issues?: ApiError['issues'] };
    const message =
      typeof payload.error === 'string' ? payload.error : `Erreur HTTP ${response.status}`;
    throw new ApiError(response.status, message, payload.issues ?? []);
  }
  return data as T;
}

/** Transforme un objet en query string en ignorant les valeurs vides. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
