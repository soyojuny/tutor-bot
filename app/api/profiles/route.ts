import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  handleApiError,
  getFamilyIdFromAuthUser,
} from '@/lib/api/helpers';
import { getSessionFromRequest } from '@/lib/auth/session';
import { hashPin } from '@/lib/utils/auth';

/**
 * GET /api/profiles
 * 프로필 목록 조회
 * - 프로필 세션 있음: 같은 가족의 프로필만 반환
 * - Google 인증만 있음: 가족 프로필 반환 (프로필 선택 페이지용)
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    // 프로필 세션 확인
    const session = await getSessionFromRequest(request);
    let familyId: string | null = session?.familyId ?? null;

    // 프로필 세션 없으면 Google Auth에서 가족 ID 조회
    if (!familyId) {
      familyId = await getFamilyIdFromAuthUser(request);
    }

    if (!familyId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 해당 가족의 프로필만 조회 (pin_code 제외)
    let query = supabase
      .from('profiles')
      .select('id, name, role, age, avatar_url, pin_code, family_id, created_at')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (role) {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: '프로필 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // pin_code는 해시값 대신 설정 여부만 반환
    const safeProfiles = (profiles || []).map((p: {
      id: string;
      name: string;
      role: string;
      age: number | null;
      avatar_url: string | null;
      pin_code: string | null;
      family_id: string;
      created_at: string;
    }) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      age: p.age,
      avatar_url: p.avatar_url,
      has_pin: !!p.pin_code,
      family_id: p.family_id,
      created_at: p.created_at,
    }));

    return NextResponse.json({ profiles: safeProfiles });
  } catch (error) {
    return handleApiError(error, 'GET /api/profiles');
  }
}

/**
 * POST /api/profiles
 * 새 프로필 생성
 * - 부모 프로필 세션이 있으면 해당 가족에 생성
 * - 프로필 세션 없으면 Google OAuth로 가족 소유자 확인 (프로필 선택 화면에서 생성 시)
 */
export async function POST(request: NextRequest) {
  try {
    // 부모 프로필 세션 먼저 확인
    const session = await getSessionFromRequest(request);
    let familyId: string | null = null;

    if (session && session.role === 'parent') {
      familyId = session.familyId;
    }

    // 프로필 세션 없으면 Google OAuth로 가족 소유자 확인
    if (!familyId) {
      familyId = await getFamilyIdFromAuthUser(request);
    }

    if (!familyId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, role, age, pin } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: '이름과 역할은 필수입니다.' },
        { status: 400 }
      );
    }

    if (role !== 'parent' && role !== 'child') {
      return NextResponse.json(
        { error: '역할은 parent 또는 child여야 합니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // PIN 해싱 (제공된 경우)
    let hashedPin: string | null = null;
    if (pin) {
      hashedPin = await hashPin(pin);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        name,
        role,
        age: age ?? null,
        pin_code: hashedPin,
        family_id: familyId,
      })
      .select('id, name, role, age, avatar_url, family_id, created_at')
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: '프로필 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/profiles');
  }
}
