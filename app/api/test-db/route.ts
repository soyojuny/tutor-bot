import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClient();

    // Test connection by fetching profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profileCount: profiles?.length || 0,
      profiles,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
