import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, aluno, data_treino, exercicios, observacoes } = body;

    const result = await sql`
      INSERT INTO sessoes_treino (nome, aluno, data_treino, exercicios, observacoes)
      VALUES (
        ${nome},
        ${aluno || null},
        ${data_treino || new Date().toISOString().split('T')[0]},
        ${JSON.stringify(exercicios)},
        ${observacoes || null}
      )
      RETURNING id
    `;

    return NextResponse.json({ ok: true, id: result[0].id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const rows = await sql`
        SELECT * FROM sessoes_treino WHERE id = ${id}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
      }
      return NextResponse.json({ sessao: rows[0] });
    }

    const rows = await sql`
      SELECT id, nome, aluno, data_treino, created_at,
        jsonb_array_length(exercicios) as total_exercicios
      FROM sessoes_treino
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ sessoes: rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
