import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Endpoint para cadastrar URLs de mídia diretamente no banco
export async function POST(request: NextRequest) {
  try {
    const { slug, drive_video_id, drive_gif_id, video_url_custom, gif_url_custom } = await request.json();

    await sql`
      INSERT INTO media_map (slug, nome, drive_video_id, drive_gif_id, video_url_custom, gif_url_custom)
      VALUES (
        ${slug},
        ${slug},
        ${drive_video_id || null},
        ${drive_gif_id || null},
        ${video_url_custom || null},
        ${gif_url_custom || null}
      )
      ON CONFLICT (slug) DO UPDATE SET
        drive_video_id = COALESCE(${drive_video_id || null}, media_map.drive_video_id),
        drive_gif_id = COALESCE(${drive_gif_id || null}, media_map.drive_gif_id),
        video_url_custom = COALESCE(${video_url_custom || null}, media_map.video_url_custom),
        gif_url_custom = COALESCE(${gif_url_custom || null}, media_map.gif_url_custom),
        updated_at = NOW()
    `;

    // Também atualizar a tabela exercicios se tiver url_custom
    if (video_url_custom || gif_url_custom) {
      await sql`
        UPDATE exercicios SET
          video_url = COALESCE(${video_url_custom || null}, video_url),
          gif_url = COALESCE(${gif_url_custom || null}, gif_url)
        WHERE slug = ${slug}
      `;
    }

    return NextResponse.json({ ok: true, slug });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM media_map ORDER BY slug`;
    return NextResponse.json({ media_map: rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
