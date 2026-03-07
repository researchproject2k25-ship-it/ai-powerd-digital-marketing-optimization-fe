'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMe, getToken, clearAuth, getUser,
  getAdminDashboard, getAiMetrics,
  getAdminUsers, updateAdminUser, deleteAdminUser,
  listDocuments, uploadDocument, deleteDocument,
  getGaps, resolveGap, getGapsAnalytics,
  getTools, updateServiceSettings,
  sendMessage,
} from '@/features/smart_assistant/api';
import type { AuthUser, SADocument, KnowledgeGap, GapsAnalytics, Tool, ServiceSettings } from '@/features/smart_assistant/types';
import '@/features/smart_assistant/smart-assistant.css';

type Tab = 'overview' | 'customers' | 'documents' | 'gaps' | 'settings' | 'chat';

type ChatRole = 'user' | 'assistant' | 'system';
interface ChatMessage { role: ChatRole; content: string; model?: string; knowledgeSource?: string; }

function fmt(val: number | undefined, decimals = 0): string {
  if (val === undefined || val === null) return '—';
  return decimals > 0 ? val.toFixed(decimals) : val.toLocaleString();
}
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview state
  const [adminStats, setAdminStats] = useState<{ totalCustomers: number; storeName: string; serviceId: string; accountVerified: boolean } | null>(null);
  const [aiMetrics, setAiMetrics] = useState<{ totalQueries: number; totalDocuments: number; fallbackRate: number; avgResponseTimeMs: number; storeKnowledgeRate: number } | null>(null);

  // Customers state
  const [customers, setCustomers] = useState<AuthUser[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<SADocument[]>([]);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gaps state
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [gapsAnalytics, setGapsAnalytics] = useState<GapsAnalytics | null>(null);
  const [gapsLoaded, setGapsLoaded] = useState(false);

  // Settings state
  const [serviceSettings, setServiceSettings] = useState<ServiceSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Chat tab state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [widgetCopied, setWidgetCopied] = useState<'url' | 'embed' | 'id' | null>(null);

  // Action feedback
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/smart-assistant/manage'); return; }
    async function init() {
      try {
        const user = await getMe();
        if (user.role !== 'admin' && user.role !== 'superadmin') { router.replace('/smart-assistant/manage'); return; }
        setMe(user);
        const [dash, metrics] = await Promise.allSettled([getAdminDashboard(), getAiMetrics()]);
        if (dash.status === 'fulfilled') setAdminStats(dash.value.stats);
        if (metrics.status === 'fulfilled') setAiMetrics(metrics.value);
      } catch { setError('Failed to load dashboard.'); }
      finally { setLoading(false); }
    }
    init();
  }, [router]);

  async function loadTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'customers' && !customersLoaded) {
      try { setCustomers(await getAdminUsers()); setCustomersLoaded(true); } catch { flash('Failed to load customers.'); }
    }
    if (tab === 'documents' && !documentsLoaded) {
      try { setDocuments(await listDocuments()); setDocumentsLoaded(true); } catch { flash('Failed to load documents.'); }
    }
    if (tab === 'gaps' && !gapsLoaded) {
      const [g, ga] = await Promise.allSettled([getGaps(), getGapsAnalytics()]);
      if (g.status === 'fulfilled') setGaps(g.value);
      if (ga.status === 'fulfilled') setGapsAnalytics(ga.value);
      setGapsLoaded(true);
    }
    if (tab === 'settings' && !settingsLoaded) {
      try {
        const s = await getTools();
        setServiceSettings(s);
        setEnabledTools(s.enabledTools || []);
        setTone(s.assistantTone || 'professional');
        setLanguage(s.assistantLanguage || 'en');
        setSettingsLoaded(true);
      } catch { flash('Failed to load settings.'); }
    }
  }

  function handleLogout() { clearAuth(); router.replace('/smart-assistant/manage'); }
  function flash(msg: string) { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3500); }

  async function handleToggleActive(userId: string, current: boolean) {
    try {
      const updated = await updateAdminUser(userId, { is_active: !current });
      setCustomers((prev) => prev.map((c) => (c.id === userId ? updated : c)));
      flash(updated.is_active ? 'Customer activated.' : 'Customer deactivated.');
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Action failed.'); }
  }

  async function handleDeleteCustomer(userId: string) {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await deleteAdminUser(userId);
      setCustomers((prev) => prev.filter((c) => c.id !== userId));
      flash('Customer deleted.');
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Delete failed.'); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(file);
      const fresh = await listDocuments();
      setDocuments(fresh);
      flash(`"${file.name}" uploaded — embedding in progress.`);
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Upload failed.'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function handleDeleteDoc(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove all its vectors.`)) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      flash('Document deleted.');
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Delete failed.'); }
  }

  async function handleResolveGap(id: string) {
    try {
      await resolveGap(id);
      setGaps((prev) => prev.filter((g) => g._id !== id));
      flash('Gap marked as resolved.');
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Action failed.'); }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await updateServiceSettings({ enabledTools, assistantTone: tone, assistantLanguage: language });
      setSettingsSaved(true);
      flash('Settings saved.');
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err: unknown) { flash(err instanceof Error ? err.message : 'Save failed.'); }
    finally { setSavingSettings(false); }
  }

  function toggleTool(toolId: string) {
    setEnabledTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId],
    );
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const context = chatMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
      const res = await sendMessage(msg, context, chatSessionId);
      if (res.sessionId) setChatSessionId(res.sessionId);
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.response,
        model: res.model,
        knowledgeSource: res.knowledgeSource,
      }]);
    } catch (err: unknown) {
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Something went wrong.',
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  function copyText(text: string, key: 'url' | 'embed' | 'id') {
    navigator.clipboard.writeText(text).then(() => {
      setWidgetCopied(key);
      setTimeout(() => setWidgetCopied(null), 2000);
    });
  }

  if (loading) return <div className="sa-dash-loading"><div className="sa-spinner" /><span>Loading dashboard…</span></div>;
  if (error) return (
    <div className="sa-dash-page">
      <div className="sa-dash-error">
        <div className="sa-dash-error-title">Error</div>
        <div>{error}</div>
        <button className="sa-dash-retry-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  const cachedUser = me ?? getUser();
  const storeName = adminStats?.storeName ?? cachedUser?.storeName ?? 'Your Store';

  return (
    <div className="sa-dash-page">
      {/* Top bar */}
      <div className="sa-dash-topbar">
        <div>
          <h1 className="sa-dash-title">{storeName}</h1>
          <p className="sa-dash-subtitle">Admin dashboard · {cachedUser?.email}</p>
        </div>
        <div className="sa-dash-topbar-right">
          {actionMsg && <span className="sa-dash-flash">{actionMsg}</span>}
          <span className="sa-dash-role-badge sa-dash-role-badge--admin">{cachedUser?.role}</span>
          <button className="sa-dash-logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sa-dash-tabs">
        {(['overview', 'customers', 'documents', 'gaps', 'settings', 'chat'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`sa-dash-tab-btn ${activeTab === t ? 'sa-dash-tab-btn--active' : ''}`}
            onClick={() => loadTab(t)}
          >
            {t === 'overview' && '📊 Overview'}
            {t === 'customers' && '👥 Customers'}
            {t === 'documents' && '📄 Documents'}
            {t === 'gaps' && '🔍 Knowledge Gaps'}
            {t === 'settings' && '⚙️ Settings'}
            {t === 'chat' && '💬 Chat & Widget'}
          </button>
        ))}
      </div>

      {/* -- OVERVIEW TAB -- */}
      {activeTab === 'overview' && (
        <>
          <div className="sa-dash-stats">
            <div className="sa-stat-card">
              <div className="sa-stat-label">Total Customers</div>
              <div className="sa-stat-value">{fmt(adminStats?.totalCustomers)}</div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-label">Documents</div>
              <div className="sa-stat-value">{fmt(aiMetrics?.totalDocuments)}</div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-label">Total Queries</div>
              <div className="sa-stat-value sa-stat-value--accent">{fmt(aiMetrics?.totalQueries)}</div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-label">Fallback Rate</div>
              <div className="sa-stat-value">{fmt(aiMetrics?.fallbackRate, 1)}<span className="sa-stat-unit">%</span></div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-label">Avg Response</div>
              <div className="sa-stat-value">{fmt(aiMetrics?.avgResponseTimeMs)}<span className="sa-stat-unit">ms</span></div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-label">Knowledge Rate</div>
              <div className="sa-stat-value sa-stat-value--accent">{fmt(aiMetrics?.storeKnowledgeRate, 1)}<span className="sa-stat-unit">%</span></div>
            </div>
          </div>
          <div className="sa-dash-cards">
            <div className="sa-info-card">
              <p className="sa-info-card-title">Store Details</p>
              <div className="sa-info-row"><span className="sa-info-row-key">Store Name</span><span className="sa-info-row-val">{storeName}</span></div>
              <div className="sa-info-row"><span className="sa-info-row-key">Tenant ID</span><span className="sa-info-row-val">{cachedUser?.tenantId || '—'}</span></div>
              <div className="sa-info-row"><span className="sa-info-row-key">Service ID</span><span className="sa-info-row-val">{adminStats?.serviceId || '—'}</span></div>
              <div className="sa-info-row">
                <span className="sa-info-row-key">Verified</span>
                <span className={`sa-active-badge ${adminStats?.accountVerified ? 'sa-active-badge--green' : 'sa-active-badge--gray'}`}>
                  {adminStats?.accountVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
            <div className="sa-info-card">
              <p className="sa-info-card-title">Account</p>
              <div className="sa-info-row"><span className="sa-info-row-key">Full Name</span><span className="sa-info-row-val">{cachedUser?.full_name || '—'}</span></div>
              <div className="sa-info-row"><span className="sa-info-row-key">Username</span><span className="sa-info-row-val">{cachedUser?.username || '—'}</span></div>
              <div className="sa-info-row"><span className="sa-info-row-key">Email</span><span className="sa-info-row-val">{cachedUser?.email || '—'}</span></div>
            </div>
          </div>
        </>
      )}

      {/* -- CUSTOMERS TAB -- */}
      {activeTab === 'customers' && (
        <div className="sa-dash-table-wrap">
          <p className="sa-dash-table-title">Customers ({customers.length})</p>
          {customers.length === 0 ? (
            <div className="sa-empty-state">No customers registered to your store yet.</div>
          ) : (
            <div className="sa-dash-table-scroll">
              <table className="sa-dash-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Username</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td><div className="sa-table-name">{c.full_name || '—'}</div></td>
                      <td className="sa-table-muted">{c.email}</td>
                      <td className="sa-table-muted">@{c.username}</td>
                      <td>
                        <span className={`sa-active-badge ${c.is_active ? 'sa-active-badge--green' : 'sa-active-badge--gray'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="sa-action-row">
                          <button className="sa-btn-sm sa-btn-sm--ghost" onClick={() => handleToggleActive(c.id, c.is_active)}>
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="sa-btn-sm sa-btn-sm--danger" onClick={() => handleDeleteCustomer(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* -- DOCUMENTS TAB -- */}
      {activeTab === 'documents' && (
        <>
          <div className="sa-doc-toolbar">
            <h2 className="sa-section-title">Knowledge Base Documents</h2>
            <div className="sa-doc-upload-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sa-file-input"
                title="Upload document"
                onChange={handleUpload}
                disabled={uploading}
              />
              <button className="sa-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '+ Upload File'}
              </button>
              <span className="sa-doc-hint">PDF, DOCX, TXT · max 10 MB</span>
            </div>
          </div>
          <div className="sa-dash-table-wrap">
            {documents.length === 0 ? (
              <div className="sa-empty-state">No documents yet. Upload a file to start building your knowledge base.</div>
            ) : (
              <div className="sa-dash-table-scroll">
                <table className="sa-dash-table">
                  <thead>
                    <tr><th>Filename</th><th>Type</th><th>Size</th><th>Chunks</th><th>Status</th><th>Uploaded</th><th></th></tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d._id}>
                        <td><div className="sa-table-name">{d.filename}</div>{d.errorMessage && <div className="sa-doc-error-msg">{d.errorMessage}</div>}</td>
                        <td><span className="sa-type-badge">{d.fileType.toUpperCase()}</span></td>
                        <td className="sa-table-muted">{fmtSize(d.size)}</td>
                        <td className="sa-table-muted">{d.chunkCount ?? '—'}</td>
                        <td>
                          <span className={`sa-doc-status sa-doc-status--${d.status}`}>
                            {d.status === 'processing' && '? Processing'}
                            {d.status === 'ready' && '? Ready'}
                            {d.status === 'failed' && '? Failed'}
                          </span>
                        </td>
                        <td className="sa-table-muted">{fmtDate(d.createdAt)}</td>
                        <td><button className="sa-btn-sm sa-btn-sm--danger" onClick={() => handleDeleteDoc(d._id, d.filename)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* -- KNOWLEDGE GAPS TAB -- */}
      {activeTab === 'gaps' && (
        <>
          {gapsAnalytics && (
            <div className="sa-dash-stats">
              <div className="sa-stat-card"><div className="sa-stat-label">Total Gaps</div><div className="sa-stat-value">{fmt(gapsAnalytics.totalGaps)}</div></div>
              <div className="sa-stat-card"><div className="sa-stat-label">Unresolved</div><div className="sa-stat-value sa-stat-value--accent">{fmt(gapsAnalytics.unresolvedGaps)}</div></div>
              <div className="sa-stat-card"><div className="sa-stat-label">Resolved</div><div className="sa-stat-value">{fmt(gapsAnalytics.totalGaps - gapsAnalytics.unresolvedGaps)}</div></div>
            </div>
          )}
          <div className="sa-dash-table-wrap">
            <p className="sa-dash-table-title">Unresolved Questions ({gaps.length})</p>
            {gaps.length === 0 ? (
              <div className="sa-empty-state">No unresolved gaps — your assistant is handling all questions.</div>
            ) : (
              <div className="sa-dash-table-scroll">
                <table className="sa-dash-table">
                  <thead><tr><th>Question</th><th>Asked</th><th>Last Asked</th><th>Action</th></tr></thead>
                  <tbody>
                    {gaps.map((g) => (
                      <tr key={g._id}>
                        <td><div className="sa-table-name">{g.question}</div></td>
                        <td className="sa-table-muted">{g.frequency}×</td>
                        <td className="sa-table-muted">{fmtDate(g.lastAsked)}</td>
                        <td>
                          <button className="sa-btn-sm sa-btn-sm--accent" onClick={() => handleResolveGap(g._id)}>
                            Mark Resolved
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* -- SETTINGS TAB -- */}
      {activeTab === 'settings' && serviceSettings && (
        <div className="sa-settings-wrap">
          <div className="sa-info-card">
            <p className="sa-info-card-title">Assistant Tone</p>
            <div className="sa-tone-group">
              {['professional', 'friendly', 'concise'].map((t) => (
                <button
                  key={t}
                  className={`sa-tone-btn ${tone === t ? 'sa-tone-btn--active' : ''}`}
                  onClick={() => setTone(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="sa-info-card">
            <p className="sa-info-card-title">Assistant Language</p>
            <label className="sa-auth-label">
              Language code (e.g. en, ar, fr, es)
              <input
                className="sa-auth-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                maxLength={10}
                placeholder="en"
              />
            </label>
          </div>

          {serviceSettings.tools.length > 0 && (
            <div className="sa-info-card">
              <p className="sa-info-card-title">Enabled Tools</p>
              <div className="sa-tools-grid">
                {serviceSettings.tools.map((tool: Tool) => (
                  <div
                    key={tool.id}
                    className={`sa-tool-card ${enabledTools.includes(tool.id) ? 'sa-tool-card--on' : ''}`}
                    onClick={() => toggleTool(tool.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleTool(tool.id)}
                  >
                    <div className="sa-tool-check">{enabledTools.includes(tool.id) ? '?' : '?'}</div>
                    <div>
                      <div className="sa-tool-name">{tool.name}</div>
                      <div className="sa-tool-desc">{tool.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className={`sa-btn-primary sa-btn-save ${settingsSaved ? 'sa-btn-save--saved' : ''}`}
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? 'Saving…' : settingsSaved ? '? Saved!' : 'Save Settings'}
          </button>
        </div>
      )}
      {activeTab === 'settings' && !serviceSettings && (
        <div className="sa-dash-loading"><div className="sa-spinner" /></div>
      )}

      {/* -- CHAT & WIDGET TAB -- */}
      {activeTab === 'chat' && (
        <div className="sa-chat-tab-wrap">

          {/* Widget Info Card */}
          <div className="sa-info-card sa-widget-info-card">
            <p className="sa-info-card-title">Public Chat Widget</p>
            <p className="sa-widget-desc">
              Share this URL or embed code with your customers — no login needed.
            </p>

            {/* Tenant ID */}
            <div className="sa-widget-row">
              <div className="sa-widget-row-label">Tenant ID</div>
              <div className="sa-widget-row-value">
                <code className="sa-widget-code">{cachedUser?.tenantId || '—'}</code>
                {cachedUser?.tenantId && (
                  <button
                    className="sa-copy-btn"
                    onClick={() => copyText(cachedUser.tenantId, 'id')}
                  >
                    {widgetCopied === 'id' ? '✓ Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Public Chat URL */}
            {cachedUser?.tenantId && (() => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const chatUrl = `${origin}/smart-assistant/chat/${cachedUser.tenantId}`;
              return (
                <div className="sa-widget-row">
                  <div className="sa-widget-row-label">Public Chat URL</div>
                  <div className="sa-widget-row-value">
                    <code className="sa-widget-code sa-widget-code--url">{chatUrl}</code>
                    <button className="sa-copy-btn" onClick={() => copyText(chatUrl, 'url')}>
                      {widgetCopied === 'url' ? '✓ Copied' : 'Copy'}
                    </button>
                    <a
                      className="sa-copy-btn"
                      href={chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open ↗
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Embed Code */}
            {cachedUser?.tenantId && (() => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const embedCode = `<iframe\n  src="${origin}/smart-assistant/chat/${cachedUser.tenantId}"\n  width="400"\n  height="600"\n  frameborder="0"\n  title="${storeName} Assistant"\n></iframe>`;
              return (
                <div className="sa-widget-row sa-widget-row--col">
                  <div className="sa-widget-row-label">Embed Code</div>
                  <div className="sa-widget-embed-block">
                    <pre className="sa-widget-pre">{embedCode}</pre>
                    <button
                      className="sa-copy-btn sa-copy-btn--overlay"
                      onClick={() => copyText(embedCode, 'embed')}
                    >
                      {widgetCopied === 'embed' ? '✓ Copied' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {!cachedUser?.tenantId && (
              <div className="sa-empty-state">No Tenant ID assigned yet — contact the Superadmin to provision your service.</div>
            )}
          </div>

          {/* Test Chat */}
          <div className="sa-info-card sa-test-chat-card">
            <p className="sa-info-card-title">
              Test Your Assistant
              {chatSessionId && <span className="sa-session-badge">Session active</span>}
            </p>
            <p className="sa-widget-desc">Chat as a logged-in user to test your AI assistant.</p>

            <div className="sa-chat-messages" id="sa-chat-messages-box">
              {chatMessages.length === 0 ? (
                <div className="sa-chat-empty">
                  <div className="sa-chat-empty-icon">🤖</div>
                  <div>Ask your AI assistant anything…</div>
                </div>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={i} className={`sa-chat-bubble sa-chat-bubble--${m.role}`}>
                    <div className="sa-chat-bubble-text">{m.content}</div>
                    {m.role === 'assistant' && (m.model || m.knowledgeSource) && (
                      <div className="sa-chat-bubble-meta">
                        {m.model && <span>{m.model}</span>}
                        {m.knowledgeSource && <span>{m.knowledgeSource === 'store' ? '📚 Store KB' : '🌐 General'}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="sa-chat-bubble sa-chat-bubble--assistant">
                  <div className="sa-chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <form className="sa-chat-input-row" onSubmit={handleSendChat}>
              <input
                className="sa-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                disabled={chatLoading}
                autoComplete="off"
              />
              <button className="sa-chat-send-btn" type="submit" disabled={chatLoading || !chatInput.trim()}>
                {chatLoading ? '…' : '↑'}
              </button>
            </form>

            {chatMessages.length > 0 && (
              <button
                className="sa-btn-sm sa-btn-sm--ghost sa-chat-clear-btn"
                onClick={() => { setChatMessages([]); setChatSessionId(null); }}
              >
                Clear conversation
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
