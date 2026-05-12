import { NextResponse } from 'next/server';
import { getAdminUsers } from '@/lib/cloudflare-d1';

export async function GET() {
  try {
    const users = await getAdminUsers();
    return NextResponse.json(users, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: 'error',
        summary: { total: 0, active: 0, pending: 0 },
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
