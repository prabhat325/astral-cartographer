import React, { useState, useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  FileCode, 
  Search, 
  Code2, 
  GitFork, 
  Check, 
  Copy, 
  FileText,
  Activity
} from 'lucide-react';

const EXT_COLORS = {
  '.jsx': '#E8B7C1', // Blush Pink
  '.tsx': '#D4AF70', // Champagne Gold
  '.js':  '#A98245', // Antique Gold
  '.ts':  '#C98598', // Dusty Rose
  '.py':  '#228B58', // Emerald
  '.go':  '#432832', // Deep Burgundy
  '.json':'#9C7787',
};

function FileRow({ file, node, onClick, isSelected }) {
  const ext = node?.extension || `.${file.path?.split('.').pop()}`;
  const loc = node?.loc?.code ?? node?.loc?.total ?? '—';
  const cc = node?.complexity ?? '—';
  const inD = node?.inDegree ?? 0;
  const outD = node?.outDegree ?? 0;

  return (
    <div
      className={`file-item${isSelected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        flexShrink: 0,
        background: EXT_COLORS[ext] || 'var(--color-champagne-gold)',
        border: '1.5px solid #FFF9F5',
        boxShadow: '0 1px 3px rgba(67, 40, 50, 0.2)'
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--color-deep-burgundy)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {file.path?.split('/').pop() || file.path}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {file.path}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <span className="pill pill-gold" style={{ height: 20, fontSize: 10 }}>
          {loc} L
        </span>
        {cc !== '—' && cc > 5 && (
          <span className={`pill ${cc > 10 ? 'pill-error' : 'pill-amber'}`} style={{ height: 20, fontSize: 10 }}>
            CC {cc}
          </span>
        )}
        {inD + outD > 4 && (
          <span className="pill pill-rose" style={{ height: 20, fontSize: 10 }}>
            hub
          </span>
        )}
      </div>
    </div>
  );
}

function SymbolList({ symbols }) {
  const kindBadge = {
    function: { label: 'ƒ', color: 'var(--color-antique-gold)' },
    class:    { label: '◈', color: 'var(--color-champagne-gold)' },
    method:   { label: '·', color: 'var(--color-dusty-rose)' },
    arrow:    { label: '→', color: 'var(--color-antique-gold)' },
    type:     { label: 'T', color: 'var(--text-muted)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {symbols.slice(0, 40).map((s, i) => {
        const badge = kindBadge[s.type] || { label: 'ƒ', color: 'var(--color-antique-gold)' };
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-warm-ivory)',
              border: '1px solid var(--border-gold-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12
            }}
          >
            <span style={{
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-pearl-white)',
              border: '1px solid var(--border-gold-subtle)',
              color: badge.color,
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {badge.label}
            </span>

            <span style={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--color-deep-burgundy)',
              flex: 1
            }}>
              {s.name}
            </span>

            {s.complexity && (
              <span className={`pill ${s.complexity > 8 ? 'pill-error' : 'pill-gold'}`} style={{ height: 18, fontSize: 9 }}>
                CC {s.complexity}
              </span>
            )}

            <span style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              flexShrink: 0,
              textTransform: 'lowercase'
            }}>
              line {s.line || '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CodeExplorerPage() {
  const { state } = useAnalysis();
  const { result, searchQuery, selectedFilePath } = state;

  const [selectedFile, setSelectedFile] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState('path');
  const [tab, setTab] = useState('content');
  const [copied, setCopied] = useState(false);

  const arch = result?.architecture;
  const files = result?.files || [];
  const nodes = arch?.nodes || [];
  const symbols = arch?.symbols || [];
  const callEdges = arch?.callEdges || [];
  const edges = arch?.edges || [];

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

  const filteredFiles = useMemo(() => {
    let res = files;
    if (q) res = res.filter(f => f.path.toLowerCase().includes(q));

    if (sortBy === 'loc') {
      res = [...res].sort((a, b) => (nodeMap[b.path]?.loc?.code || 0) - (nodeMap[a.path]?.loc?.code || 0));
    } else if (sortBy === 'complexity') {
      res = [...res].sort((a, b) => (nodeMap[b.path]?.complexity || 0) - (nodeMap[a.path]?.complexity || 0));
    } else if (sortBy === 'coupling') {
      res = [...res].sort((a, b) =>
        ((nodeMap[b.path]?.inDegree || 0) + (nodeMap[b.path]?.outDegree || 0)) -
        ((nodeMap[a.path]?.inDegree || 0) + (nodeMap[a.path]?.outDegree || 0))
      );
    } else {
      res = [...res].sort((a, b) => a.path.localeCompare(b.path));
    }
    return res;
  }, [files, q, sortBy, nodeMap]);

  // Sync selected file when navigated from Hotspots or Onboarding
  React.useEffect(() => {
    if (selectedFilePath && files.length > 0) {
      const target = files.find(f => f.path === selectedFilePath);
      if (target) {
        setSelectedFile(target);
        return;
      }
    }
    if (!selectedFile && filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [selectedFilePath, files, selectedFile, filteredFiles]);

  if (!result) return null;

  const selNode = selectedFile ? nodeMap[selectedFile.path] : null;
  const selSymbols = selectedFile ? (symbolMap[selectedFile.path] || []) : [];

  const fileCalls = selectedFile
    ? callEdges.filter(ce => ce.source?.startsWith(`${selectedFile.path}::`))
    : [];

  const fileImports = selectedFile
    ? edges.filter(e => (typeof e.source === 'object' ? e.source.id : e.source) === selectedFile.path)
    : [];

  function handleCopyPath() {
    if (selectedFile?.path) {
      navigator.clipboard.writeText(selectedFile.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      height: 'calc(100vh - 68px - 48px)',
      minHeight: 560,
      maxWidth: 1480,
      margin: '0 auto',
      width: '100%',
      borderRadius: 'var(--radius-xl)',
      border: '1.5px solid var(--border-gold-solid)',
      boxShadow: 'var(--shadow-elevated)',
      overflow: 'hidden'
    }}>
      {/* Left File List Navigation */}
      <div style={{
        width: 360,
        minWidth: 300,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-pearl-white)',
        borderRight: '1px solid var(--border-gold-subtle)',
      }}>
        {/* Search and Sort Toolbar */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--border-gold-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            gap: 8
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search repository files…"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '9px 0',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-deep-burgundy)',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {[
              ['path', 'Name'],
              ['loc', 'LOC'],
              ['complexity', 'Complexity'],
              ['coupling', 'Coupling']
            ].map(([v, l]) => (
              <button
                key={v}
                className={`tab-item${sortBy === v ? ' active' : ''}`}
                style={{ padding: '5px 10px', fontSize: 11.5 }}
                onClick={() => setSortBy(v)}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>SHOWING {filteredFiles.length} OF {files.length} FILES</span>
          </div>
        </div>

        {/* File Rows List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredFiles.map((f) => (
              <FileRow
                key={f.path}
                file={f}
                node={nodeMap[f.path]}
                isSelected={selectedFile?.path === f.path}
                onClick={() => {
                  setSelectedFile(f);
                }}
              />
            ))}
            {filteredFiles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
                No files match "{q}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right File Detail & Code Viewer */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFDFB',
        overflow: 'hidden'
      }}>
        {selectedFile ? (
          <>
            {/* Detail Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-gold-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              background: 'linear-gradient(135deg, #FFF9F5 0%, #F8F1E8 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileCode size={20} color="var(--color-antique-gold)" />
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--color-deep-burgundy)'
                  }}>
                    {selectedFile.path}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Cluster: {selNode?.cluster || 'Module'} · Ext: {selNode?.extension}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selNode && (
                  <>
                    <span className="pill pill-gold">
                      {selNode.loc?.code ?? selNode.loc?.total} LOC
                    </span>
                    <span className={`pill ${selNode.complexity > 10 ? 'pill-error' : selNode.complexity > 5 ? 'pill-amber' : 'pill-emerald'}`}>
                      CC {selNode.complexity}
                    </span>
                    <span className="pill pill-burgundy">
                      ↑{selNode.inDegree} In · ↓{selNode.outDegree} Out
                    </span>
                  </>
                )}

                <button
                  type="button"
                  className="btn-icon"
                  onClick={handleCopyPath}
                  title="Copy module path"
                >
                  {copied ? <Check size={14} color="var(--status-emerald)" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* View Tabs */}
            <div style={{ padding: '12px 24px 0', borderBottom: '1px solid var(--border-gold-subtle)', background: 'var(--color-pearl-white)' }}>
              <div className="tab-bar" style={{ display: 'inline-flex', width: 'auto' }}>
                <button
                  className={`tab-item${tab === 'content' ? ' active' : ''}`}
                  onClick={() => setTab('content')}
                >
                  <FileText size={14} />
                  <span>Source Code</span>
                </button>
                <button
                  className={`tab-item${tab === 'symbols' ? ' active' : ''}`}
                  onClick={() => setTab('symbols')}
                >
                  <Code2 size={14} />
                  <span>AST Symbols ({selSymbols.length})</span>
                </button>
                <button
                  className={`tab-item${tab === 'dependencies' ? ' active' : ''}`}
                  onClick={() => setTab('dependencies')}
                >
                  <GitFork size={14} />
                  <span>Dependencies & Calls ({fileImports.length + fileCalls.length})</span>
                </button>
                <button
                  className={`tab-item${tab === 'metrics' ? ' active' : ''}`}
                  onClick={() => setTab('metrics')}
                >
                  <Activity size={14} />
                  <span>Architectural Metrics</span>
                </button>
              </div>
            </div>

            {/* Tab Pane Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {tab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>READABLE SOURCE VIEW</span>
                    <span>{selectedFile.content ? selectedFile.content.split('\n').length : 0} LINES</span>
                  </div>
                  <pre className="code-block" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    <code>
                      {selectedFile.content ? (
                        selectedFile.content.split('\n').map((line, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 16 }}>
                            <span style={{
                              color: 'rgba(212, 175, 112, 0.4)',
                              width: 32,
                              textAlign: 'right',
                              userSelect: 'none',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {line}
                            </span>
                          </div>
                        ))
                      ) : (
                        '// Empty source file or binary asset'
                      )}
                    </code>
                  </pre>
                </div>
              )}

              {tab === 'symbols' && (
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    Babel AST parsed declarations (functions, classes, methods) with cyclomatic debt:
                  </div>
                  {selSymbols.length > 0 ? (
                    <SymbolList symbols={selSymbols} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                      No function or class symbols extracted from this module.
                    </div>
                  )}
                </div>
              )}

              {tab === 'dependencies' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                  {/* File Imports */}
                  <div className="royal-card" style={{ padding: 18 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-antique-gold)',
                      marginBottom: 12,
                      textTransform: 'uppercase'
                    }}>
                      Module Imports ({fileImports.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {fileImports.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No external file imports</div>
                      ) : fileImports.map((imp, i) => (
                        <div key={i} style={{
                          padding: '7px 10px',
                          background: 'var(--color-warm-ivory)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: imp.isCircular ? 'var(--status-rose)' : 'var(--color-deep-burgundy)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>→ {typeof imp.target === 'object' ? imp.target.id : imp.target}</span>
                          {imp.isCircular && <span className="pill pill-error" style={{ height: 16, fontSize: 9 }}>cycle</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Function Invocations */}
                  <div className="royal-card" style={{ padding: 18 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-deep-burgundy)',
                      marginBottom: 12,
                      textTransform: 'uppercase'
                    }}>
                      AST Function Calls ({fileCalls.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {fileCalls.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No function calls extracted</div>
                      ) : fileCalls.map((call, i) => (
                        <div key={i} style={{
                          padding: '7px 10px',
                          background: 'var(--color-warm-ivory)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>{call.source.split('::')[1] || call.source} → {call.target}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>line {call.line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'metrics' && selNode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 540 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--color-deep-burgundy)'
                  }}>
                    Structural Attributes
                  </div>
                  {[
                    ['Total Lines of Code', selNode.loc?.total],
                    ['Code Executable Lines', selNode.loc?.code],
                    ['Comment Lines', selNode.loc?.comment],
                    ['Blank Lines', selNode.loc?.blank],
                    ['Estimated Tokens', selNode.tokenCount],
                    ['Cyclomatic Complexity (CC)', selNode.complexity],
                    ['Afferent Coupling (In-Degree)', selNode.inDegree],
                    ['Efferent Coupling (Out-Degree)', selNode.outDegree],
                    ['Transitive Blast Radius', `${selNode.blastRadius?.affectedCount ?? 0} modules`],
                    ['Architectural Cluster', selNode.cluster],
                  ].map(([k, v]) => (
                    <div key={k} className="inspector-row" style={{ padding: '10px 0' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--color-deep-burgundy)' }}>
                        {v ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 16,
            color: 'var(--text-muted)',
            padding: 40
          }}>
            <FileCode size={48} color="var(--border-gold-solid)" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-deep-burgundy)' }}>
              Select a File to Explore
            </div>
            <div style={{ fontSize: 13, maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
              Choose any file from the sidebar to inspect its source code, AST symbols, function call pathways, and structural metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
