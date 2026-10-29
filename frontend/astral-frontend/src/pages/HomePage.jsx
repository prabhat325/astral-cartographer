import React, { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Sparkles, 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  Code2, 
  Compass,
  X,
  Zap,
  Network,
  ChevronDown
} from 'lucide-react';

const EXAMPLES = [
  'astral-sh/ruff',
  'expressjs/express',
  'fastapi/fastapi',
  'facebook/react',
  'vercel/turborepo',
  'vuejs/vue',
];

const ANALYSIS_STEPS = [
  'Initiating GitHub API handshake…',
  'Recursively scanning repository tree structure…',
  'Fetching module source code payloads…',
  'Executing Babel AST traversal & symbol extraction…',
  'Synthesizing file-level import graph topology…',
  'Resolving caller-to-callee AST function graphs…',
  'Calculating cyclomatic complexity & blast radius…',
  'Detecting circular dependency cycles & debt hotspots…',
  'Imperial cartography complete!',
];

export default function HomePage() {
  const { state, runAnalysis, setRepoUrl, loadDemo, setBranch } = useAnalysis();
  const { status, error, repoUrl, branch = 'main' } = state;

  const [localSlug, setLocalSlug] = useState(repoUrl || '');
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const intervalRef = useRef(null);

  const loading = status === 'loading';

  // Animate progress smoothly while loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setProgress(8);
        setStepIdx(0);
      }, 0);
      let step = 0;
      intervalRef.current = setInterval(() => {
        step++;
        setStepIdx(Math.min(step, ANALYSIS_STEPS.length - 1));
        setProgress((p) => Math.min(p + 11, 93));
      }, 950);
      return () => {
        clearTimeout(timer);
        clearInterval(intervalRef.current);
      };
    } else {
      clearInterval(intervalRef.current);
      const timer = setTimeout(() => {
        if (status === 'success') setProgress(100);
        else setProgress(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, status]);

  function handleSubmit(e) {
    e.preventDefault();
    const clean = localSlug.trim();
    if (!clean) return;
    setRepoUrl(clean);
    runAnalysis(clean);
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 68px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 56,
      paddingBottom: 64,
    }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: 740, padding: '0 24px', marginBottom: 44 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 18px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-pearl-white)',
          border: '1.5px solid var(--border-gold-solid)',
          boxShadow: '0 4px 16px rgba(212, 175, 112, 0.18)',
          marginBottom: 24,
        }}>
          <Sparkles size={14} color="var(--color-antique-gold)" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-antique-gold)'
          }}>
            AST Architectural Intelligence Engine
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(34px, 5.5vw, 56px)',
          fontWeight: 700,
          color: 'var(--color-deep-burgundy)',
          lineHeight: 1.15,
          marginBottom: 20,
          letterSpacing: '-0.01em'
        }}>
          Map Your Codebase into an{' '}
          <span style={{
            background: 'var(--grad-gold)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Astral Tapestry.
          </span>
        </h1>

        <p style={{
          fontSize: '16.5px',
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          maxWidth: 620,
          margin: '0 auto',
        }}>
          Visualize architectural boundaries, trace file dependencies, isolate structural 
          circularities, and resolve function call paths across your GitHub repository in seconds.
        </p>
      </div>

      {/* Input Console Card */}
      <div className="royal-card royal-card-highlight fade-in" style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 24px',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* URL Input Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: 260,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-pearl-white)',
              border: '1.5px solid var(--border-gold-solid)',
              borderRadius: 'var(--radius-md)',
              padding: '0 16px',
              gap: 10,
              boxShadow: 'inset 0 1px 3px rgba(67, 40, 50, 0.03)',
              transition: 'all 0.2s ease',
            }}>
              <Compass size={18} color="var(--color-antique-gold)" style={{ flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-antique-gold)',
                whiteSpace: 'nowrap'
              }}>
                github.com/
              </span>
              <input
                className="input-royal"
                value={localSlug}
                onChange={(e) => setLocalSlug(e.target.value)}
                placeholder="organization/repository"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '14px 0',
                  boxShadow: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: 'var(--color-deep-burgundy)'
                }}
                disabled={loading}
                autoComplete="off"
                spellCheck="false"
              />
              {localSlug && (
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: 4, borderRadius: '50%' }}
                  onClick={() => setLocalSlug('')}
                  title="Clear input"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Branch Selector Dropdown */}
            <div style={{ position: 'relative', minWidth: 130 }}>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  background: 'var(--color-pearl-white)',
                  border: '1.5px solid var(--border-gold-solid)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 30px 0 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--color-deep-burgundy)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                <option value="main">branch: main</option>
                <option value="master">branch: master</option>
                <option value="dev">branch: dev</option>
                <option value="v1.x">tag: v1.x</option>
              </select>
              <ChevronDown size={14} color="var(--color-antique-gold)" style={{ position: 'absolute', right: 12, top: 18, pointerEvents: 'none' }} />
            </div>

            <button
              className="btn btn-gold"
              type="submit"
              disabled={loading || !localSlug.trim()}
              style={{
                height: 50,
                padding: '0 28px',
                fontSize: 14.5,
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span>Synthesizing…</span>
                </>
              ) : (
                <>
                  <span>Analyze Repository</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Dynamic Progress Pipeline */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ color: 'var(--color-antique-gold)', fontWeight: 600 }}>
                  {ANALYSIS_STEPS[stepIdx]}
                </span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Graceful Error Display */}
          {status === 'error' && error && (
            <div className="alert alert-error fade-in" style={{ flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="var(--status-rose)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Cartography Handshake Failed</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
                    {error}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>
                    GitHub public API rate limit may be reached, or repo is private. You can set <code>GITHUB_TOKEN</code> in <code>github-service/.env</code>, or instantly inspect the built-in reference architecture below:
                  </div>
                </div>
              </div>
              <div style={{ paddingLeft: 28 }}>
                <button
                  type="button"
                  className="btn btn-gold"
                  style={{ padding: '8px 18px', fontSize: 13, height: 'auto' }}
                  onClick={loadDemo}
                >
                  <Zap size={14} />
                  <span>Explore Built-In Demo Architecture Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Instant Discovery Quick-Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              Curated Repositories:
            </span>

            <button
              type="button"
              className="chip"
              style={{
                background: 'var(--grad-gold)',
                color: '#FFFFFF',
                fontWeight: 600,
                border: 'none',
                boxShadow: '0 2px 8px rgba(212, 175, 112, 0.3)'
              }}
              onClick={loadDemo}
              disabled={loading}
              title="Inspect authentic sample repo with circular cycles and call graphs"
            >
              <Zap size={13} />
              <span>Built-in Demo Repo</span>
            </button>

            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="chip"
                onClick={() => setLocalSlug(ex)}
                disabled={loading}
              >
                {ex}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Feature Pillars Strip */}
      <div style={{
        marginTop: 64,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 1040,
        padding: '0 24px',
      }}>
        {[
          {
            icon: Network,
            title: 'Topological Cartography',
            desc: 'Force-directed D3 module graphs revealing modular boundaries and hidden coupling patterns.',
            color: 'var(--color-champagne-gold)',
          },
          {
            icon: Code2,
            title: 'AST Function Call Flow',
            desc: 'Deep syntax tree extraction mapping function invocations, class methods, and internal logic flows.',
            color: 'var(--color-antique-gold)',
          },
          {
            icon: AlertTriangle,
            title: 'Circular Cycle Isolation',
            desc: 'Tarjan and DFS cycle detection isolating harmful recursion loops and dangerous blast radiuses.',
            color: 'var(--color-dusty-rose)',
          },
          {
            icon: Activity,
            title: 'Imperial Quality Index',
            desc: 'Synthesized 0–100 health metrics weighing cyclomatic complexity, god files, and maintainability.',
            color: 'var(--color-deep-burgundy)',
          },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="royal-card fade-in" style={{ padding: '24px 20px' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-warm-ivory)',
                border: '1.5px solid var(--border-gold-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(212, 175, 112, 0.12)'
              }}>
                <Icon size={22} color={f.color} />
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 8,
                color: 'var(--color-deep-burgundy)'
              }}>
                {f.title}
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Engine Status Note */}
      <div style={{
        marginTop: 52,
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span className="pulse-gold" style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-antique-gold)',
          display: 'inline-block'
        }} />
        <span>github-service :5000 · analyzer engine :5050 · AST Babel Parser v7</span>
      </div>
    </div>
  );
}
