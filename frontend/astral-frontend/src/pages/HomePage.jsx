import React, { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';

const EXAMPLES = [
  'astral-sh/ruff',
  'fastapi/fastapi',
  'expressjs/express',
  'vercel/turborepo',
  'facebook/react',
  'vuejs/vue',
];

const STEPS = [
  'Cloning repository tree…',
  'Fetching source files via GitHub API…',
  'Running AST parser on all files…',
  'Building dependency graph…',
  'Computing architectural metrics…',
  'Detecting circular cycles…',
  'Synthesis complete!',
];

export default function HomePage() {
  const { state, runAnalysis, setRepoUrl, loadDemo } = useAnalysis();
  const { status, error, repoUrl } = state;

  const [localSlug, setLocalSlug] = useState(repoUrl || '');
  const [progress, setProgress]   = useState(0);
  const [stepIdx, setStepIdx]     = useState(0);
  const intervalRef = useRef(null);

  const loading = status === 'loading';

  // Animate progress bar while loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setProgress(5);
        setStepIdx(0);
      }, 0);
      let step = 0;
      intervalRef.current = setInterval(() => {
        step++;
        setStepIdx(Math.min(step, STEPS.length - 1));
        setProgress((p) => Math.min(p + 13, 92));
      }, 900);
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
    if (!localSlug.trim()) return;
    setRepoUrl(localSlug.trim());
    runAnalysis(localSlug.trim());
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      background: 'var(--color-background)', paddingTop: 48, paddingBottom: 48,
    }}>
      {/* Hero header */}
      <div style={{ textAlign: 'center', maxWidth: 640, padding: '0 24px', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          background: 'rgba(152,169,255,0.2)', color: '#283a8a',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          AST Architecture Analyzer
        </div>
        <h1 style={{
          fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, letterSpacing: '-0.03em',
          color: 'var(--color-on-surface)', lineHeight: 1.15, marginBottom: 16,
        }}>
          Understand your codebase,<br/>
          <span style={{ color: 'var(--color-primary)' }}>visually.</span>
        </h1>
        <p style={{
          fontSize: 16, color: 'var(--color-on-surface-variant)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto',
        }}>
          Visualize architectural boundaries, trace file dependencies, and isolate structural 
          circularities across your GitHub repository in seconds.
        </p>
      </div>

      {/* Input card */}
      <div className="card" style={{ width: '100%', maxWidth: 680, margin: '0 24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* URL row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: 200, display: 'flex', alignItems: 'center',
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius)',
              padding: '0 14px', gap: 8, transition: 'box-shadow 0.15s',
            }}
              onFocus={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-focus)'}
              onBlur={(e) => e.currentTarget.style.boxShadow = ''}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-outline)" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-outline)', whiteSpace: 'nowrap' }}>
                github.com/
              </span>
              <input
                className="input"
                value={localSlug}
                onChange={(e) => setLocalSlug(e.target.value)}
                placeholder="organization/repository"
                style={{ border: 'none', padding: '12px 0', boxShadow: 'none', fontFamily: 'var(--font-mono)', fontSize: 14 }}
                disabled={loading}
                autoComplete="off"
                spellCheck="false"
              />
              {localSlug && (
                <button type="button" className="btn-ghost" style={{ padding: 4, borderRadius: 4 }}
                  onClick={() => setLocalSlug('')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !localSlug.trim()}
              style={{ padding: '0 24px', height: 46, fontSize: 14, fontWeight: 600, borderRadius: 'var(--radius)' }}>
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing…</>
              ) : (
                <>
                  Analyze
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Progress */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>
                {STEPS[stepIdx]}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <strong>Analysis failed:</strong> {error}
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                    GitHub's public rate limit is exhausted. Set your <code>GITHUB_TOKEN</code> in <code>github-service/.env</code>, or click below to explore immediately:
                  </div>
                </div>
              </div>
              <div style={{ paddingLeft: 26 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: 12, height: 'auto', background: 'var(--color-primary)' }}
                  onClick={loadDemo}
                >
                  ⚡ Explore Demo Architecture Now
                </button>
              </div>
            </div>
          )}

          {/* Example pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--color-outline)', textTransform: 'uppercase' }}>
              Try:
            </span>
            <button
              type="button"
              className="chip"
              style={{ background: 'var(--color-primary)', color: '#ffffff', fontWeight: 600, border: 'none' }}
              onClick={loadDemo}
              disabled={loading}
            >
              ⚡ Built-in Demo Repo
            </button>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip"
                onClick={() => setLocalSlug(ex)}
                disabled={loading}>
                {ex}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Feature strip */}
      <div style={{
        marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))',
        gap: 20, width: '100%', maxWidth: 900, padding: '0 24px',
      }}>
        {[
          { icon: '⬡', title: 'Dependency Graph', desc: 'Interactive force-directed graph of all file imports and module relationships.' },
          { icon: '⚡', title: 'Code Metrics', desc: 'LOC, cyclomatic complexity, afferent/efferent coupling per file.' },
          { icon: '🔴', title: 'Cycle Detection', desc: 'Instantly pinpoint circular dependency loops with depth and blast radius.' },
          { icon: '❤️', title: 'Health Score', desc: 'Composite architectural health rating from 0–100 based on coupling, complexity, and cycles.' },
        ].map((f) => (
          <div key={f.title} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--color-on-surface)' }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 48, fontSize: 12, color: 'var(--color-outline)',
        fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-emerald)', display: 'inline-block' }} />
        github-service · analyzer engine · react frontend
      </div>
    </div>
  );
}
