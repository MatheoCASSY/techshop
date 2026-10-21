import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTestApp,
  createUser,
  login,
  PASSWORD,
  prisma,
  resetDb,
  type TestApp,
} from '../../test/helpers.js';
import { AUTH_COOKIE } from '../plugins/auth.js';

let app: TestApp;

beforeAll(async () => {
  app = await buildTestApp();
});
beforeEach(resetDb);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const register = (payload: object) =>
  app.inject({ method: 'POST', url: '/api/auth/register', payload });

describe('POST /api/auth/register', () => {
  it('crée le compte, ouvre la session et ne renvoie jamais le hash', async () => {
    const response = await register({ email: 'Ada@Test.local', name: 'Ada', password: PASSWORD });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: expect.any(String),
      email: 'ada@test.local',
      name: 'Ada',
      role: 'customer',
    });
    expect(response.body).not.toContain('passwordHash');

    const cookie = response.cookies.find((c) => c.name === AUTH_COOKIE);
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
  });

  it('refuse un email déjà utilisé, quelle que soit la casse', async () => {
    await createUser({ email: 'ada@test.local' });
    const response = await register({ email: 'ADA@test.local', name: 'Ada', password: PASSWORD });

    expect(response.statusCode).toBe(409);
  });

  it('valide les données et détaille les erreurs', async () => {
    const response = await register({ email: 'pas-un-email', name: 'A', password: 'court' });

    expect(response.statusCode).toBe(400);
    const paths = response.json<{ issues: { path: string }[] }>().issues.map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });

  it('ignore une tentative de s’attribuer le rôle admin', async () => {
    const response = await register({
      email: 'malin@test.local',
      name: 'Malin',
      password: PASSWORD,
      role: 'admin',
    });

    expect(response.json()).toMatchObject({ role: 'customer' });
  });
});

describe('POST /api/auth/login', () => {
  it('connecte avec les bons identifiants', async () => {
    const user = await createUser();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: user.email, password: PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: user.id });
  });

  it('renvoie le même message pour un mauvais mot de passe et un email inconnu', async () => {
    const user = await createUser();
    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: user.email, password: 'mauvais' },
    });
    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'inconnu@test.local', password: 'mauvais' },
    });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.json()).toEqual(unknownEmail.json());
  });
});

describe('GET /api/auth/me', () => {
  it('exige une session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(response.statusCode).toBe(401);
  });

  it('renvoie l’utilisateur connecté', async () => {
    const user = await createUser();
    const cookies = await login(app, user.email);
    const response = await app.inject({ method: 'GET', url: '/api/auth/me', cookies });

    expect(response.json()).toMatchObject({ id: user.id, email: user.email });
  });

  it('refuse un jeton falsifié', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { [AUTH_COOKIE]: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.falsifie' },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('efface le cookie de session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    const cookie = response.cookies.find((c) => c.name === AUTH_COOKIE);

    expect(response.statusCode).toBe(204);
    expect(cookie?.value).toBe('');
  });
});

describe('limitation de débit', () => {
  let limitedApp: TestApp;

  beforeAll(async () => {
    limitedApp = await buildTestApp({ AUTH_RATE_LIMIT: 2 });
  });
  afterAll(() => limitedApp.close());

  it('bloque les tentatives de connexion répétées (force brute)', async () => {
    const attempt = () =>
      limitedApp.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'cible@test.local', password: 'essai' },
      });
    await attempt();
    await attempt();
    const third = await attempt();

    expect(third.statusCode).toBe(429);
  });
});
