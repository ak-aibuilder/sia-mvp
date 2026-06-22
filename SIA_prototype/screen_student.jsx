// Screen 2 — Student detail / Revision Coach output

function StudentScreen({ go, studentId }) {
  const { COHORT, WEEK4_CRITERIA, FEATURED } = window.SIA_DATA;
  const student = COHORT.find(s => s.id === studentId) || COHORT[0];
  const isFeatured = student.id === FEATURED.id;
  const [activeFinding, setActiveFinding] = React.useState(0);
  const [approved, setApproved] = React.useState({});
  const [filterType, setFilterType] = React.useState('all');

  // Use the featured detail for Priya; for other students, synthesize lightly
  const findings = isFeatured ? FEATURED.findings : buildSyntheticFindings(student);
  const shown = findings.filter(f => filterType === 'all' ? true : f.type === filterType);

  const current = shown[Math.min(activeFinding, shown.length - 1)] || shown[0];

  const prevId = student.id === 1 ? 20 : student.id - 1;
  const nextId = student.id === 20 ? 1 : student.id + 1;

  return (
    <div className="screen student-detail">
      {/* Sticky sub-header */}
      <header className="student-head">
        <button className="back-btn" onClick={() => go('cohort')}>
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M13 8 L3 8 M7 4 L3 8 L7 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Cohort</span>
        </button>
        <div className="student-head-main">
          <div className="student-identity">
            <div className={`avatar avatar-${student.status} lg`}>{student.initials}</div>
            <div>
              <h1>{student.name}</h1>
              <div className="student-meta">
                <span className="script-title-lg">"{student.title}"</span>
                <span className="dot-sep">·</span>
                <span>Draft {student.drafts}</span>
                <span className="dot-sep">·</span>
                <span>{student.pages} pages</span>
                <span className="dot-sep">·</span>
                <span>Submitted {student.submitted}</span>
              </div>
            </div>
          </div>
          <div className="student-head-right">
            <StatusPill status={student.status} />
            <div className="paging">
              <button onClick={() => go('student', prevId)} title="Previous writer">‹</button>
              <span>{student.id} / 20</span>
              <button onClick={() => go('student', nextId)} title="Next writer">›</button>
            </div>
          </div>
        </div>
      </header>

      {/* Revision Coach banner */}
      <section className="coach-banner">
        <div className="coach-title">
          <div className="coach-badge"><Icon.sparkle/> Revision Coach Agent</div>
          <h2>Draft {student.drafts} vs Draft {student.drafts - 1 || 1}</h2>
        </div>
        <div className="coach-deltas">
          <div className="coach-delta improved">
            <div className="cd-num">{isFeatured ? FEATURED.summary.improved : student.improved}</div>
            <div className="cd-label">Improved</div>
          </div>
          <div className="coach-delta regressed">
            <div className="cd-num">{isFeatured ? FEATURED.summary.regressed : student.regressed}</div>
            <div className="cd-label">Regressed</div>
          </div>
          <div className="coach-delta unaddressed">
            <div className="cd-num">{isFeatured ? FEATURED.summary.unaddressed : student.unaddressed}</div>
            <div className="cd-label">Unaddressed</div>
          </div>
        </div>
        <div className="coach-summary">
          <span className="summary-q">Coach note →</span>
          {isFeatured
            ? FEATURED.summary.note
            : 'Net movement this draft. The full revision ledger is below — review and release when ready.'}
        </div>
      </section>

      {/* Syllabus alignment grid */}
      <section className="criteria-grid">
        <div className="section-label">
          <span className="sec-num">A.</span>
          <span>Syllabus alignment — Week 4 criteria</span>
        </div>
        <div className="criteria-row">
          {WEEK4_CRITERIA.map(c => {
            const f = findings.find(x => x.criterion === c.id);
            const kind = f ? f.type : 'met';
            return (
              <div key={c.id} className={`crit-card crit-${kind}`}>
                <div className="crit-head">
                  <div className={`crit-indicator crit-${kind}`}>
                    {kind === 'improved'    && <Icon.arrowUp/>}
                    {kind === 'regressed'   && <Icon.arrowDown/>}
                    {kind === 'unaddressed' && <Icon.dash/>}
                    {kind === 'met'         && <Icon.check/>}
                  </div>
                  <div className="crit-kind">{
                    kind === 'improved'    ? 'Improved'   :
                    kind === 'regressed'   ? 'Regressed'  :
                    kind === 'unaddressed' ? 'Unaddressed': 'Met'
                  }</div>
                </div>
                <div className="crit-label">{c.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Revision ledger */}
      <section className="ledger">
        <div className="section-label">
          <span className="sec-num">B.</span>
          <span>Revision ledger</span>
          <div className="ledger-filters">
            {['all','improved','regressed','unaddressed'].map(t => (
              <button key={t} className={`ctrl ${filterType===t?'on':''}`} onClick={() => { setFilterType(t); setActiveFinding(0); }}>
                {t === 'all' ? 'All findings' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="ledger-body">
          {/* Finding list */}
          <div className="finding-list">
            {shown.map((f, i) => (
              <button key={i}
                className={`finding-item ${i===activeFinding?'active':''} f-${f.type}`}
                onClick={() => setActiveFinding(i)}>
                <div className={`f-type-pill f-${f.type}`}>
                  {f.type === 'improved'  && <><Icon.arrowUp/> Improved</>}
                  {f.type === 'regressed' && <><Icon.arrowDown/> Regressed</>}
                  {f.type === 'unaddressed' && <><Icon.dash/> Unaddressed</>}
                </div>
                <div className="f-headline">{f.headline}</div>
                <div className="f-crit-tag">{WEEK4_CRITERIA.find(c => c.id === f.criterion)?.short}</div>
                {approved[i] && <div className="f-approved"><Icon.check/> Released</div>}
              </button>
            ))}
          </div>

          {/* Finding detail */}
          {current && (
            <div className={`finding-detail f-${current.type}`}>
              <div className="detail-head">
                <div className={`f-type-pill lg f-${current.type}`}>
                  {current.type === 'improved'    && <><Icon.arrowUp/> Improved since Draft {student.drafts - 1}</>}
                  {current.type === 'regressed'   && <><Icon.arrowDown/> Regressed since Draft {student.drafts - 1}</>}
                  {current.type === 'unaddressed' && <><Icon.dash/> Unaddressed · flagged in {current.priorDraft?.includes('Draft 1') ? 'Drafts 1 & 2' : 'Draft 2'}</>}
                </div>
                <div className="detail-actions">
                  <button className="btn btn-ghost">Edit AI note</button>
                  <button className={`btn btn-primary ${approved[activeFinding]?'approved':''}`}
                    onClick={() => setApproved({...approved, [activeFinding]: !approved[activeFinding]})}>
                    {approved[activeFinding] ? <><Icon.check/> Released to student</> : 'Approve & release'}
                  </button>
                </div>
              </div>
              <h3 className="detail-headline">{current.headline}</h3>

              <div className="detail-grid">
                <div className="detail-col prior">
                  <div className="col-eyebrow">In Draft {student.drafts - 1}</div>
                  <p>{current.priorDraft}</p>
                </div>
                <div className="detail-col current">
                  <div className="col-eyebrow">In Draft {student.drafts}</div>
                  <p>{current.currentDraft}</p>
                </div>
              </div>

              {current.evidence && (
                <div className="evidence">
                  <div className="evidence-head">
                    <span className="ev-label">Evidence · p.{current.evidence.page}</span>
                    <button className="ev-open">Open in script →</button>
                  </div>
                  <pre className="script-excerpt">{current.evidence.excerpt}</pre>
                </div>
              )}

              <div className="instructor-note">
                <div className="in-eyebrow">Your addendum to this note</div>
                <textarea placeholder="Add a personal note to the student. SIA's analysis sits above — yours below." defaultValue={current.type === 'unaddressed' ? `${student.name.split(' ')[0]} — this one's been flagged before. Let's block 30min to work through it together; it's holding the rest of your revision back.` : ''}/>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer actions */}
      <footer className="student-footer">
        <div className="footer-left">
          <span className="fl-count">{Object.values(approved).filter(Boolean).length} of {shown.length}</span>
          <span className="fl-label">findings released</span>
        </div>
        <div className="footer-actions">
          <button className="btn btn-ghost">Save draft notes</button>
          <button className="btn btn-primary lg">Release all feedback to {student.name.split(' ')[0]}</button>
        </div>
      </footer>
    </div>
  );
}

function buildSyntheticFindings(student) {
  const { WEEK4_CRITERIA } = window.SIA_DATA;
  const out = [];
  for (let i = 0; i < Math.min(student.improved, 3); i++) {
    const c = WEEK4_CRITERIA[i % WEEK4_CRITERIA.length];
    out.push({
      type: 'improved', criterion: c.id,
      headline: `${c.label} — addressed in this draft`,
      priorDraft: `Draft ${student.drafts - 1} was flagged for this criterion.`,
      currentDraft: `Draft ${student.drafts} demonstrates measurable improvement.`,
      evidence: null,
    });
  }
  for (let i = 0; i < Math.min(student.regressed, 2); i++) {
    const c = WEEK4_CRITERIA[(i + 3) % WEEK4_CRITERIA.length];
    out.push({
      type: 'regressed', criterion: c.id,
      headline: `${c.label} — weakened in this draft`,
      priorDraft: `Draft ${student.drafts - 1} was stronger on this point.`,
      currentDraft: `Draft ${student.drafts} has softened this element.`,
      evidence: null,
    });
  }
  for (let i = 0; i < Math.min(student.unaddressed, 2); i++) {
    const c = WEEK4_CRITERIA[(i + 1) % WEEK4_CRITERIA.length];
    out.push({
      type: 'unaddressed', criterion: c.id,
      headline: `${c.label} — still unaddressed`,
      priorDraft: `Flagged in prior drafts; no change.`,
      currentDraft: `No structural change to this element in Draft ${student.drafts}.`,
      evidence: null,
    });
  }
  return out;
}

window.StudentScreen = StudentScreen;
