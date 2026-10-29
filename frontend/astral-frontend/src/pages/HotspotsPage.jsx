import React, { useState, useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Flame, 
  Search, 
  ArrowUpDown, 
  FileCode2, 
  Network
} from 'lucide-react';

export default function HotspotsPage() {
  const { state, navigateToCodeExplorer, navigateToGraph } = useAnalysis();
  const { result } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('complexity'); // 'complexity' | 'score' | 'loc' | 'coupling'

  const arch = result?.architecture;
  const nodes = arch?.nodes || [];
  const hotspots = arch?.hotspots || [];

  // Merge hotspot items with node metrics
  const enrichedHotspots = useMemo(() => {
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const list = hotspots.length > 0 ? hotspots.map(h => {
      const node = nodeMap.get(h.file) || {};
      return {
        file: h.file,
        name: node.name || h.file?.split('/').pop(),
        score: h.score ?? node.godFileScore ?? 1,
        riskLevel: h.riskLevel || node.riskLevel || 'medium',
        complexity: h.complexity ?? node.complexity ?? 1,
        inDegree: h.inDegree ?? node.inDegree ?? 0,
        outDegree: h.outDegree ?? node.outDegree ?? 0,
        loc: h.loc ?? node.loc?.code ?? node.loc?.total ?? 10,
        blastCount: node.blastRadius?.affectedCount ?? 0,
        blastRatio: node.blastRadius?.ratio ?? 0,
        reason: h.reason || `Coupling: ${node.inDegree ?? 0} in, ${node.outDegree ?? 0} out`,
        isGodFile: node.isGodFile ?? (h.score >= 18),
        node
      };
    }) : nodes.filter(n => (n.complexity > 5 || n.isGodFile || (n.inDegree + n.outDegree) > 4)).map(n => ({
      file: n.id,
      name: n.name,
      score: n.godFileScore ?? 1,
      riskLevel: n.riskLevel || (n.complexity > 10 ? 'high' : 'medium'),
      complexity: n.complexity ?? 1,
      inDegree: n.inDegree ?? 0,
      outDegree: n.outDegree ?? 0,
      loc: n.loc?.code ?? n.loc?.total ?? 10,
      blastCount: n.blastRadius?.affectedCount ?? 0,
      blastRatio: n.blastRadius?.ratio ?? 0,
      reason: `Coupling: ${n.inDegree ?? 0} in, ${n.outDegree ?? 0} out. Cyclomatic complexity: ${n.complexity}`,
      isGodFile: n.isGodFile,
      node: n
    }));

    return list;
  }, [hotspots, nodes]);

  // Filter and sort
  const filtered = useMemo(() => {
    let resultList = enrichedHotspots;

    if (riskFilter !== 'ALL') {
      resultList = resultList.filter(h => h.riskLevel.toUpperCase() === riskFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      resultList = resultList.filter(h => h.file.toLowerCase().includes(q) || h.name.toLowerCase().includes(q));
    }

    return [...resultList].sort((a, b) => {
      if (sortBy === 'complexity') return b.complexity - a.complexity;
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'loc') return b.loc - a.loc;
      if (sortBy === 'coupling') return (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree);
      return 0;
    });
  }, [enrichedHotspots, riskFilter, searchTerm, sortBy]);

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        No repository analyzed yet. Load a repository to view complexity hotspots.
      </div>
    );
  }

  const criticalCount = enrichedHotspots.filter(h => h.riskLevel === 'critical').length;
  const highCount = enrichedHotspots.filter(h => h.riskLevel === 'high').length;
  const godCount = enrichedHotspots.filter(h => h.isGodFile).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      padding: '28px 0'
    }}>
      {/* Page Header */}
      <div className="royal-card fade-in" style={{
        background: 'linear-gradient(135deg, #FFFDFB 0%, #FBF1EA 100%)',
        border: '1.5px solid var(--border-gold-solid)'
      }}>
        <div className="section-eyebrow">
          <Flame size={12} color="var(--color-antique-gold)" />
          <span>Technical Debt & Maintainability Diagnostics</span>
        </div>
        <h1 className="section-title">Architectural Complexity Hotspots</h1>
        <p className="section-subtitle" style={{ marginTop: 6 }}>
          Identifies god files, high cyclomatic branching, and tightly-coupled modules posing high blast radiuses if modified.
        </p>
      </div>

      {/* Metric Strip */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Debt Hotspots</div>
          <div className="stat-value">{enrichedHotspots.length}</div>
          <div className="stat-meta">Elevated complexity</div>
        </div>
        <div className="stat-card" style={{ borderColor: criticalCount ? 'rgba(185,56,85,0.4)' : undefined }}>
          <div className="stat-label">Critical Risk</div>
          <div className="stat-value" style={{ color: criticalCount ? 'var(--status-rose)' : 'inherit' }}>
            {criticalCount}
          </div>
          <div className="stat-meta">Immediate refactor target</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Risk</div>
          <div className="stat-value" style={{ color: highCount ? 'var(--status-amber)' : 'inherit' }}>
            {highCount}
          </div>
          <div className="stat-meta">Coupling & branching</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">God Files</div>
          <div className="stat-value" style={{ color: godCount ? 'var(--color-antique-gold)' : 'inherit' }}>
            {godCount}
          </div>
          <div className="stat-meta">Excessive afferent lines</div>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="royal-card fade-in" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            gap: 8,
            minWidth: 260,
            flex: 1
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter hotspots by module name…"
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

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Risk Filter Buttons */}
            <div className="tab-bar" style={{ width: 'auto' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  className={`tab-item${riskFilter === lvl ? ' active' : ''}`}
                  onClick={() => setRiskFilter(lvl)}
                  style={{ fontSize: 11.5, padding: '6px 12px' }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ArrowUpDown size={13} color="var(--color-antique-gold)" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'var(--color-warm-ivory)',
                  border: '1px solid var(--border-gold-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--color-deep-burgundy)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="complexity">Sort by Cyclomatic CC</option>
                <option value="score">Sort by God File Score</option>
                <option value="loc">Sort by Lines of Code</option>
                <option value="coupling">Sort by Total Coupling</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div className="royal-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            No technical debt hotspots match the selected criteria.
          </div>
        ) : (
          filtered.map((item, idx) => {
            const riskBadgeClass =
              item.riskLevel === 'critical' ? 'pill-error' :
              item.riskLevel === 'high' ? 'pill-amber' : 'pill-gold';

            return (
              <div
                key={item.file || idx}
                className="royal-card fade-in"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${item.riskLevel === 'critical' ? 'var(--status-rose)' : item.riskLevel === 'high' ? 'var(--status-amber)' : 'var(--color-champagne-gold)'}`
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className={`pill ${riskBadgeClass}`}>
                      {item.riskLevel.toUpperCase()} RISK
                    </span>
                    {item.isGodFile && (
                      <span className="pill pill-error">
                        God File Alert
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-muted)'
                    }}>
                      God Score: {item.score}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--color-deep-burgundy)',
                    marginBottom: 4
                  }}>
                    {item.file}
                  </h3>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.reason}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>Complexity: <strong style={{ color: 'var(--color-deep-burgundy)' }}>{item.complexity}</strong></span>
                    <span>LOC: <strong style={{ color: 'var(--color-deep-burgundy)' }}>{item.loc}</strong></span>
                    <span>Dependents: <strong style={{ color: 'var(--color-deep-burgundy)' }}>{item.inDegree}</strong></span>
                    <span>Dependencies: <strong style={{ color: 'var(--color-deep-burgundy)' }}>{item.outDegree}</strong></span>
                    <span>Blast Radius: <strong style={{ color: 'var(--color-deep-burgundy)' }}>{item.blastCount} modules ({Math.round(item.blastRatio * 100)}%)</strong></span>
                  </div>
                </div>

                {/* Actions: Code Explorer & Graph */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-royal"
                    style={{ fontSize: 12.5, padding: '8px 14px' }}
                    onClick={() => navigateToCodeExplorer(item.file)}
                    title="Open in Code Explorer"
                  >
                    <FileCode2 size={14} color="var(--color-antique-gold)" />
                    <span>Inspect Code</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-gold"
                    style={{ fontSize: 12.5, padding: '8px 14px' }}
                    onClick={() => navigateToGraph(item.node, 'modules')}
                    title="View in Topological Graph"
                  >
                    <Network size={14} />
                    <span>View in Graph</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
