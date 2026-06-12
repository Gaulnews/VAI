import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { grupos_musculares, total_exercicios, series_padrao, repeticoes_padrao, descanso_padrao } = await request.json();

    let exercicios;
    if (grupos_musculares && grupos_musculares.length > 0) {
      exercicios = await sql`
        SELECT id, nome, nome_personalizado, grupo_muscular, video_url, gif_url, slug
        FROM exercicios
        WHERE grupo_muscular = ANY(${grupos_musculares})
        ORDER BY RANDOM()
        LIMIT ${total_exercicios || 6}
      `;
    } else {
      exercicios = await sql`
        SELECT id, nome, nome_personalizado, grupo_muscular, video_url, gif_url, slug
        FROM exercicios
        ORDER BY RANDOM()
        LIMIT ${total_exercicios || 6}
      `;
    }

    const sessaoExercicios = (exercicios as any[]).map((ex) => ({
      exercicio_id: ex.id,
      nome: ex.nome_personalizado || ex.nome,
      grupo_muscular: ex.grupo_muscular,
      series: series_padrao || 3,
      repeticoes: repeticoes_padrao || '8-12',
      descanso: descanso_padrao || 60,
      video_url: ex.video_url,
      gif_url: ex.gif_url,
    }));

    return NextResponse.json({ exercicios: sessaoExercicios });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
