// Vitest global setup — se ejecuta una vez antes de toda la suite.
// Stub de consola para tests silenciosos, carga de env vars fake.

process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_SECRET = 'test-secret-do-not-use-in-prod-aaaaaaaaaaaaaaaa';
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:4321';
process.env.RESEND_API_KEY = 're_test_xxxxxxxxxxxx';
process.env.CONTACT_EMAIL = 'test@nxstudio.dev';
