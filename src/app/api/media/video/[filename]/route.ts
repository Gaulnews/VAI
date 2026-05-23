import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const slug = filename.replace('.mp4', '');

    // Buscar URL customizada no banco
    const rows = await sql`
      SELECT video_url, nome_personalizado, nome FROM exercicios
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length > 0 && rows[0].video_url && !rows[0].video_url.startsWith('/api/')) {
      // Redirecionar para URL externa (Drive ou Cloudflare)
      return NextResponse.redirect(rows[0].video_url);
    }

    // Tentar Google Drive via ID mapeado
    const mediaRows = await sql`
      SELECT drive_video_id, video_url_custom FROM media_map
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (mediaRows.length > 0) {
      if (mediaRows[0].video_url_custom) {
        return NextResponse.redirect(mediaRows[0].video_url_custom);
      }
      if (mediaRows[0].drive_video_id) {
        const driveUrl = `https://drive.google.com/uc?export=download&id=${mediaRows[0].drive_video_id}`;
        return NextResponse.redirect(driveUrl);
      }
    }

    // Fallback: retornar 404 com JSON explicativo
    return NextResponse.json(
      { error: 'Mídia não encontrada', slug, hint: 'Cadastre a URL do vídeo em /exercicios-editor' },
      { status: 404 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
