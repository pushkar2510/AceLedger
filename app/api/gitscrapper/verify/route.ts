import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { reportId } = await request.json();
    if (!reportId) {
      return NextResponse.json({ message: 'Report ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('report_verification')
      .select('*')
      .eq('report_id', reportId.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ verified: false, message: 'No report found with this Certificate ID.' });
    }

    return NextResponse.json({
      verified: true,
      message: 'Report is authentic and verified.',
      details: {
        contributor: data.contributor_login,
        repo: data.repo,
        contentHash: data.content_hash,
        fileHash: data.file_hash,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}
