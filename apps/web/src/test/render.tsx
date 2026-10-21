import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { Providers } from '../Providers';

/** Rend un composant avec tous les providers de l'application, sur une route donnée. */
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    user: userEvent.setup(),
    client,
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <Providers client={client}>{ui}</Providers>
      </MemoryRouter>,
    ),
  };
}

type Handler = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>;

/** Simule l'API : chaque requête est routée vers un handler selon « MÉTHODE /chemin ». */
export function mockApi(routes: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${init?.method ?? 'GET'} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return Response.json({ error: `Route non simulée : ${key}` }, { status: 404 });
    return handler(url, init);
  });
}
