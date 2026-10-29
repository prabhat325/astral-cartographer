import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import {
  LayoutDashboard,
  Network,
  Layers,
  FileCode2,
  AlertTriangle,
  Flame,
  Compass,
  Activity,
  PlusCircle,
  GitBranch,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { state, setView, toggleSidebar } = useAnalysis();
  const { activeView, result, sidebarOpen } = state;

  const arch = result?.architecture;
  const summary = arch?.summary;
  const circularCount = arch?.circularCycles?.length ?? 0;
  const hotspotCount = arch?.hotspots?.length ?? 0;
  const callCount = arch?.callEdges?.length || arch?.functionCalls?.length || 0;
  const fileCount = result?.totalFiles || arch?.nodes?.length || 0;
  const onboardingCount = (arch?.onboarding?.goodFirstIssues?.length || 0) + (arch?.onboarding?.coreHubs?.length || 0);
  const healthScore = summary?.healthScore ?? null;

  const NAV_SECTIONS = [
    {
      heading: 'TOPOLOGY & CODE',
      items: [
        {
          key: 'overview',
          label: 'Overview',
          icon: LayoutDashboard,
          badge: null
        },
        {
          key: 'dependency',
          label: 'Dependency Graph',
          icon: Network,
          badge: `${arch?.edges?.length || 0} edges`
        },
        {
          key: 'callGraph',
          label: 'Function Call Graph',
          icon: Layers,
          badge: `${callCount} calls`
        },
        {
          key: 'codeExplorer',
          label: 'Code Explorer',
          icon: FileCode2,
          badge: `${fileCount} files`
        },
      ]
    },
    {
      heading: 'ARCHITECTURAL AUDIT',
      items: [
        {
          key: 'circular',
          label: 'Circular Dependencies',
          icon: AlertTriangle,
          badge: circularCount > 0 ? `${circularCount} cycle${circularCount > 1 ? 's' : ''}` : 'Clean',
          badgeVariant: circularCount > 0 ? 'pill-error' : 'pill-emerald'
        },
        {
          key: 'hotspots',
          label: 'Complexity Hotspots',
          icon: Flame,
          badge: hotspotCount > 0 ? `${hotspotCount} hotspot${hotspotCount > 1 ? 's' : ''}` : 'Optimal',
          badgeVariant: hotspotCount > 0 ? 'pill-amber' : 'pill-emerald'
        },
        {
          key: 'onboarding',
          label: 'Smart Onboarding',
          icon: Compass,
          badge: onboardingCount > 0 ? `${onboardingCount} paths` : null,
          badgeVariant: 'pill-gold'
        },
        {
          key: 'health',
          label: 'Health Scorecard',
          icon: Activity,
          badge: healthScore !== null ? `${healthScore}/100` : null,
          badgeVariant: healthScore >= 80 ? 'pill-emerald' : 'pill-gold'
        },
      ]
    },
    {
      heading: 'WORKSPACE',
      items: [
        {
          key: 'home',
          label: 'New Analysis',
          icon: PlusCircle,
          badge: null
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(67, 40, 50, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      <aside
        className={`sidebar-royal ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 270,
          minWidth: 270,
          height: 'calc(100vh - 68px)',
          position: 'sticky',
          top: 68,
          background: 'var(--color-pearl-white)',
          borderRight: '1px solid var(--border-gold-subtle)',
          boxShadow: '2px 0 12px rgba(67, 40, 50, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 95,
          overflowY: 'auto'
        }}
      >
        {/* Active Repository Card in Sidebar */}
        {result && (
          <div style={{
            padding: '16px 16px 14px',
            borderBottom: '1px solid var(--border-gold-subtle)',
            background: 'linear-gradient(135deg, #FFFDFB 0%, #F9F1E8 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--color-antique-gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <GitBranch size={12} />
                <span>Active Codebase</span>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={toggleSidebar}
                style={{ display: 'none', padding: 2 }}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--color-deep-burgundy)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {result.repository?.name || 'Repository'}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2
            }}>
              {result.repository?.fullName || 'astral-analysis'}
            </div>
          </div>
        )}

        {/* Navigation Section Groups */}
        <div style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading}>
              <div style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.09em',
                color: 'var(--text-muted)',
                padding: '0 10px 6px',
                textTransform: 'uppercase'
              }}>
                {section.heading}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setView(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isActive ? '1px solid var(--border-gold-solid)' : '1px solid transparent',
                        background: isActive ? 'linear-gradient(135deg, #FFFDFB 0%, #FAF2E8 100%)' : 'transparent',
                        color: isActive ? 'var(--color-deep-burgundy)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.16s ease',
                        textAlign: 'left',
                        boxShadow: isActive ? '0 2px 8px rgba(212, 175, 112, 0.18)' : 'none',
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <Icon
                          size={16}
                          color={isActive ? 'var(--color-antique-gold)' : 'var(--text-muted)'}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          className={`pill ${item.badgeVariant || 'pill-gold'}`}
                          style={{ height: 18, fontSize: 9.5, padding: '0 6px', flexShrink: 0 }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Indicator */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-gold-subtle)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span className="pulse-gold" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-antique-gold)' }} />
          <span>AST Cartography Engine</span>
        </div>
      </aside>
    </>
  );
}
