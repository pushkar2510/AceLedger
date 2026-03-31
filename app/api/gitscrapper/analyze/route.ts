import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const githubHeaders = (): HeadersInit => {
  const h: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) (h as Record<string, string>)['Authorization'] = `token ${GITHUB_TOKEN}`;
  return h;
};

// Retry helper for GitHub's 202 Accepted (stats being computed)
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: githubHeaders() });
    if (res.status === 200) return res.json();
    if (res.status === 202) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    if (res.status === 404) throw Object.assign(new Error('Repository not found or is private'), { status: 404 });
    if (res.status === 403) throw Object.assign(new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to your environment for higher limits.'), { status: 429 });
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return []; // stats not ready after retries
}

export async function POST(request: Request) {
  try {
    const { owner, repo } = await request.json();
    if (!owner || !repo) {
      return NextResponse.json({ message: 'Owner and repo are required' }, { status: 400 });
    }

    // Fetch contributor stats
    const contributorsData = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/stats/contributors`
    );

    const contributors = Array.isArray(contributorsData)
      ? contributorsData.map((c: any) => {
          let linesAdded = 0, linesDeleted = 0;
          c.weeks.forEach((w: any) => { linesAdded += w.a; linesDeleted += w.d; });
          const commits = c.total;
          const score = commits * 2 + linesAdded * 0.5;
          return {
            login: c.author?.login || 'Unknown',
            avatar_url: c.author?.avatar_url || '',
            commits,
            linesAdded,
            linesDeleted,
            score,
            weeks: c.weeks, // keep for report template
          };
        }).sort((a: any, b: any) => b.score - a.score)
      : [];

    // Fetch commit activity
    let commitsByDate: { date: string; commits: number }[] = [];
    try {
      const activity = await fetchWithRetry(
        `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`
      );
      if (Array.isArray(activity)) {
        activity.forEach((week: any) => {
          if (week.total > 0) {
            commitsByDate.push({
              date: new Date(week.week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              commits: week.total,
            });
          }
        });
      }
    } catch (_) {}

    const summary = {
      totalContributors: contributors.length,
      totalCommits: contributors.reduce((s: number, c: any) => s + c.commits, 0),
      totalLinesAdded: contributors.reduce((s: number, c: any) => s + c.linesAdded, 0),
      totalLinesDeleted: contributors.reduce((s: number, c: any) => s + c.linesDeleted, 0),
    };

    return NextResponse.json({ summary, contributors, commitsByDate });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ message: error.message || 'Failed to analyze repository' }, { status });
  }
}
