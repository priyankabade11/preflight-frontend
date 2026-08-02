import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Activity, Loader2, ShieldCheck, LogOut, Download, Share2, Check, Menu, X } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const API_BASE = 'https://preflight-2.onrender.com';

const INDUSTRIES = ['AI', 'FinTech', 'HealthTech', 'E-commerce', 'EdTech', 'SaaS', 'Other'];
const BUSINESS_MODELS = ['Subscription', 'Usage-based', 'Marketplace', 'One-time purchase', 'Freemium'];

function riskColor(score) {
  if (score >= 66) return { stroke: '#B84C42', text: 'text-crit', label: 'Not recommended' };
  if (score >= 33) return { stroke: '#C98A3A', text: 'text-warn', label: 'Proceed with caution' };
  return { stroke: '#3D5AFE', text: 'text-pulse', label: 'Cleared to proceed' };
}

function formatUSD(n) {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Ink & Gold categorical palette — cobalt, gold, muted teal, brick, slate blue, bronze.
const VIBRANT = ['#3D5AFE', '#C9A24B', '#4F9D8C', '#B84C42', '#6B7DB3', '#8A6A3B'];
const chartTooltipStyle = { background: '#121A2C', border: '1px solid #26314A', borderRadius: 6, color: '#EDF1F9', fontSize: 12 };
const chartItemStyle = { color: '#EDF1F9' };
const chartLabelStyle = { color: '#EDF1F9', fontWeight: 600 };

// Lightweight skeleton shown while a check is running.
function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-surface2 rounded ${className}`} />;
}

export default function App() {
  const [formData, setFormData] = useState({
    startup_name: '', industry: 'AI', business_model: 'Subscription',
    target_market: '', budget: '', description: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [activeTab, setActiveTab] = useState('Project input');
  const [shareStatus, setShareStatus] = useState('idle'); // 'idle' | 'copied'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const NAV_TABS = ['Project input', 'Market analysis', 'Competitor intelligence', 'Risk assessment', 'Recommendations'];

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `${capitalize(formData.startup_name)} — Preflight report`,
      text: `Preflight check for ${capitalize(formData.startup_name)}: ${analysis.overall_risk}/100 risk, ${analysis.success_probability ?? '—'}% success odds. ${analysis.positioning_summary || ''}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user closed the share sheet — nothing to do
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n${shareData.url}`);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        setError('Could not copy link. Try copying the URL manually.');
      }
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Enter an email and password to continue.');
      return;
    }
    setLoginError(null);
    setLoggedIn(true);
  };

  const updateField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = {};
    if (!formData.startup_name) missing.startup_name = true;
    if (!formData.description) missing.description = true;
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      setError('Startup name and description are required.');
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/analyze`, formData);
      setAnalysis(res.data.analysis);
      setActiveTab('Project input');
    } catch (err) {
      setError(err.response?.data?.detail || 'Check failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const overallColor = analysis ? riskColor(analysis.overall_risk) : null;
  const inputBase = 'w-full bg-void border rounded p-2.5 outline-none focus:border-pulse transition-colors';
  const errBorder = (field) => (fieldErrors[field] ? 'border-crit' : 'border-surface2');

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-void text-textmain font-body flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <Activity className="text-gold" size={20} />
              <span className="font-display font-semibold tracking-tight text-xl">Preflight</span>
            </div>
            <div className="gold-rule w-16" />
            <span className="text-textmuted text-[11px] font-mono uppercase tracking-widest">Preflight diligence</span>
          </div>
          <form onSubmit={handleLogin} className="bg-surface border border-surface2 rounded-2xl p-6 space-y-4">
            <div>
              <h1 className="font-display text-xl font-semibold mb-1">Sign in required</h1>
              <p className="text-textmuted text-sm">Enter your credentials to run a diligence check.</p>
            </div>
            <div>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input
                id="login-email"
                type="email" placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                className={`${inputBase} border-surface2`}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                id="login-password"
                type="password" placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                className={`${inputBase} border-surface2`}
              />
            </div>
            {loginError && (
              <div className="flex items-start gap-2 text-crit text-sm bg-crit/10 p-2.5 rounded" role="alert">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {loginError}
              </div>
            )}
            <button type="submit"
              className="w-full bg-pulse text-white font-semibold py-2.5 rounded font-display hover:bg-pulse/90 transition-colors">
              Sign in
            </button>
            <p className="text-textmuted text-xs text-center">
              Local demo login — not connected to a real account system yet.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-textmain font-body flex">
      {analysis && (
        <>
          {/* Mobile overlay, closes sidebar on tap outside */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside
            className={`print:hidden w-56 shrink-0 bg-surface border-r border-surface2 min-h-screen p-4 flex flex-col
              fixed md:static inset-y-0 left-0 z-40 transition-transform duration-200
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <Activity className="text-gold" size={18} />
                <span className="font-display font-semibold tracking-tight">Preflight</span>
              </div>
              <button className="md:hidden text-textmuted" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-display transition-colors border-l-2 ${
                    activeTab === tab
                      ? 'border-gold text-textmain font-medium bg-white/[0.03]'
                      : 'border-transparent text-textmuted hover:bg-white/[0.02] hover:text-textmain'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
            <button
              onClick={() => setLoggedIn(false)}
              className="flex items-center gap-2 text-textmain hover:text-crit hover:border-crit text-xs font-mono px-3 py-2 text-left border border-surface2 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              sign out
            </button>
          </aside>
        </>
      )}

      <div className="flex-1">
      {!analysis && (
        <div className="print:hidden border-b border-surface2 bg-surface px-4 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-pulse" size={20} />
            <span className="font-display font-semibold tracking-tight">Preflight</span>
          </div>
          <button
            onClick={() => setLoggedIn(false)}
            className="flex items-center gap-2 text-textmain hover:text-crit hover:border-crit text-xs font-mono px-3 py-1.5 border border-surface2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            sign out
          </button>
        </div>
      )}

      {analysis && (
        <div className="print:hidden md:hidden border-b border-surface2 bg-surface px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="text-textmain">
            <Menu size={20} />
          </button>
          <span className="font-display font-semibold text-sm">Preflight</span>
        </div>
      )}

      <div className="p-4 md:p-10">
      {!analysis ? (
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-3xl font-semibold mb-2">Run a preflight diligence check</h1>
          <div className="gold-rule w-12 mb-4" />
          <p className="text-textmuted mb-8">
            Submit your concept and Preflight evaluates market, capital, execution, and
            competitive risk — a clear, evidence-based verdict before you commit capital.
          </p>

          <form onSubmit={handleSubmit} className="bg-surface border border-surface2 rounded-xl p-6 space-y-4">
            <div>
              <label htmlFor="startup-name" className="sr-only">Startup name</label>
              <input
                id="startup-name"
                type="text" placeholder="Startup name" value={formData.startup_name}
                className={`${inputBase} ${errBorder('startup_name')} font-body`}
                onChange={updateField('startup_name')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="industry" className="sr-only">Industry</label>
                <select id="industry" value={formData.industry} onChange={updateField('industry')}
                  className={`${inputBase} border-surface2`}>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="business-model" className="sr-only">Business model</label>
                <select id="business-model" value={formData.business_model} onChange={updateField('business_model')}
                  className={`${inputBase} border-surface2`}>
                  {BUSINESS_MODELS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="target-market" className="sr-only">Target market</label>
              <input
                id="target-market"
                type="text" placeholder="Target market" value={formData.target_market}
                className={`${inputBase} border-surface2`}
                onChange={updateField('target_market')}
              />
            </div>
            <div>
              <label htmlFor="budget" className="sr-only">Budget</label>
              <input
                id="budget"
                type="text" placeholder="Budget (e.g. $45,000)" value={formData.budget}
                className={`${inputBase} border-surface2`}
                onChange={updateField('budget')}
              />
            </div>
            <div>
              <label htmlFor="description" className="sr-only">Project description</label>
              <textarea
                id="description"
                placeholder="Describe the project..." value={formData.description}
                className={`${inputBase} ${errBorder('description')} h-28`}
                onChange={updateField('description')}
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-crit text-sm bg-crit/10 p-2.5 rounded" role="alert">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-pulse disabled:opacity-50 text-white font-semibold py-2.5 rounded flex items-center justify-center gap-2 font-display hover:bg-pulse/90 transition-colors">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Running checks...' : 'Run preflight check'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 space-y-4" aria-hidden="true">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonBlock className="h-28 rounded-2xl" />
                <SkeletonBlock className="h-28 rounded-2xl" />
              </div>
              <SkeletonBlock className="h-40 rounded-2xl" />
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header strip */}
          <div className="mb-4">
            <h1 className="font-display text-2xl font-semibold">{capitalize(formData.startup_name)}</h1>
            <p className="text-textmuted text-sm">Sector growth: <span className="text-pulse font-mono">{analysis.sector_growth}</span></p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#121A2C,#1B2540)', border: '1px solid rgba(201,162,75,0.25)' }}>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Overall risk</div>
              <div className="font-mono text-3xl font-bold">{analysis.overall_risk}<span className="text-lg opacity-70">/100</span></div>
              <div className="text-xs mt-1 opacity-90">{overallColor.label}</div>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#26379C,#3D5AFE)' }}>
              <div className="text-xs uppercase tracking-wider opacity-80 mb-2">Success odds</div>
              <div className="font-mono text-3xl font-bold">{analysis.success_probability ?? '—'}<span className="text-lg opacity-70">%</span></div>
              <div className="text-xs mt-1 opacity-90">Failure odds: {analysis.failure_probability ?? '—'}%</div>
            </div>
          </div>

          {activeTab === 'Project input' && (
            <div className="max-w-md">
              <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Project submission</div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-textmuted">Industry</dt><dd>{formData.industry}</dd></div>
                  <div className="flex justify-between"><dt className="text-textmuted">Model</dt><dd>{formData.business_model}</dd></div>
                  <div className="flex justify-between"><dt className="text-textmuted">Target</dt><dd className="text-right">{formData.target_market}</dd></div>
                  <div className="flex justify-between"><dt className="text-textmuted">Budget</dt><dd>{formData.budget}</dd></div>
                </dl>
                <p className="text-textmuted text-xs mt-3 leading-relaxed border-t border-surface2 pt-3">{formData.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'Market analysis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Market scan — TAM/SAM/SOM</div>
                {analysis.market_sizing && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'TAM', value: analysis.market_sizing.tam },
                      { label: 'SAM', value: analysis.market_sizing.sam },
                      { label: 'SOM', value: analysis.market_sizing.som },
                    ].map((m) => (
                      <div key={m.label} className="bg-void rounded-lg p-2">
                        <div className="text-[10px] text-textmuted uppercase">{m.label}</div>
                        <div className="text-sm font-mono font-bold">{formatUSD(m.value)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.market_sizing?.methodology_notes && (
                  <p className="text-textmuted text-xs leading-relaxed">{analysis.market_sizing.methodology_notes}</p>
                )}
              </div>
              <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="text-xs uppercase tracking-wider text-textmuted mb-2">6-month revenue</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={(analysis.revenue_projection || []).map((v, i) => ({ month: `M${i + 1}`, revenue: v }))}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3D5AFE" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3D5AFE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#8896B0" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartItemStyle} labelStyle={chartLabelStyle} />
                    <Area type="monotone" dataKey="revenue" stroke="#3D5AFE" strokeWidth={2} fill="url(#revGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {analysis.market_trends && analysis.market_trends.length > 0 && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Market trends</div>
                  <div className="space-y-3">
                    {analysis.market_trends.map((t, i) => {
                      const impactColor = t.impact === 'High' ? 'text-crit bg-crit/10'
                        : t.impact === 'Medium' ? 'text-warn bg-warn/10'
                        : 'text-textmuted bg-void';
                      return (
                        <div key={i} className="border-b border-surface2 last:border-0 pb-3 last:pb-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-display font-medium text-sm">{t.trend}</span>
                            {t.impact && (
                              <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${impactColor}`}>
                                {t.impact} impact
                              </span>
                            )}
                          </div>
                          <p className="text-textmuted text-xs leading-relaxed">{t.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analysis.customer_segments && analysis.customer_segments.length > 0 && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Customer segments</div>
                  <div className="space-y-3">
                    {analysis.customer_segments.map((s, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-display font-medium text-sm">{s.segment}</span>
                          <span className="font-mono text-xs text-textmuted">{s.percentage}%</span>
                        </div>
                        <div className="w-full bg-void rounded h-1.5 overflow-hidden mb-1.5">
                          <div className="h-full rounded bg-pulse" style={{ width: `${s.percentage}%` }} />
                        </div>
                        <p className="text-textmuted text-xs leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.audience_maturity && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Audience & maturity</div>
                  <div className="text-[10px] uppercase tracking-wider text-textmuted mb-1">Audience profile</div>
                  <p className="text-textmain text-sm leading-relaxed mb-4">{analysis.audience_maturity.audience_profile}</p>
                  <div className="text-[10px] uppercase tracking-wider text-textmuted mb-1.5">Market maturity</div>
                  {(() => {
                    const m = analysis.audience_maturity.market_maturity;
                    const maturityColor = m === 'Growing' ? 'text-emerald-400 bg-emerald-400/10'
                      : m === 'Emerging' ? 'text-pulse bg-pulse/10'
                      : m === 'Mature' ? 'text-warn bg-warn/10'
                      : 'text-crit bg-crit/10';
                    return <span className={`inline-block text-xs font-mono px-2 py-1 rounded ${maturityColor}`}>{m}</span>;
                  })()}
                </div>
              )}

              {analysis.market_growth_history && analysis.market_growth_history.length > 0 && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-1">Market growth (past 5 years)</div>
                  <p className="text-textmuted text-xs mb-3">Historical market size trend leading up to today</p>
                  <div className="space-y-2.5">
                    {[...analysis.market_growth_history]
                      .sort((a, b) => a.year - b.year)
                      .map((point, i, arr) => {
                        const prev = i > 0 ? arr[i - 1].market_size : null;
                        const yoy = prev ? (((point.market_size - prev) / prev) * 100).toFixed(1) : null;
                        const maxSize = Math.max(...arr.map((p) => p.market_size));
                        const widthPct = maxSize ? (point.market_size / maxSize) * 100 : 0;
                        return (
                          <div key={point.year} className="flex items-center gap-3">
                            <span className="text-xs font-mono text-textmuted w-10">{point.year}</span>
                            <div className="flex-1 bg-void rounded h-2.5 overflow-hidden">
                              <div className="h-full rounded bg-pulse" style={{ width: `${widthPct}%` }} />
                            </div>
                            <span className="text-xs font-mono text-textmain w-24 text-right">{formatUSD(point.market_size)}</span>
                            <span className={`text-[10px] font-mono w-14 text-right ${yoy === null ? 'text-textmuted' : yoy >= 0 ? 'text-emerald-400' : 'text-crit'}`}>
                              {yoy === null ? 'base' : `${yoy >= 0 ? '+' : ''}${yoy}%`}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Competitor intelligence' && (
            <div className="max-w-3xl space-y-4">
            <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Competitive landscape</div>
              {analysis.competitors && analysis.competitors.length > 0 && (
                <div className="space-y-4">
                  {[...analysis.competitors]
                    .sort((a, b) => (b.market_share_estimate || 0) - (a.market_share_estimate || 0))
                    .map((c, i) => {
                      const rank = i === 0 ? 'Leader' : i === 1 ? 'Direct' : 'Indirect';
                      const rankColor = i === 0 ? 'text-pulse bg-pulse/10' : i === 1 ? 'text-warn bg-warn/10' : 'text-textmuted bg-void';
                      const threatColor = c.threat_level === 'High' ? 'text-crit bg-crit/10'
                        : c.threat_level === 'Medium' ? 'text-warn bg-warn/10'
                        : 'text-textmuted bg-void';
                      return (
                        <div key={i} className="border-b border-surface2 last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                            <span className="font-display font-medium text-sm">{c.name}</span>
                            <div className="flex items-center gap-1.5">
                              {c.funding_stage && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-textmuted bg-void">{c.funding_stage}</span>
                              )}
                              {c.threat_level && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${threatColor}`}>{c.threat_level} threat</span>
                              )}
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${rankColor}`}>{rank}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-void rounded h-1.5 overflow-hidden">
                              <div className="h-full bg-pulse rounded" style={{ width: `${c.market_share_estimate}%` }} />
                            </div>
                            <span className="text-xs font-mono text-textmuted w-9 text-right">{c.market_share_estimate}%</span>
                          </div>
                          <p className="text-textmuted text-xs mb-2">{c.positioning_notes}</p>
                          {((c.strengths && c.strengths.length > 0) || (c.weaknesses && c.weaknesses.length > 0)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                              {c.strengths && c.strengths.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Strengths</div>
                                  <ul className="space-y-1">
                                    {c.strengths.map((s, j) => (
                                      <li key={j} className="text-xs text-textmuted flex gap-1.5">
                                        <span className="text-emerald-400">+</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {c.weaknesses && c.weaknesses.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-crit mb-1">Weaknesses</div>
                                  <ul className="space-y-1">
                                    {c.weaknesses.map((w, j) => (
                                      <li key={j} className="text-xs text-textmuted flex gap-1.5">
                                        <span className="text-crit">−</span> {w}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            </div>
          )}

          {activeTab === 'Risk assessment' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-textmuted mb-2">
                  <ShieldCheck size={14} /> Risk breakdown
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Market', value: analysis.risks.market },
                        { name: 'Capital', value: analysis.risks.capital },
                        { name: 'Execution', value: analysis.risks.execution },
                        { name: 'Competition', value: analysis.risks.competition },
                        { name: 'Regulatory', value: analysis.risks.regulatory },
                      ]}
                      dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}
                    >
                      {VIBRANT.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                   <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartItemStyle} labelStyle={chartLabelStyle} formatter={(v) => formatUSD(v)} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#8896B0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Market', score: analysis.risks.market, color: VIBRANT[0] },
                { label: 'Capital', score: analysis.risks.capital, color: VIBRANT[1] },
                { label: 'Execution', score: analysis.risks.execution, color: VIBRANT[2] },
                { label: 'Competition', score: analysis.risks.competition, color: VIBRANT[3] },
                { label: 'Regulatory', score: analysis.risks.regulatory, color: VIBRANT[4] },
              ].map((r) => {
                const mitigation = (analysis.risk_mitigations || []).find(
                  (m) => (m.category || '').toLowerCase() === r.label.toLowerCase()
                );
                const severity = r.score >= 66 ? 'Critical — needs a mitigation plan before proceeding.'
                  : r.score >= 33 ? 'Elevated — worth monitoring closely.'
                  : 'Stable — currently low concern.';
                return (
                  <div key={r.label} className="bg-surface border border-surface2 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-display font-medium">{r.label}</span>
                      <span className="font-mono text-sm" style={{ color: r.color }}>{r.score}/100</span>
                    </div>
                    <div className="w-full bg-void rounded h-2 overflow-hidden mb-2">
                      <div className="h-full rounded" style={{ width: `${r.score}%`, backgroundColor: r.color }} />
                    </div>
                    <p className="text-textmuted text-xs mb-2">{severity}</p>
                    {mitigation && (
                      <div className="bg-void rounded-lg p-2.5 mt-2">
                        <div className="text-[10px] uppercase tracking-wider text-textmuted mb-1">Mitigation</div>
                        <p className="text-xs text-textmain leading-relaxed">{mitigation.mitigation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {activeTab === 'Recommendations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.adoption_distribution && analysis.adoption_distribution.length > 0 && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-2">Adoption trajectory</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analysis.adoption_distribution.map((s) => ({ name: s.segment, value: s.percentage }))}
                        dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}
                      >
                        {VIBRANT.map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartItemStyle} labelStyle={chartLabelStyle} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#8896B0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {analysis.market_sizing && (
                <div className="bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-4">Market scan — TAM/SAM/SOM</div>
                  {(() => {
                    const { tam, sam, som, methodology_notes } = analysis.market_sizing;
                    const vals = [tam, sam, som].filter((v) => v > 0);
                    const logs = vals.map((v) => Math.log10(v));
                    const minLog = Math.min(...logs);
                    const maxLog = Math.max(...logs);
                    const widthFor = (v) => {
                      if (!v || v <= 0) return 4;
                      if (maxLog === minLog) return 100;
                      return 20 + ((Math.log10(v) - minLog) / (maxLog - minLog)) * 80;
                    };
                    const rows = [
                      { label: 'TAM', value: tam, color: '#3D5AFE' },
                      { label: 'SAM', value: sam, color: '#6B7DB3' },
                      { label: 'SOM', value: som, color: '#C9A24B' },
                    ];
                    return (
                      <div className="space-y-2">
                        {rows.map((r) => (
                          <div key={r.label} className="flex items-center gap-2">
                            <span className="w-9 text-xs font-mono text-textmuted">{r.label}</span>
                            <div className="flex-1 bg-void rounded h-6 overflow-hidden">
                              <div
                                className="h-full rounded flex items-center justify-end px-2"
                                style={{ width: `${widthFor(r.value)}%`, backgroundColor: r.color }}
                              >
                                <span className="text-white text-xs font-mono font-bold">{formatUSD(r.value)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {methodology_notes && (
                          <p className="text-textmuted text-xs mt-2 leading-relaxed">{methodology_notes}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="md:col-span-2 bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-4">Diligence summary</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {analysis.recommendations.map((rec, i) => {
                      const catColor = {
                        Strength: '#4F9D8C', Opportunity: '#6B7DB3',
                        Weakness: '#C98A3A', Threat: '#B84C42',
                      }[rec.category] || '#8896B0';
                      return (
                        <div key={i} className="bg-void rounded-lg p-3 border-l-2" style={{ borderColor: catColor }}>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-mono uppercase" style={{ color: catColor }}>{rec.category}</span>
                            {rec.priority && <span className="text-xs text-textmuted">{rec.priority}</span>}
                          </div>
                          <p className="text-sm text-textmain">{rec.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analysis.action_plan && analysis.action_plan.length > 0 && (
                <div className="md:col-span-2 bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="text-xs uppercase tracking-wider text-textmuted mb-4">Recommended roadmap</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {analysis.action_plan.map((phase, i) => (
                      <div key={i} className="relative pl-4 border-l-2 border-pulse/40">
                        <div className="text-xs font-mono text-pulse mb-1">{phase.phase}</div>
                        <div className="font-display font-medium text-sm mb-2">{phase.focus}</div>
                        <ul className="space-y-1.5">
                          {(phase.actions || []).map((a, j) => (
                            <li key={j} className="text-xs text-textmuted flex gap-1.5">
                              <span className="text-pulse">•</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 bg-surface border border-surface2 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="text-xs uppercase tracking-wider text-textmuted mb-3">Analyst notes</div>
                <p className="text-textmain leading-relaxed">{analysis.positioning_summary}</p>
              </div>
            </div>
          )}

          <div className="print:hidden mt-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setAnalysis(null)}
              className="inline-flex items-center gap-2 bg-pulse text-white text-sm font-display font-medium px-4 py-2.5 rounded-lg hover:bg-pulse/90 transition-colors"
            >
              ← Run another preflight check
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 border border-surface2 text-textmain text-sm font-display px-4 py-2.5 rounded-lg hover:border-pulse transition-colors"
            >
              <Download size={14} />
              Export as PDF
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 border border-surface2 text-textmain text-sm font-display px-4 py-2.5 rounded-lg hover:border-pulse transition-colors"
            >
              {shareStatus === 'copied' ? <Check size={14} /> : <Share2 size={14} />}
              {shareStatus === 'copied' ? 'Copied!' : 'Share report'}
            </button>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
