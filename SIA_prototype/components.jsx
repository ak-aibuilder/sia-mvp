// Shared UI primitives

const { useState, useEffect, useRef, useMemo } = React;

// ——— Icons (minimal, hand-tuned) ———
const Icon = {
  arrowUp: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M8 3 L8 13 M4 7 L8 3 L12 7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowDown: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M8 3 L8 13 M4 9 L8 13 L12 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowRight: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M3 8 L13 8 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dash: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M4 8 L12 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  dot: (p) => <svg viewBox="0 0 16 16" width="8" height="8" {...p}><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>,
  upload: (p) => <svg viewBox="0 0 24 24" width="20" height="20" {...p}><path d="M12 16V4 M6 10l6-6 6 6 M4 20h16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pdf: (p) => <svg viewBox="0 0 24 24" width="16" height="20" {...p}><path d="M5 2h10l5 5v15H5z" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M15 2v5h5" fill="none" stroke="currentColor" strokeWidth="1.2"/><text x="12" y="17" fontSize="5" textAnchor="middle" fill="currentColor" fontFamily="monospace" fontWeight="600">PDF</text></svg>,
  sparkle: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M8 2 L9 7 L14 8 L9 9 L8 14 L7 9 L2 8 L7 7 Z" fill="currentColor"/></svg>,
  x: (p) => <svg viewBox="0 0 16 16" width="12" height="12" {...p}><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

// ——— Nav rail ———
function NavRail({ current, go, activeProject, loggedIn, onLogin, onLogout }) {
  const { ACCOUNT } = window.SIA_DATA;
  const items = [
    { id: 'cohort', label: 'Cohort', num: '01' },
    { id: 'student', label: 'Student', num: '02' },
    { id: 'upload', label: 'Batch Upload', num: '03' },
  ];
  return (
    <aside className="nav-rail">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M16 4 Q22 10 16 16 Q10 22 16 28" stroke="currentColor" strokeWidth="1" fill="none"/>
            <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">SIA</div>
          <div className="brand-sub">Script Intelligence</div>
        </div>
      </div>
      <nav>
        {items.map(it => (
          <button key={it.id}
            className={`nav-item ${current === it.id ? 'active' : ''}`}
            onClick={() => go(it.id)}>
            <span className="nav-num">{it.num}</span>
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-foot">
        <button className="cohort-chip cohort-chip-btn" onClick={() => go('projects')} title="Switch cohort">
          <div className="cohort-chip-label">
            <span>Active cohort</span>
            <span className="cc-switch">Switch ↗</span>
          </div>
          <div className="cohort-chip-name">{activeProject.name}</div>
          <div className="cohort-chip-meta">Week {activeProject.week} of {activeProject.totalWeeks} · {activeProject.writers} writers</div>
        </button>
        <div className="instructor-block">
          <button className="instructor instructor-btn" onClick={() => go('account')} title="My Account">
            <div className="avatar">{ACCOUNT.initials}</div>
            <div className="instr-text">
              <div className="instr-name">{ACCOUNT.name}</div>
              <div className="instr-role">{ACCOUNT.role.split('·')[0].trim()}</div>
            </div>
            <span className="chev">›</span>
          </button>
          <div className="instructor-links">
            <button className="inline-link" onClick={() => go('projects')}>Projects</button>
            <span className="link-sep">·</span>
            {loggedIn
              ? <button className="inline-link" onClick={onLogout}>Logout</button>
              : <button className="inline-link" onClick={onLogin}>Login</button>}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ——— Delta visualization (3 variants via tweak) ———
function DeltaViz({ student, variant }) {
  if (student.trend === 'new') {
    return <span className="delta-new">First draft</span>;
  }
  const { improved, regressed, unaddressed } = student;
  if (variant === 'bar') {
    const total = Math.max(improved + regressed + unaddressed, 1);
    return (
      <div className="delta-bar" title={`${improved} improved · ${regressed} regressed · ${unaddressed} unaddressed`}>
        <div className="delta-seg improved" style={{flex: improved || 0.001}} />
        <div className="delta-seg regressed" style={{flex: regressed || 0.001}} />
        <div className="delta-seg unaddressed" style={{flex: unaddressed || 0.001}} />
      </div>
    );
  }
  if (variant === 'arrows') {
    return (
      <div className="delta-arrows">
        <span className="delta-num improved">+{improved}</span>
        <span className="delta-num regressed">−{regressed}</span>
        <span className="delta-num unaddressed">·{unaddressed}</span>
      </div>
    );
  }
  // dots
  return (
    <div className="delta-dots">
      {Array.from({length: improved}).map((_,i) => <span key={'i'+i} className="dot improved"/>)}
      {Array.from({length: regressed}).map((_,i) => <span key={'r'+i} className="dot regressed"/>)}
      {Array.from({length: unaddressed}).map((_,i) => <span key={'u'+i} className="dot unaddressed"/>)}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    'exemplary':  { label: 'Exemplary', cls: 'pill-exemplary' },
    'on-track':   { label: 'On track',  cls: 'pill-ontrack'  },
    'attention':  { label: 'Attention', cls: 'pill-attention' },
    'intervene':  { label: 'Intervene', cls: 'pill-intervene' },
    'new':        { label: 'New',       cls: 'pill-new'       },
  };
  const s = map[status] || map['on-track'];
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

function TrendGlyph({ trend }) {
  if (trend === 'up')   return <span className="trend up"><Icon.arrowUp/></span>;
  if (trend === 'down') return <span className="trend down"><Icon.arrowDown/></span>;
  if (trend === 'flat') return <span className="trend flat"><Icon.dash/></span>;
  return <span className="trend new"><Icon.sparkle/></span>;
}

Object.assign(window, { Icon, NavRail, DeltaViz, StatusPill, TrendGlyph });
