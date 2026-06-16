// Screen 1 — Cohort Overview
const { useState: useStateCohort } = React;

function CohortScreen({ go, density, deltaVariant }) {
  const { COHORT, WEEK4_CRITERIA } = window.SIA_DATA;
  const [sortBy, setSortBy] = useStateCohort('status');
  const [filter, setFilter] = useStateCohort('all');

  const sorted = React.useMemo(() => {
    const copy = [...COHORT];
    const order = { intervene: 0, attention: 1, 'on-track': 2, exemplary: 3, new: 4 };
    if (sortBy === 'status') copy.sort((a,b) => order[a.status] - order[b.status]);
    if (sortBy === 'name')   copy.sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === 'draft')  copy.sort((a,b) => b.drafts - a.drafts);
    if (sortBy === 'submitted') copy.sort((a,b) => a.id - b.id);
    return copy.filter(s => filter === 'all' ? true : s.status === filter);
  }, [sortBy, filter]);

  const counts = {
    exemplary: COHORT.filter(s=>s.status==='exemplary').length,
    ontrack:   COHORT.filter(s=>s.status==='on-track').length,
    attention: COHORT.filter(s=>s.status==='attention').length,
    intervene: COHORT.filter(s=>s.status==='intervene').length,
    new:       COHORT.filter(s=>s.status==='new').length,
  };

  // cohort-wide patterns (derived)
  const patterns = [
    { crit: 'Midpoint reversal', count: 11, delta: 'persistent', note: '11 of 20 scripts still lack a midpoint shift — flagged last week too' },
    { crit: 'Visual storytelling', count: 9, delta: 'persistent', note: '9 writers still deliver backstory through dialogue' },
    { crit: 'Subtext', count: 6, delta: 'improving', note: 'Down from 14 last week — lecture stuck' },
  ];

  return (
    <div className={`screen cohort ${density}`}>
      <header className="screen-head">
        <div>
          <div className="eyebrow">Week 4 · Draft Review</div>
          <h1>Cohort Overview</h1>
          <p className="sub">20 scripts processed overnight · Ready for your review before Thursday 10am workshop</p>
        </div>
        <div className="head-meta">
          <div className="meta-block">
            <div className="meta-val">4.2<span className="unit">h</span></div>
            <div className="meta-label">saved vs. manual</div>
          </div>
          <div className="meta-block">
            <div className="meta-val">32<span className="unit">m</span></div>
            <div className="meta-label">review time est.</div>
          </div>
        </div>
      </header>

      {/* Summary row */}
      <section className="summary-row">
        <button className={`summary-card ${filter==='all'?'on':''}`} onClick={()=>setFilter('all')}>
          <div className="sc-num">20</div>
          <div className="sc-label">Total writers</div>
        </button>
        <button className={`summary-card ${filter==='exemplary'?'on':''}`} onClick={()=>setFilter('exemplary')}>
          <div className="sc-num sc-good">{counts.exemplary}</div>
          <div className="sc-label">Exemplary</div>
        </button>
        <button className={`summary-card ${filter==='on-track'?'on':''}`} onClick={()=>setFilter('on-track')}>
          <div className="sc-num">{counts.ontrack}</div>
          <div className="sc-label">On track</div>
        </button>
        <button className={`summary-card ${filter==='attention'?'on':''}`} onClick={()=>setFilter('attention')}>
          <div className="sc-num sc-warn">{counts.attention}</div>
          <div className="sc-label">Needs attention</div>
        </button>
        <button className={`summary-card ${filter==='intervene'?'on':''}`} onClick={()=>setFilter('intervene')}>
          <div className="sc-num sc-bad">{counts.intervene}</div>
          <div className="sc-label">Intervene</div>
        </button>
        <button className={`summary-card ${filter==='new'?'on':''}`} onClick={()=>setFilter('new')}>
          <div className="sc-num">{counts.new}</div>
          <div className="sc-label">First drafts</div>
        </button>
      </section>

      {/* Cohort patterns */}
      <section className="patterns">
        <div className="section-label">
          <span className="sec-num">A.</span>
          <span>Cohort-level patterns <em>— surface in Thursday's lecture</em></span>
        </div>
        <div className="pattern-list">
          {patterns.map((p, i) => (
            <div key={i} className={`pattern-row ${p.delta}`}>
              <div className="pattern-bar">
                <div className="pattern-fill" style={{width: `${(p.count/20)*100}%`}} />
                <span className="pattern-count">{p.count}<span className="pc-small">/20</span></span>
              </div>
              <div className="pattern-text">
                <div className="pattern-name">{p.crit}</div>
                <div className="pattern-note">{p.note}</div>
              </div>
              <div className={`pattern-tag ${p.delta}`}>{p.delta === 'persistent' ? 'Persistent' : 'Improving'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Student table */}
      <section className="table-section">
        <div className="section-label">
          <span className="sec-num">B.</span>
          <span>Writers</span>
          <div className="table-controls">
            <div className="sort-group">
              <span className="ctrl-label">Sort</span>
              {['status','name','draft','submitted'].map(k => (
                <button key={k} className={`ctrl ${sortBy===k?'on':''}`} onClick={()=>setSortBy(k)}>
                  {k === 'draft' ? 'Draft #' : k.charAt(0).toUpperCase()+k.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="student-table">
          <div className="st-head">
            <div>Writer</div>
            <div>Script</div>
            <div>Draft</div>
            <div>Pages</div>
            <div className="col-delta">Revision delta</div>
            <div>Trend</div>
            <div>Status</div>
            <div>Submitted</div>
            <div></div>
          </div>
          {sorted.map(s => (
            <button key={s.id} className="st-row" onClick={() => go('student', s.id)}>
              <div className="writer">
                <div className={`avatar avatar-${s.status}`}>{s.initials}</div>
                <span className="writer-name">{s.name}</span>
              </div>
              <div className="script-title">"{s.title}"</div>
              <div className="draft-num">
                {s.drafts === 1
                  ? <span className="draft-chip new">D1</span>
                  : <span className="draft-chip">D{s.drafts} <span className="prior">· was D{s.drafts-1}</span></span>}
              </div>
              <div className="pages">{s.pages}<span className="pg-unit">pp</span></div>
              <div className="col-delta">
                <DeltaViz student={s} variant={deltaVariant} />
              </div>
              <div><TrendGlyph trend={s.trend} /></div>
              <div><StatusPill status={s.status} /></div>
              <div className="submitted">{s.submitted}</div>
              <div className="row-cta"><Icon.arrowRight/></div>
            </button>
          ))}
        </div>
      </section>

      {/* Legend */}
      <footer className="legend">
        <div className="legend-title">Week 4 syllabus criteria — how SIA is evaluating</div>
        <div className="legend-grid">
          {WEEK4_CRITERIA.map(c => (
            <div key={c.id} className="legend-item">
              <span className="legend-dot" />
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

window.CohortScreen = CohortScreen;
