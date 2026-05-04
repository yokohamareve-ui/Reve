import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const PER_PAGE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // cast・staff ロールの profiles を casts と JOIN して取得
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('id, role, cast_id, created_at, casts(name)')
    .in('role', ['cast', 'staff']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auth ユーザー一覧からメールアドレスを取得（ページネーション付き）
  const { data: authData, error: usersError } = await adminClient.auth.admin.listUsers({
    page,
    perPage: PER_PAGE,
  });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const emailMap = new Map(authData.users.map((u) => [u.id, u.email ?? '']));

  // 今ページのAuthユーザーIDに絞ってprofilesをフィルタ
  const pageUserIds = new Set(authData.users.map((u) => u.id));
  const pageProfiles = (profiles ?? []).filter((p) => pageUserIds.has(p.id));

  const accounts = pageProfiles.map((p) => ({
    user_id: p.id,
    email: emailMap.get(p.id) ?? '',
    role: p.role,
    cast_id: p.cast_id,
    cast_name: (p.casts as unknown as { name: string } | null)?.name ?? null,
    created_at: p.created_at,
  }));

  const total = authData.total ?? null;

  return NextResponse.json({ accounts, page, perPage: PER_PAGE, total });
}
