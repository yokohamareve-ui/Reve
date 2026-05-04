import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const secret = searchParams.get('secret');
  const draftKey = searchParams.get('draftKey');
  const contentType = searchParams.get('contentType');
  const slug = searchParams.get('slug');

  // Verify secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    );
  }

  if (!draftKey) {
    return NextResponse.json(
      { message: 'draftKey is required' },
      { status: 400 }
    );
  }

  // Enable Draft Mode
  draftMode().enable();

  // Determine redirect path based on contentType
  let redirectPath = '/';

  switch (contentType) {
    case 'cast':
      redirectPath = slug ? `/cast/${slug}` : '/cast';
      break;
    case 'news':
      redirectPath = slug ? `/news/${slug}` : '/news';
      break;
    case 'schedule':
      redirectPath = '/schedule';
      break;
    case 'gallery':
      redirectPath = '/gallery';
      break;
    case 'shop':
      redirectPath = '/system';
      break;
    default:
      redirectPath = '/';
      break;
  }

  // Append draftKey to URL so the page can use it
  const url = new URL(redirectPath, request.url);
  url.searchParams.set('draftKey', draftKey);

  return NextResponse.redirect(url);
}
