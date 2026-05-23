import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
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

    // Seed exercícios se a tabela estiver vazia
    const existing = await sql`SELECT COUNT(*) as count FROM exercicios`;
    if (parseInt(existing[0].count) === 0) {
      const exercicios = [
        { nome: 'Supino Reto com Barra', grupo: 'Peito', slug: 'supino-reto-com-barra' },
        { nome: 'Supino Inclinado com Halteres', grupo: 'Peito', slug: 'supino-inclinado-com-halteres' },
        { nome: 'Crucifixo Reto', grupo: 'Peito', slug: 'crucifixo-reto' },
        { nome: 'Peck Deck', grupo: 'Peito', slug: 'peck-deck' },
        { nome: 'Flexão de Braços', grupo: 'Peito', slug: 'flexao-de-bracos' },
        { nome: 'Supino Declinado com Barra', grupo: 'Peito', slug: 'supino-declinado-com-barra' },
        { nome: 'Crossover Cabo Alto', grupo: 'Peito', slug: 'crossover-cabo-alto' },
        { nome: 'Pullover com Halter', grupo: 'Peito', slug: 'pullover-com-halter' },
        { nome: 'Puxada Alta Frente', grupo: 'Costas', slug: 'puxada-alta-frente' },
        { nome: 'Remada Curvada com Barra', grupo: 'Costas', slug: 'remada-curvada-com-barra' },
        { nome: 'Remada Unilateral com Halter', grupo: 'Costas', slug: 'remada-unilateral-com-halter' },
        { nome: 'Pulldown Cabo', grupo: 'Costas', slug: 'pulldown-cabo' },
        { nome: 'Remada Serrote', grupo: 'Costas', slug: 'remada-serrote' },
        { nome: 'Pull-Up Barra Fixa', grupo: 'Costas', slug: 'pull-up-barra-fixa' },
        { nome: 'Desenvolvimento com Halteres', grupo: 'Ombro', slug: 'desenvolvimento-com-halteres' },
        { nome: 'Elevação Lateral', grupo: 'Ombro', slug: 'elevacao-lateral' },
        { nome: 'Elevação Frontal', grupo: 'Ombro', slug: 'elevacao-frontal' },
        { nome: 'Encolhimento de Ombros', grupo: 'Ombro', slug: 'encolhimento-de-ombros' },
        { nome: 'Prancha Abdominal', grupo: 'Core', slug: 'prancha-abdominal' },
        { nome: 'Abdominal Crunch', grupo: 'Core', slug: 'abdominal-crunch' },
        { nome: 'Rotação Russa', grupo: 'Core', slug: 'rotacao-russa' },
        { nome: 'Abdominal Infra', grupo: 'Core', slug: 'abdominal-infra' },
        { nome: 'Rosca Direta com Barra', grupo: 'Bíceps', slug: 'rosca-direta-com-barra' },
        { nome: 'Rosca Alternada com Halteres', grupo: 'Bíceps', slug: 'rosca-alternada-com-halteres' },
        { nome: 'Rosca Martelo', grupo: 'Bíceps', slug: 'rosca-martelo' },
        { nome: 'Rosca Concentrada', grupo: 'Bíceps', slug: 'rosca-concentrada' },
        { nome: 'Tríceps Pulley', grupo: 'Tríceps', slug: 'triceps-pulley' },
        { nome: 'Tríceps Francês', grupo: 'Tríceps', slug: 'triceps-frances' },
        { nome: 'Mergulho entre Bancos', grupo: 'Tríceps', slug: 'mergulho-entre-bancos' },
        { nome: 'Tríceps Testa', grupo: 'Tríceps', slug: 'triceps-testa' },
        { nome: 'Agachamento Livre', grupo: 'Quadríceps', slug: 'agachamento-livre' },
        { nome: 'Leg Press 45', grupo: 'Quadríceps', slug: 'leg-press-45' },
        { nome: 'Extensão de Joelhos', grupo: 'Quadríceps', slug: 'extensao-de-joelhos' },
        { nome: 'Flexão de Joelhos', grupo: 'Isquiotibiais', slug: 'flexao-de-joelhos' },
        { nome: 'Stiff com Barra', grupo: 'Isquiotibiais', slug: 'stiff-com-barra' },
        { nome: 'Agachamento Sumô', grupo: 'Glúteo', slug: 'agachamento-sumo' },
        { nome: 'Elevação Pélvica com Barra', grupo: 'Glúteo', slug: 'elevacao-pelvica-com-barra' },
        { nome: 'Avanço com Halteres', grupo: 'Glúteo', slug: 'avanco-com-halteres' },
        { nome: 'Abdução de Quadril', grupo: 'Glúteo', slug: 'abducao-de-quadril' },
      ];

      for (const ex of exercicios) {
        await sql`
          INSERT INTO exercicios (nome, nome_personalizado, grupo_muscular, video_url, gif_url, slug)
          VALUES (
            ${ex.nome},
            ${ex.nome},
            ${ex.grupo},
            ${'/api/media/video/' + ex.slug + '.mp4'},
            ${'/api/media/gif/' + ex.slug + '.gif'},
            ${ex.slug}
          ) ON CONFLICT (slug) DO NOTHING
        `;
      }
    }

    return NextResponse.json({ ok: true, message: 'Banco inicializado com sucesso' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
