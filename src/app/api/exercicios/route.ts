import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const exercicios = await sql`
      SELECT id, nome, nome_personalizado, grupo_muscular, video_url, gif_url, slug
      FROM exercicios
      ORDER BY grupo_muscular, nome
    `;
    return NextResponse.json({ exercicios });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nome_personalizado, video_url, gif_url } = await request.json();
    await sql`
      UPDATE exercicios
      SET
        nome_personalizado = ${nome_personalizado},
        video_url = COALESCE(${video_url}, video_url),
        gif_url = COALESCE(${gif_url}, gif_url)
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
