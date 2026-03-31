import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { owner, repo, contributor, totalCommits, totalContributors, rank } = await request.json();
    if (!owner || !repo || !contributor) {
      return NextResponse.json({ message: 'Missing report data' }, { status: 400 });
    }

    const repoId = `${owner}/${repo}`;
    const generatedAt = new Date().toISOString();
    const certId = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certHashInput = `${contributor.login}-${repoId}-${contributor.score}-${generatedAt}`;
    const certHash = crypto.createHash('sha256').update(certHashInput).digest('hex').substring(0, 16);

    // Content hash for verification
    const contentPayload = JSON.stringify({
      login: contributor.login,
      repo: repoId,
      commits: contributor.commits,
      linesAdded: contributor.linesAdded,
      linesDeleted: contributor.linesDeleted,
      score: contributor.score,
      rank,
      generatedAt,
    });
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    // Store verification record in Supabase
    try {
      const supabase = await createClient();
      await supabase.from('report_verification').insert({
        report_id: certId,
        contributor_login: contributor.login,
        repo: repoId,
        content_hash: contentHash,
        file_hash: null,
        blockchain_txn: null,
      });
    } catch (_) {
      // Non-fatal: report generation still succeeds even if DB insert fails
    }

    return NextResponse.json({
      certId,
      certHash,
      contentHash,
      generatedAt,
      repoId,
      rank,
      totalContributors,
      totalCommits,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
