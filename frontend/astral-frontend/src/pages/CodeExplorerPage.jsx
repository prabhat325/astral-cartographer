import React, { useState, useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { explainCode } from '../api/apiClient';

// ── Extension colour map ──────────────────────────────────────────
const EXT_COLORS = {
  '.js':'#f59e0b', '.jsx':'#f97316', '.ts':'#3b82f6', '.tsx':'#6366f1',
  '.py':'#10b981', '.go':'#06b6d4', '.rs':'#ef4444', '.java':'#8b5cf6',
  '.cpp':'#ec4899', '.c':'#14b8a6', '.h':'#84cc16', '.php':'#a855f7',
};

// ── File row ──────────────────────────────────────────────────────
function FileRow({ file, node, onClick, isSelected }) {
  const ext  = node?.extension || '';
  const loc  = node?.loc?.code ?? node?.loc?.total ?? '—';
  const cc   = node?.complexity ?? '—';
  const inD  = node?.inDegree  ?? 0;
  const outD = node?.outDegree ?? 0;
  return (
    <div
      className={`file-item${isSelected ? ' selected' : ''}`}
      onClick={onClick}
      style={{ borderRadius: 'var(--radius)', padding: '10px 12px' }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: EXT_COLORS[ext] || '#9ca3af' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="file-name">{file.path?.split('/').pop() || file.path}</div>
        <div className="file-path">{file.path}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <span className="pill pill-neutral" style={{ height: 20, fontSize: 10 }}>LOC {loc}</span>
        {cc !== '—' && cc > 5 && <span className="pill pill-warn" style={{ height: 20, fontSize: 10 }}>CC {cc}</span>}
        {(inD + outD) > 8 && <span className="pill pill-primary" style={{ height: 20, fontSize: 10 }}>hub</span>}
      </div>
    </div>
  );
}

// ── Symbol list ───────────────────────────────────────────────────
function SymbolList({ symbols }) {
  const kindIcon = { function: 'ƒ', class: '◈', method: '·', arrow: '→', type: 'T', interface: 'I' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {symbols.slice(0, 30).map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 'var(--radius)', background: 'var(--color-surface-container-low)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ width: 18, height: 18, borderRadius: 3, background: 'rgba(65,86,171,0.1)', color: 'var(--color-primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {kindIcon[s.type] || s.type?.[0]?.toUpperCase() || '?'}
          </span>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-on-surface)' }}>{s.name}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--color-outline)', flexShrink: 0 }}>{s.type}</span>
          {s.line && <span style={{ color: 'var(--color-outline)', flexShrink: 0 }}>:{s.line}</span>}
        </div>
      ))}
      {symbols.length > 30 && <div style={{ fontSize: 11, color: 'var(--color-outline)', textAlign: 'center', padding: 4 }}>+{symbols.length - 30} more</div>}
    </div>
  );
}

