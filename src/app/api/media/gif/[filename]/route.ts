import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const slug = filename.replace('.gif', '');

    const rows = await sql`
      SELECT gif_url, nome FROM exercicios
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows.length > 0 && rows[0].gif_url && !rows[0].gif_url.startsWith('/api/')) {
      return NextResponse.redirect(rows[0].gif_url);
    }

    const mediaRows = await sql`
      SELECT drive_gif_id, gif_url_custom FROM media_map
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (mediaRows.length > 0) {
      if (mediaRows[0].gif_url_custom) {
        return NextResponse.redirect(mediaRows[0].gif_url_custom);
      }
      if (mediaRows[0].drive_gif_id) {
        const driveUrl = `https://drive.google.com/uc?export=view&id=${mediaRows[0].drive_gif_id}`;
        return NextResponse.redirect(driveUrl);
      }
    }

    return NextResponse.json(
      { error: 'GIF não encontrado', slug },
      { status: 404 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
