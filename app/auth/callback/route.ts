import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /auth/callback
 * Google OAuth 콜백 핸들러
 * - code 교환으로 Supabase Auth 세션 생성
 * - 첫 가입 시 family + parent 프로필 자동 생성
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profiles';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 이 사용자가 이미 가족을 소유하고 있는지 확인
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingFamily } = await (admin as any)
    .from('families')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .single();

  if (!existingFamily) {
    // 첫 가입: 가족 + 부모 프로필 자동 생성
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Parent';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: family, error: familyError } = await (admin as any)
      .from('families')
      .insert({
        name: `${displayName}의 가족`,
        owner_id: user.id,
      })
      .select()
      .single();

    if (familyError || !family) {
      console.error('Failed to create family:', familyError);
      return NextResponse.redirect(`${origin}/login?error=family_creation_failed`);
    }

    // 부모 프로필 자동 생성 (PIN 없음)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin as any)
      .from('profiles')
      .insert({
        name: displayName,
        role: 'parent',
        family_id: family.id,
        avatar_url: user.user_metadata?.avatar_url || null,
      });

    if (profileError) {
      console.error('Failed to create parent profile:', profileError);
    }
  }

  return response;
}