// ── Call graph tab ────────────────────────────────────────────────
function CallGraphTab({ filePath, functionCalls }) {
  const fileCalls = useMemo(
    () => (functionCalls || []).filter(c => c.file === filePath),
    [filePath, functionCalls]
  );
  const byCaller = useMemo(() => {
    const m = {};
    fileCalls.forEach(c => {
      if (!m[c.caller || '(module)']) m[c.caller || '(module)'] = [];
      m[c.caller || '(module)'].push(c);
    });
    return Object.entries(m);
  }, [fileCalls]);

  if (fileCalls.length === 0) {
    return <div className="empty-state"><div className="empty-state-text">No call graph data for this file</div></div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {byCaller.map(([caller, calls]) => (
        <div key={caller}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
            {caller}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 12, borderLeft: '2px solid var(--color-outline-variant)' }}>
            {calls.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>→</span>
                <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{c.callee}</span>
                {c.line && <span style={{ color: 'var(--color-outline)', marginLeft: 'auto' }}>:{c.line}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--color-outline)', textAlign: 'center', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 8 }}>
        {fileCalls.length} total call expressions
      </div>
    </div>
  );
}

// ── AI Explanation tab ────────────────────────────────────────────
function AiExplainTab({ file, node }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError]     = useState('');

  const handleExplain = async () => {
    setLoading(true);
    setError('');
    setExplanation('');
    try {
      const ctx = node ? {
        cluster:     node.cluster,
        complexity:  node.complexity,
        inDegree:    node.inDegree,
        outDegree:   node.outDegree,
        blastRadius: node.blastRadius?.affectedCount,
        isGodFile:   node.isGodFile,
      } : {};
      const { explanation: text } = await explainCode(file.content, file.path, ctx);
      setExplanation(text);
    } catch (e) {
      setError(e.message || 'AI explanation failed. Check that GEMINI_API_KEY is set in github-service/.env');
    } finally {
      setLoading(false);
    }
  };

  // Render markdown-like bold and bullet points
  const renderMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.includes('**:')) {
        const title = line.replace(/\*\*(.*?)\*\*/g, '$1');
        return <div key={i} style={{ fontWeight: 700, color: 'var(--color-on-surface)', marginTop: i > 0 ? 14 : 0, fontSize: 13 }}>{title}</div>;
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-on-surface-variant)', paddingLeft: 4 }}>
            <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      return line ? <div key={i} style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{line}</div> : <div key={i} style={{ height: 4 }} />;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Action button */}
      <button
        className="btn btn-primary"
        onClick={handleExplain}
        disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
      >
        {loading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Gemini is thinking…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            Explain with Gemini AI
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="alert alert-warn" style={{ fontSize: 12 }}>{error}</div>
      )}

      {/* Explanation */}
      {explanation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            ✦ Gemini AI Analysis
          </div>
          {renderMarkdown(explanation)}
        </div>
      )}

      {!explanation && !loading && !error && (
        <div className="empty-state" style={{ padding: 20 }}>
          <div className="empty-state-text">Click the button above to get an AI-powered architectural explanation of this file from Gemini.</div>
        </div>
      )}
    </div>
  );
}

const EMPTY_ARR = [];

