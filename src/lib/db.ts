import { neon } from '@neondatabase/serverless';

export function getDbPerio() {
  if (!process.env.NEON_PERIO_URL) throw new Error('NEON_PERIO_URL not set');
  return neon(process.env.NEON_PERIO_URL);
}

export function getDbTreinos() {
  if (!process.env.NEON_TREINOS_URL) throw new Error('NEON_TREINOS_URL not set');
  return neon(process.env.NEON_TREINOS_URL);
}

export function getDb() {
  if (!process.env.NEON_DATABASE_URL) throw new Error('NEON_DATABASE_URL not set');
  return neon(process.env.NEON_DATABASE_URL);
}
