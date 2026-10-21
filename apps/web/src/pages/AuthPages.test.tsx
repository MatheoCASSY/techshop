import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, renderWithProviders } from '../test/render';
import { safeRedirect } from '../lib/redirect';
import { LoginPage } from './AuthPages';

describe('safeRedirect', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirect('/commande')).toBe('/commande');
  });

  it('refuse une redirection vers un autre site', () => {
    expect(safeRedirect('https://malveillant.example')).toBe('/');
    expect(safeRedirect('//malveillant.example')).toBe('/');
    expect(safeRedirect('/\\malveillant.example')).toBe('/');
    expect(safeRedirect(null)).toBe('/');
  });
});

describe('LoginPage', () => {
  const renderLogin = (route = '/connexion') =>
    renderWithProviders(
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/commande" element={<p>Page commande</p>} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>,
      { route },
    );

  it('affiche les erreurs de validation sans appeler l’API', async () => {
    const api = mockApi({ 'GET /api/auth/me': () => Response.json({}, { status: 401 }) });
    const { user } = renderLogin();

    await user.click(await screen.findByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(api).not.toHaveBeenCalledWith('/api/auth/login', expect.anything());
  });

  it('affiche l’erreur renvoyée par l’API', async () => {
    mockApi({
      'GET /api/auth/me': () => Response.json({}, { status: 401 }),
      'POST /api/auth/login': () =>
        Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 }),
    });
    const { user } = renderLogin();

    await user.type(await screen.findByLabelText('Email'), 'ada@test.local');
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect');
  });

  it('redirige vers la page demandée après connexion', async () => {
    mockApi({
      'GET /api/auth/me': () => Response.json({}, { status: 401 }),
      'POST /api/auth/login': () =>
        Response.json({ id: 'u1', email: 'ada@test.local', name: 'Ada', role: 'customer' }),
    });
    const { user } = renderLogin('/connexion?redirect=%2Fcommande');

    await user.type(await screen.findByLabelText('Email'), 'ada@test.local');
    await user.type(screen.getByLabelText('Mot de passe'), 'bon-mot-de-passe');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Page commande')).toBeInTheDocument();
  });
});