// ── Main Component ────────────────────────────────────────────────
export default function CodeExplorerPage() {
  const { state } = useAnalysis();
  const { result, searchQuery } = state;
  const [selectedFile, setSelectedFile] = useState(null);
  const [localSearch, setLocalSearch]   = useState('');
  const [sortBy, setSortBy]             = useState('path');
  const [tab, setTab]                   = useState('content');

  const arch          = result?.architecture;
  const files         = result?.files         || EMPTY_ARR;
  const nodes         = arch?.nodes           || EMPTY_ARR;
  const symbols       = arch?.symbols         || EMPTY_ARR;
  const functionCalls = arch?.functionCalls   || EMPTY_ARR;

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const symbolMap = useMemo(() => {
    const m = {};
    symbols.forEach(s => {
      if (!m[s.file]) m[s.file] = [];
      m[s.file].push(s);
    });
    return m;
  }, [symbols]);

  const q = (localSearch || searchQuery || '').toLowerCase();
  const filtered = useMemo(() => {
    let res = files;
    if (q) res = res.filter(f => f.path.toLowerCase().includes(q));
    if (sortBy === 'loc')        res = [...res].sort((a, b) => (nodeMap[b.path]?.loc?.code || 0) - (nodeMap[a.path]?.loc?.code || 0));
    else if (sortBy === 'complexity') res = [...res].sort((a, b) => (nodeMap[b.path]?.complexity || 0) - (nodeMap[a.path]?.complexity || 0));
    else if (sortBy === 'coupling')   res = [...res].sort((a, b) => ((nodeMap[b.path]?.inDegree||0)+(nodeMap[b.path]?.outDegree||0)) - ((nodeMap[a.path]?.inDegree||0)+(nodeMap[a.path]?.outDegree||0)));
    else res = [...res].sort((a, b) => a.path.localeCompare(b.path));
    return res;
  }, [files, q, sortBy, nodeMap]);

  if (!result) return null;

  const selNode    = selectedFile ? nodeMap[selectedFile.path] : null;
  const selSymbols = selectedFile ? (symbolMap[selectedFile.path] || []) : [];

  const TABS = [
    ['content',   'Source'],
    ['symbols',   'Symbols'],
    ['callgraph', 'Call Graph'],
    ['metrics',   'Metrics'],
    ['ai',        '✦ AI Explain'],
  ];

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 64px - 48px)', minHeight: 500, maxWidth: 1400, margin: '0 auto', width: '100%' }}>

      {/* ── File list sidebar ─────────────────────────────────── */}
      <div style={{ width: 340, minWidth: 280, borderRight: '1px solid var(--color-outline-variant)', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }}>
        <div style={{ padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="input" placeholder="Search files…" style={{ fontSize: 13 }}
            value={localSearch} onChange={e => setLocalSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[['path','Name'],['loc','LOC'],['complexity','CC'],['coupling','Coupling']].map(([v, l]) => (
              <button key={v} className={`tab-item${sortBy === v ? ' active' : ''}`} style={{ flex: 'none', padding: '4px 10px', fontSize: 11 }} onClick={() => setSortBy(v)}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-outline)', padding: '2px 0' }}>
            {filtered.length} / {files.length} files
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 12px' }}>
          <div className="file-list">
            {filtered.map(f => (
              <FileRow
                key={f.path} file={f} node={nodeMap[f.path]}
                isSelected={selectedFile?.path === f.path}
                onClick={() => { setSelectedFile(f); setTab('content'); }}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state"><div className="empty-state-text">No files match "{q}"</div></div>
          )}
        </div>
      </div>

      {/* ── Content panel ─────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-outline-variant)', borderLeft: 'none', borderRadius: '0 var(--radius-lg) var(--radius-lg) 0', background: 'var(--color-surface-container-lowest)' }}>
        {selectedFile ? (
          <>
            {/* File header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flex: 1, minWidth: 200 }}>
                {selectedFile.path}
              </div>
              {selNode && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="pill pill-neutral">LOC {selNode.loc?.code ?? selNode.loc?.total}</span>
                  <span className={`pill ${selNode.complexity > 10 ? 'pill-error' : selNode.complexity > 5 ? 'pill-warn' : 'pill-clean'}`}>
                    CC {selNode.complexity}
                  </span>
                  <span className="pill pill-neutral">↑{selNode.inDegree} ↓{selNode.outDegree}</span>
                  {selNode.isGodFile && <span className="pill pill-warn">God File</span>}
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div style={{ padding: '8px 16px 0' }}>
              <div className="tab-bar" style={{ display: 'inline-flex', width: 'auto' }}>
                {TABS.map(([v, l]) => (
                  <button key={v} className={`tab-item${tab === v ? ' active' : ''}`}
                    style={{ padding: '6px 14px', fontSize: 12, color: v === 'ai' && tab !== 'ai' ? 'var(--color-primary)' : undefined }}
                    onClick={() => setTab(v)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {tab === 'content' && (
                <pre className="code-block" style={{ fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '100%', overflowY: 'auto' }}>
                  {selectedFile.content}
                </pre>
              )}
              {tab === 'symbols' && (
                selSymbols.length > 0
                  ? <SymbolList symbols={selSymbols} />
                  : <div className="empty-state"><div className="empty-state-text">No symbols extracted for this file</div></div>
              )}
              {tab === 'callgraph' && (
                <CallGraphTab filePath={selectedFile.path} functionCalls={functionCalls} />
              )}
              {tab === 'metrics' && selNode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                  {[
                    ['Total Lines',    selNode.loc?.total],
                    ['Code Lines',     selNode.loc?.code],
                    ['Comment Lines',  selNode.loc?.comment],
                    ['Blank Lines',    selNode.loc?.blank],
                    ['Token Count',    selNode.tokenCount],
                    ['Cyclomatic CC',  selNode.complexity],
                    ['In-degree',      selNode.inDegree],
                    ['Out-degree',     selNode.outDegree],
                    ['Blast Radius',   (selNode.blastRadius?.affectedCount ?? '—') + ' files'],
                    ['Blast Ratio',    ((selNode.blastRadius?.ratio ?? 0) * 100).toFixed(1) + '%'],
                    ['Cluster',        selNode.cluster],
                    ['Risk Level',     selNode.riskLevel || '—'],
                    ['God File Score', selNode.godFileScore ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="inspector-row" style={{ padding: '8px 0' }}>
                      <span style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{v ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'ai' && (
                <AiExplainTab file={selectedFile} node={selNode} />
              )}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="empty-state-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <div className="empty-state-title">Select a file</div>
            <div className="empty-state-text">Choose any file from the list to inspect its source, symbols, call graph, metrics, or get an AI explanation</div>
          </div>
        )}
      </div>
    </div>
  );
}
