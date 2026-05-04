import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// POST /api/revalidate
// body: { type: 'cast' | 'news' | 'schedule' | 'shop' | 'gallery', secret: string }
export async function POST(request: NextRequest) {
  let body: { type?: string; secret?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  // Verify secret
  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const type = body.type ?? '';

  try {
    switch (type) {
      case 'cast':
        revalidatePath('/cast', 'layout');
        revalidatePath('/', 'page');
        break;

      case 'news':
        revalidatePath('/news', 'layout');
        revalidatePath('/', 'page');
        break;

      case 'schedule':
        revalidatePath('/schedule', 'page');
        revalidatePath('/', 'page');
        break;

      case 'shop':
        revalidatePath('/', 'page');
        revalidatePath('/system', 'page');
        revalidatePath('/access', 'page');
        revalidatePath('/recruit', 'page');
        break;

      case 'gallery':
        revalidatePath('/gallery', 'page');
        break;

      default:
        // Revalidate all
        revalidatePath('/', 'layout');
        break;
    }

    return NextResponse.json({
      revalidated: true,
      type,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) },
      { status: 500 }
    );
  }
}
