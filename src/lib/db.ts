import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Lazy init: only construct neon() at runtime to avoid build-time failures
// when env vars are absent during `next build`'s page data collection.
let _sql: NeonQueryFunction<false, false> | null = null;
function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url =
    process.env.NEON_TREINOS_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL_TREINOS ||
    process.env.DATABASE_URL ||
    '';
  if (!url) throw new Error('NEON_TREINOS_URL, NEON_DATABASE_URL, DATABASE_URL_TREINOS, or DATABASE_URL must be set');
  _sql = neon(url);
  return _sql;
}

export const sql: NeonQueryFunction<false, false> = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_t, _this, args) {
    // @ts-expect-error - forward tagged-template args
    return getSql()(...args);
  },
  get(_t, prop) {
    // @ts-expect-error - forward property access (transaction, etc.)
    return getSql()[prop];
  },
}) as NeonQueryFunction<false, false>;

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS exercicios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      nome_personalizado TEXT,
      grupo_muscular TEXT NOT NULL,
      video_url TEXT,
      gif_url TEXT,
      slug TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessoes_treino (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      nome TEXT NOT NULL,
      aluno TEXT,
      data_treino DATE DEFAULT CURRENT_DATE,
      exercicios JSONB NOT NULL DEFAULT '[]',
      observacoes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS media_map (
      slug TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      drive_video_id TEXT,
      drive_gif_id TEXT,
      video_url_custom TEXT,
      gif_url_custom TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export type Exercicio = {
  id: number;
  nome: string;
  nome_personalizado?: string;
  grupo_muscular: string;
  video_url?: string;
  gif_url?: string;
  slug?: string;
};

export type SessaoTreino = {
  id: string;
  nome: string;
  aluno?: string;
  data_treino: string;
  exercicios: ExercicioSessao[];
  observacoes?: string;
  created_at: string;
};

export type ExercicioSessao = {
  exercicio_id: number;
  nome: string;
  grupo_muscular: string;
  series: number;
  repeticoes: string;
  carga?: number;
  descanso?: number;
  video_url?: string;
  gif_url?: string;
  observacao?: string;
};
