import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { hashPin } from '@/lib/utils/auth';

/**
 * PATCH /api/profiles/[id]
 * 프로필 수정
 * - 부모: 모든 필드 수정 가능
 * - 아이: 자기 자신의 avatar_url만 변경 가능
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

    const { id } = await params;
    const body = await request.json();

    // 아이가 자기 아바타만 변경하는 경우
    if (session.role === 'child') {
      if (id !== session.userId) {
        return NextResponse.json(
          { error: '자신의 프로필만 수정할 수 있습니다.' },
          { status: 403 }
        );
      }

      // 아이는 avatar_url만 변경 가능
      const { avatar_url } = body;
      if (avatar_url === undefined) {
        return NextResponse.json(
          { error: '변경 가능한 필드가 없습니다.' },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createAdminClient() as any;
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('family_id', session.familyId)
        .select('id, name, role, age, avatar_url, family_id, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error updating profile avatar:', error);
        return NextResponse.json(
          { error: '프로필 수정에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile });
    }

    // 부모만 전체 필드 수정 가능
    if (session.role !== 'parent') {
      return NextResponse.json(
        { error: '부모만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { name, role, age, pin, remove_pin, avatar_url } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      if (role !== 'parent' && role !== 'child') {
        return NextResponse.json(
          { error: '역할은 parent 또는 child여야 합니다.' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (age !== undefined) updateData.age = age;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // PIN 처리
    if (remove_pin) {
      updateData.pin_code = null;
    } else if (pin) {
      updateData.pin_code = await hashPin(pin);
    }

    updateData.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('family_id', session.familyId)
      .select('id, name, role, age, avatar_url, family_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/profiles/[id]');
  }
}

/**
 * DELETE /api/profiles/[id]
 * 프로필 삭제 (부모만 가능, 자기 자신은 삭제 불가)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

    if (session.role !== 'parent') {
      return NextResponse.json(
        { error: '부모만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 자기 자신은 삭제 불가
    if (id === session.userId) {
      return NextResponse.json(
        { error: '자기 자신의 프로필은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('family_id', session.familyId);

    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json(
        { error: '프로필 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/profiles/[id]');
  }
}
