'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Loader2, AlertCircle, Users, GitCommit,
  Code, Activity, Trophy, Star, Award, Download, ShieldCheck,
  ShieldX, ArrowLeft, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { generateReportHTML } from '@/lib/gitscrapper-report-template';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Contributor {
  login: string;
  avatar_url: string;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  score: number;
  weeks?: any[];
}

interface RepoData {
  summary: {
    totalContributors: number;
    totalCommits: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
  };
  contributors: Contributor[];
  commitsByDate: { date: string; commits: number }[];
  owner: string;
  repo: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalyticsCards({ summary }: { summary: RepoData['summary'] }) {
  const cards = [
    { label: 'Contributors', value: summary.totalContributors, icon: <Users className="h-4 w-4 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Total Commits', value: summary.totalCommits, icon: <GitCommit className="h-4 w-4 text-emerald-500" />, color: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Lines Added', value: `+${summary.totalLinesAdded.toLocaleString()}`, icon: <Code className="h-4 w-4 text-violet-500" />, color: 'bg-violet-50 dark:bg-violet-950' },
    { label: 'Lines Deleted', value: `-${summary.totalLinesDeleted.toLocaleString()}`, icon: <Activity className="h-4 w-4 text-red-500" />, color: 'bg-red-50 dark:bg-red-950' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-lg p-3 flex items-center gap-3 ${c.color}`}>
          <div className="shrink-0">{c.icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="font-bold text-sm">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommitChart({ data }: { data: { date: string; commits: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-3">Commit Activity</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="commits" stroke="#3b82f6" strokeWidth={2} fill="url(#cg)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CommitsBarChart({ contributors }: { contributors: Contributor[] }) {
  const top5 = contributors.slice(0, 5).map(c => ({ name: c.login, commits: c.commits }));
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-3">Commits by User</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={top5} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="var(--border)" />
          <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
          <Tooltip />
          <Bar dataKey="commits" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Star className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs text-muted-foreground font-mono">#{rank}</span>;
}

function Leaderboard({
  contributors, owner, repo, summary, onVerify,
}: {
  contributors: Contributor[];
  owner: string;
  repo: string;
  summary: RepoData['summary'];
  onVerify: (certId: string) => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (contributor: Contributor, rank: number) => {
    setDownloading(contributor.login);
    try {
      const res = await fetch('/api/gitscrapper/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner, repo, contributor,
          totalCommits: summary.totalCommits,
          totalContributors: summary.totalContributors,
          rank,
        }),
      });
      const meta = await res.json();
      if (!res.ok) throw new Error(meta.message);

      // Generate PDF client-side using html2pdf.js
      const html = generateReportHTML(
        contributor,
        { owner, repo, summary: { totalCommits: meta.totalCommits, totalContributors: meta.totalContributors } },
        rank,
        meta.certId,
        meta.certHash,
        meta.generatedAt,
        typeof window !== 'undefined' ? window.location.origin : 'https://skillbridge.app'
      );

      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      await html2pdf()
        .set({ margin: 0, filename: `report_${contributor.login}_${meta.certId}.pdf`, html2canvas: { scale: 2, useCORS: true }, jsPDF: { format: 'a4' } })
        .from(container)
        .save();

      document.body.removeChild(container);
      onVerify(meta.certId);
    } catch (err: any) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <p className="font-semibold text-sm">Contributor Leaderboard</p>
      </div>
      <div className="divide-y max-h-72 overflow-y-auto">
        {contributors.map((c, i) => {
          const rank = i + 1;
          const pct = ((c.commits / (summary.totalCommits || 1)) * 100).toFixed(1);
          return (
            <div key={c.login} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="w-6 flex justify-center shrink-0"><RankBadge rank={rank} /></div>
              {/* Using native img to avoid next/image domain config issues for avatars */}
              <img src={c.avatar_url} alt={c.login} className="h-8 w-8 rounded-full shrink-0" onError={e => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${c.login}`)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.login}</p>
                <p className="text-xs text-muted-foreground">{c.commits} commits · {pct}%</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <Badge variant="secondary" className="text-xs">{Math.round(c.score).toLocaleString()} pts</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-7 text-xs gap-1"
                disabled={downloading === c.login}
                onClick={() => handleDownload(c, rank)}
              >
                {downloading === c.login ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Report
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerifyPanel({ initialReportId = '' }: { initialReportId?: string }) {
  const [reportId, setReportId] = useState(initialReportId);
  
  // Sync if prop changes late
  useEffect(() => {
    if (initialReportId) setReportId(initialReportId);
  }, [initialReportId]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Auto-verify if an initial ID is provided
  useEffect(() => {
    if (initialReportId) {
      const verify = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/gitscrapper/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId: initialReportId }),
          });
          setResult(await res.json());
        } catch {
          setResult({ verified: false, message: 'Network error.' });
        } finally {
          setLoading(false);
        }
      };
      verify();
    }
  }, [initialReportId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/gitscrapper/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });
      setResult(await res.json());
    } catch {
      setResult({ verified: false, message: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter a Certificate ID from a downloaded report to verify its authenticity.</p>
      <form onSubmit={handleVerify} className="flex gap-2">
        <Input
          placeholder="Certificate ID (e.g. A3F9BC01)"
          value={reportId}
          onChange={e => setReportId(e.target.value.toUpperCase())}
          className="font-mono tracking-widest"
        />
        <Button type="submit" disabled={loading || !reportId.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Verify
        </Button>
      </form>

      {result && (
        <div className={`rounded-lg border p-4 ${result.verified ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-200 bg-red-50 dark:bg-red-950/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.verified
              ? <ShieldCheck className="h-5 w-5 text-emerald-500" />
              : <ShieldX className="h-5 w-5 text-red-500" />}
            <span className={`font-semibold text-sm ${result.verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {result.verified ? 'Verified & Authentic' : 'Verification Failed'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{result.message}</p>
          {result.verified && result.details && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Contributor:</span> <span className="font-medium">{result.details.contributor}</span></div>
              <div><span className="text-muted-foreground">Repository:</span> <span className="font-medium">{result.details.repo}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Hash:</span> <span className="font-mono text-blue-600 dark:text-blue-400 break-all">{result.details.contentHash}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Step = 'input' | 'results' | 'verify_only';

export function GitScrapperPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Academic Portal Validator...</div>}>
      <GitScrapperPageInner />
    </Suspense>
  );
}

function GitScrapperPageInner() {
  const searchParams = useSearchParams();
  const verifyId = searchParams.get('verify');

  const [step, setStep] = useState<Step>('input');
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [lastCertId, setLastCertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [verifyFromUrl, setVerifyFromUrl] = useState('');

  // Auto-detect verify query param safely
  useEffect(() => {
    if (verifyId) {
      setVerifyFromUrl(verifyId);
      setStep('verify_only'); // Jump straight to standalone verification
    } else {
      setStep('input');
      setVerifyFromUrl('');
    }
  }, [verifyId]);

  const parseRepo = (input: string): { owner: string; repo: string } | null => {
    const urlMatch = input.match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace('.git', '') };
    const parts = input.trim().split('/');
    if (parts.length === 2 && parts[0] && parts[1]) return { owner: parts[0], repo: parts[1] };
    return null;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRepo(repoInput);
    if (!parsed) {
      setError('Enter a valid GitHub URL or owner/repo format');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gitscrapper/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRepoData({ ...data, owner: parsed.owner, repo: parsed.repo });
      setStep('results');
      setActiveTab('analytics');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setRepoData(null);
    setError(null);
    setLastCertId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Project Intelligence
          {repoData && step !== 'verify_only' && (
            <Badge variant="outline" className="ml-2 font-mono text-xs">
              {repoData.owner}/{repoData.repo}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground text-sm">
          A centralized, blockchain-verified portal for evaluating academic projects and transparently assessing authentic code contributions to create verifiable digital project portfolios.
        </p>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-sm">
        {/* ── Step 1: Input ── */}
        {step === 'input' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                { icon: '📊', title: 'Commit Activity', desc: 'Track repository activity over time' },
                { icon: '🏆', title: 'Leaderboards', desc: 'Top contributors ranked by score' },
                { icon: '📄', title: 'PDF Reports', desc: 'Download verified contributor certificates' },
              ].map((f, i) => (
                <div key={i} className="rounded-lg border p-6 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{f.desc}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAnalyze} className="space-y-4 max-w-2xl mx-auto mt-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="e.g. facebook/react or https://github.com/facebook/react"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  className="flex-1 h-11"
                  autoFocus
                />
                <Button type="submit" size="lg" disabled={loading || !repoInput.trim()} className="h-11">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Analyze Repository
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive justify-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {step === 'verify_only' && (
          <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" /> Go to Repository Analytics
            </Button>
            <div className="max-w-xl mx-auto border rounded-xl p-8 bg-muted/10 shadow-sm">
              <div className="mb-6 flex justify-center">
                <ShieldCheck className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
              <h2 className="text-xl font-bold text-center mb-6">Certificate Authenticator</h2>
              <VerifyPanel initialReportId={verifyFromUrl} />
            </div>
          </div>
        )}

        {/* ── Step 2: Results ── */}
        {step === 'results' && repoData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Analyze Another
              </Button>
              {lastCertId && (
                <Badge variant="secondary" className="font-mono gap-1 px-3 py-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Last cert: {lastCertId}
                </Badge>
              )}
            </div>

            <AnalyticsCards summary={repoData.summary} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Trophy className="h-4 w-4" /> Leaderboard
                </TabsTrigger>
                <TabsTrigger value="verify" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Verify Report
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="analytics" className="space-y-6 m-0">
                  <CommitChart data={repoData.commitsByDate} />
                  <CommitsBarChart contributors={repoData.contributors} />
                </TabsContent>

                <TabsContent value="leaderboard" className="m-0">
                  <Leaderboard
                    contributors={repoData.contributors}
                    owner={repoData.owner}
                    repo={repoData.repo}
                    summary={repoData.summary}
                    onVerify={certId => { setLastCertId(certId); setActiveTab('verify'); }}
                  />
                </TabsContent>

                <TabsContent value="verify" className="m-0 max-w-xl mx-auto">
                  <VerifyPanel initialReportId={verifyFromUrl || lastCertId || ''} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
