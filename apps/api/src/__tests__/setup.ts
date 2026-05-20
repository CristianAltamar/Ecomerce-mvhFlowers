// Setup global para tests. Garantiza que las variables de entorno mínimas existan
// antes de que se cargue src/config/env.ts.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/mvh_test';
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_minimum_32_characters_long_x';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_minimum_32_characters_long_x';
process.env.LOG_LEVEL ??= 'fatal';
