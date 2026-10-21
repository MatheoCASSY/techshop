import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiStatus } from './ApiStatus';

const mockFetch = (response: Response | Error) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() =>
      response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    );

describe('ApiStatus', () => {
  it('indique que l’API est connectée', async () => {
    mockFetch(Response.json({ status: 'ok', database: 'up' }));
    render(<ApiStatus />);
    expect(await screen.findByText('API connectée')).toBeInTheDocument();
  });

  it('indique que l’API est injoignable si la requête échoue', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    render(<ApiStatus />);
    expect(await screen.findByText('API injoignable')).toBeInTheDocument();
  });

  it('indique que l’API est injoignable si la base est en panne', async () => {
    mockFetch(Response.json({ status: 'degraded' }, { status: 503 }));
    render(<ApiStatus />);
    expect(await screen.findByText('API injoignable')).toBeInTheDocument();
  });
});
