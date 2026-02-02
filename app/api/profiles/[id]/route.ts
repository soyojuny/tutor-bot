import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withParent, isErrorResponse, handleApiError, assertProfileInFamily } from '@/lib/api/helpers';
import { hashPin } from '@/lib/utils/auth';

/**
 * PATCH /api/profiles/[id]
 * 프로필 수정 (부모만 가능)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const { id } = await params;

    // 가족 범위 확인
    if (!await assertProfileInFamily(id, session.familyId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role, age, pin, remove_pin } = body;

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
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const { id } = await params;

    // 자기 자신은 삭제 불가
    if (id === session.userId) {
      return NextResponse.json(
        { error: '자기 자신의 프로필은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 가족 범위 확인
    if (!await assertProfileInFamily(id, session.familyId)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

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
