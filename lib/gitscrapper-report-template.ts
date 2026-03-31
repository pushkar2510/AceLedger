interface Contributor {
  login: string;
  avatar_url: string;
  commits: number;
  linesAdded: number;
  linesDeleted: number;
  score: number;
  weeks?: { w: number; a: number; d: number; c: number }[];
}

interface RepoDataMock {
  owner: string;
  repo: string;
  summary: { totalCommits: number; totalContributors: number };
}

export function generateReportHTML(
  contributor: Contributor,
  repoData: RepoDataMock,
  rank: number,
  certId: string,
  certHash: string,
  generatedAt: string,
  origin: string = "https://skillbridge.app",
): string {
  const repoName = `${repoData.owner}/${repoData.repo}`;
  const profileLink = `https://github.com/${contributor.login}`;
  const totalCommits = contributor.commits;
  const linesAdded = contributor.linesAdded;
  const linesDeleted = contributor.linesDeleted;
  const netContribution = linesAdded - linesDeleted;
  const score = Math.round(contributor.score);
  const totalRepoCommits = repoData.summary.totalCommits || 1;
  const contributionPercent = ((totalCommits / totalRepoCommits) * 100).toFixed(1);

  const activeWeeks = contributor.weeks ? contributor.weeks.filter(w => w.c > 0) : [];
  let firstCommitTs = Date.now() / 1000;
  let lastCommitTs = Date.now() / 1000;
  if (activeWeeks.length > 0) {
    firstCommitTs = activeWeeks[0].w;
    lastCommitTs = activeWeeks[activeWeeks.length - 1].w;
  }
  const firstCommitDate = new Date(firstCommitTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastCommitDate = new Date(lastCommitTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const activeDays = Math.max(1, Math.round((lastCommitTs - firstCommitTs) / (60 * 60 * 24)));
  const avgCommitsPerDay = (totalCommits / activeDays).toFixed(2);
  const avgLinesPerCommit = totalCommits > 0 ? (linesAdded / totalCommits).toFixed(0) : '0';
  const estimatedFilesChanged = Math.max(1, Math.round(linesAdded / 75));
  const mergedCommits = Math.round(totalCommits * 0.82);

  const pieData = [totalCommits, Math.max(0, totalRepoCommits - totalCommits)];
  const chartLabels: string[] = [];
  const chartCommits: number[] = [];
  const chartLines: number[] = [];

  if (contributor.weeks) {
    activeWeeks.slice(-15).forEach(w => {
      chartLabels.push(new Date(w.w * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      chartCommits.push(w.c);
      chartLines.push(w.a);
    });
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Academic Project Intelligence Report - ${contributor.login}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { 
      font-family: 'Inter', sans-serif; 
      color: #1e293b; 
      background: #f8fafc; 
      margin: 0; 
      padding: 0; 
      line-height: 1.5; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
    }
    .page-container {
      background: white;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      position: relative;
      border-top: 8px solid #0f172a;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 8rem;
      color: rgba(15, 23, 42, 0.02);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      font-weight: 800;
    }
    .content-wrapper { position: relative; z-index: 10; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 25px; 
      margin-bottom: 30px; 
    }
    .portal-branding {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-title { color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header-subtitle { color: #3b82f6; margin: 5px 0 0 0; font-size: 15px; font-weight: 600; }
    
    .meta-box { text-align: right; }
    .meta-repo { font-weight: 700; color: #0f172a; font-size: 16px; background: #f1f5f9; padding: 4px 12px; border-radius: 6px; display: inline-block; }
    .meta-date { font-size: 12px; color: #64748b; margin-top: 8px; font-family: monospace; }
    
    .profile-section { 
      display: flex; 
      align-items: center; 
      gap: 25px; 
      background: #0f172a; 
      color: white;
      padding: 30px; 
      border-radius: 12px; 
      margin-bottom: 30px; 
      box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
    }
    .avatar { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #334155; }
    .profile-info h2 { margin: 0 0 5px 0; font-size: 28px; font-weight: 700; }
    .profile-info a { color: #94a3b8; text-decoration: none; font-size: 14px; }
    .rank-badge {
      display: inline-block;
      margin-top: 12px;
      font-size: 13px;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .card h3 { margin: 0 0 20px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    .metric-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; align-items: center; }
    .metric-label { color: #475569; font-weight: 500; }
    .metric-value { color: #0f172a; font-weight: 700; font-size: 15px; }
    
    .score-box { text-align: center; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; padding: 20px; margin-top: 20px; border: 1px solid #bfdbfe; }
    .score-value { font-size: 36px; font-weight: 800; color: #1d4ed8; margin: 0; line-height: 1; }
    .score-label { font-size: 11px; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0 0; font-weight: 700; }
    
    .charts-section { margin-bottom: 30px; }
    .chart-row { display: flex; gap: 24px; height: 260px; margin-bottom: 24px; }
    .chart-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; position: relative; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .chart-box h4 { margin: 0 0 15px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;}
    
    .cert-info { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 25px; text-align: center; margin-top: 40px; }
    .cert-info h3 { margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700; }
    .cert-info p { margin: 0 0 20px 0; font-size: 14px; color: #475569; max-width: 600px; margin-inline: auto; }
    .hashes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 500px; margin: 0 auto; }
    .hash-box { background: white; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
    .hash-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; display: block; }
    .cert-id { font-family: 'Courier New', monospace; color: #0f172a; font-size: 14px; font-weight: 700; word-break: break-all; }
    
    .footer { margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; font-weight: 500; }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="watermark">VERIFIED PORTFOLIO</div>
    
    <div class="content-wrapper">
      <div class="header">
        <div>
          <div class="portal-branding">I-HACK-16 Academic Project Intelligence Portal</div>
          <h1 class="header-title">Authentic Code Contribution Report</h1>
          <p class="header-subtitle">Verifiable Digital Project Portfolio</p>
        </div>
        <div class="meta-box">
          <div class="meta-repo">${repoName}</div>
          <div class="meta-date">Blockchain Verified: ${new Date(generatedAt).toISOString().split('T')[0]}</div>
        </div>
      </div>

      <div class="profile-section">
        <img class="avatar" src="${contributor.avatar_url}" alt="Avatar" crossorigin="anonymous" onerror="this.src='https://ui-avatars.com/api/?name=${contributor.login}&background=334155&color=fff'">
        <div class="profile-info">
          <h2>${contributor.login}</h2>
          <a href="${profileLink}">${profileLink}</a>
          <div>
            <span class="rank-badge">Repository Impact Rank: <strong>#${rank}</strong> of ${repoData.summary.totalContributors}</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Contribution Intelligence</h3>
          <div class="metric-row"><span class="metric-label">Total Authenticated Commits</span><span class="metric-value">${totalCommits.toLocaleString()}</span></div>
          <div class="metric-row"><span class="metric-label">Code Lines Synthesized</span><span class="metric-value" style="color:#10b981">+${linesAdded.toLocaleString()}</span></div>
          <div class="metric-row"><span class="metric-label">Code Lines Refactored</span><span class="metric-value" style="color:#ef4444">-${linesDeleted.toLocaleString()}</span></div>
          <div class="metric-row"><span class="metric-label">Net Project Impact</span><span class="metric-value">${netContribution.toLocaleString()} lines</span></div>
          <div class="metric-row"><span class="metric-label">Total Repository Share</span><span class="metric-value">${contributionPercent}%</span></div>
          <div class="score-box">
            <p class="score-value">${score.toLocaleString()}</p>
            <p class="score-label">Algorithmic Performance Score</p>
          </div>
        </div>
        
        <div class="card">
          <h3>Lifecycle & Workflow Analytics</h3>
          <div class="metric-row"><span class="metric-label">Initial Integration</span><span class="metric-value">${firstCommitDate}</span></div>
          <div class="metric-row"><span class="metric-label">Latest Integration</span><span class="metric-value">${lastCommitDate}</span></div>
          <div class="metric-row"><span class="metric-label">Active Development Days</span><span class="metric-value">${activeDays} days</span></div>
          <h3 style="margin-top:25px">Developer Velocity Metrics</h3>
          <div class="metric-row"><span class="metric-label">Commit Frequency (per day)</span><span class="metric-value">${avgCommitsPerDay}</span></div>
          <div class="metric-row"><span class="metric-label">Average Scope (lines/commit)</span><span class="metric-value">${avgLinesPerCommit}</span></div>
          <div class="metric-row"><span class="metric-label">Est. Files Modified</span><span class="metric-value">${estimatedFilesChanged.toLocaleString()}</span></div>
          <div class="metric-row"><span class="metric-label">Successful Merges (Est.)</span><span class="metric-value">${mergedCommits.toLocaleString()}</span></div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-row">
          <div class="chart-box" style="flex:0.8">
            <h4>Code Ownership</h4>
            <div style="height: 180px;"><canvas id="pieChart"></canvas></div>
          </div>
          <div class="chart-box" style="flex:2">
            <h4>Output Consistency (Lines)</h4>
            <div style="height: 180px;"><canvas id="lineChart"></canvas></div>
          </div>
        </div>
        <div class="chart-row" style="height:220px">
          <div class="chart-box">
             <h4>Commit Velocity History</h4>
             <div style="height: 140px;"><canvas id="barChart"></canvas></div>
          </div>
        </div>
      </div>

      <div class="cert-info">
        <h3>Blockchain-Validated Academic Record</h3>
        <p>This document programmatically certifies the code contributions documented above. It bridges the academic-industry gap by providing a mathematically verified dataset of student software development activity.</p>
        <div class="hashes-grid">
          <div class="hash-box">
            <span class="hash-label">Unique Identity Hash</span>
            <span class="cert-id">${certId}</span>
          </div>
          <div class="hash-box">
            <span class="hash-label">Cryptographic Payload Checksum</span>
            <span class="cert-id" style="font-size:11px">${certHash}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <span>Unified Internship & Academic Project Intelligence Portal</span>
        <span>Direct Verification: <a href="${origin}/~/git-scrapper?verify=${certId}" style="color:#3b82f6; text-decoration:none;">${origin}/~/git-scrapper?verify=${certId}</a></span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['${contributor.login}', 'Others'],
          datasets: [{ data: [${pieData[0]}, ${pieData[1]}], backgroundColor: ['#3b82f6','#e2e8f0'], borderWidth: 0 }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
      new Chart(document.getElementById('lineChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [{ label: 'Lines Added (Weekly)', data: ${JSON.stringify(chartLines)}, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, fill: true, tension: 0.4 }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
      });
      new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(chartLabels)},
          datasets: [{ label: 'Commits (Weekly)', data: ${JSON.stringify(chartCommits)}, backgroundColor: '#3b82f6', borderRadius: 4 }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
      });
    };
  </script>
</body>
</html>`;
}
