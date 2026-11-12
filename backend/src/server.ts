import { createApp } from './app';
import { pool } from './config/database';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Sweety API listening on http://localhost:${env.port}`);
  console.log(`Swagger docs available at http://localhost:${env.port}/api/docs`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing HTTP server and PostgreSQL pool...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

