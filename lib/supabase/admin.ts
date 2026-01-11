import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * API 라우트에서 사용하는 Service Role Key를 가진 관리자 클라이언트
 * RLS를 우회하여 데이터베이스 작업을 수행합니다.
 * 
 * ⚠️ 주의: 이 클라이언트는 서버 사이드에서만 사용해야 하며,
 * 클라이언트 사이드에 노출되면 안 됩니다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
