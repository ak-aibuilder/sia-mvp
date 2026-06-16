// Screen 3 — Batch upload

function UploadScreen({ go }) {
  const [phase, setPhase] = React.useState('drop'); // drop, matched, processing, done
  const [dragOver, setDragOver] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [progress, setProgress] = React.useState(0);

  const { COHORT } = window.SIA_DATA;

  const simulateDrop = () => {
    // Build a realistic file list from cohort
    const fs = COHORT.map(s => ({
      id: s.id,
      filename: `${s.name.replace(' ', '_')}_${s.title.replace(/[^a-z0-9]/gi,'_')}_D${s.drafts}.pdf`,
      size: (s.pages * 18 + Math.floor(Math.random()*40)) + ' KB',
      pages: s.pages,
      matchedTo: s.name,
      matchedConfidence: 0.94 + Math.random() * 0.06,
      isRevision: s.drafts > 1,
      priorDraft: s.drafts > 1 ? `D${s.drafts - 1}` : null,
      status: 'matched',
    }));
    setFiles(fs);
    setPhase('matched');
  };

  const startProcessing = () => {
    setPhase('processing');
    setProgress(0);
    let p = 0;
    const tick = () => {
      p += 1.7 + Math.random() * 1.2;
      if (p >= 100) { setProgress(100); setTimeout(() => setPhase('done'), 600); return; }
      setProgress(p);
      setTimeout(tick, 80);
    };
    tick();
  };

  const processedCount = Math.floor((progress / 100) * 20);

  // ——— DROP PHASE ———
  if (phase === 'drop') {
    return (
      <div className="screen upload">
        <header className="screen-head">
          <div>
            <div className="eyebrow">Week 4 · Batch Intake</div>
            <h1>Drop the cohort's drafts</h1>
            <p className="sub">SIA will match PDFs to writers, detect revisions, and have everything pre-annotated by morning.</p>
          </div>
          <div className="head-meta">
            <div className="meta-block"><div className="meta-val">20</div><div className="meta-label">writers expected</div></div>
            <div className="meta-block"><div className="meta-val">~8<span className="unit">min</span></div><div className="meta-label">est. total analysis</div></div>
          </div>
        </header>

        <div className={`drop-zone ${dragOver?'over':''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); simulateDrop(); }}
          onClick={simulateDrop}>
          <div className="drop-icon"><Icon.upload/></div>
          <h2>Drop 20 PDFs here</h2>
          <p>or <span className="link">click to browse</span> · FDX and TXT also accepted</p>
          <div className="drop-meta">
            <div>Week 4 roster loaded · <strong>TFT 434 — Short Film Workshop</strong></div>
            <div className="drop-hint">SIA matches by filename, then prompts you for any ambiguous ones.</div>
          </div>
        </div>

        {/* Context strip */}
        <section className="context-strip">
          <div className="cs-block">
            <div className="cs-label">Syllabus</div>
            <div className="cs-val">week4_objectives.pdf</div>
            <div className="cs-sub">6 criteria loaded · Inciting, Protagonist want, Scene economy…</div>
          </div>
          <div className="cs-block">
            <div className="cs-label">Prior drafts on file</div>
            <div className="cs-val">18 of 20 writers</div>
            <div className="cs-sub">2 writers submitting their first draft this week</div>
          </div>
          <div className="cs-block">
            <div className="cs-label">Rubric</div>
            <div className="cs-val">UCLA TFT v3 · pinned</div>
            <div className="cs-sub">Normalized across cohort — consistency enforced</div>
          </div>
          <div className="cs-block">
            <div className="cs-label">Privacy</div>
            <div className="cs-val">Encrypted · no training</div>
            <div className="cs-sub">Auto-purge end of semester unless retained</div>
          </div>
        </section>

        {/* What SIA will do */}
        <section className="will-do">
          <div className="section-label"><span className="sec-num">→</span><span>What happens after you drop</span></div>
          <ol className="will-list">
            <li>
              <div className="wl-num">1</div>
              <div>
                <div className="wl-head">Match PDFs to writers</div>
                <div className="wl-body">Filename heuristics + content fingerprint. You'll confirm any &lt; 90% confidence matches.</div>
              </div>
            </li>
            <li>
              <div className="wl-num">2</div>
              <div>
                <div className="wl-head">Detect revisions</div>
                <div className="wl-body">For each writer, SIA pulls their prior draft from the portfolio and runs the Revision Coach diff.</div>
              </div>
            </li>
            <li>
              <div className="wl-num">3</div>
              <div>
                <div className="wl-head">Align to this week's syllabus</div>
                <div className="wl-body">All evaluation runs against Week 4 criteria — same rubric, every writer.</div>
              </div>
            </li>
            <li>
              <div className="wl-num">4</div>
              <div>
                <div className="wl-head">Wake up to a pre-annotated dashboard</div>
                <div className="wl-body">~8 minutes per batch. You'll have a cohort summary plus 20 individual revision ledgers ready for review.</div>
              </div>
            </li>
          </ol>
        </section>
      </div>
    );
  }

  // ——— MATCHED / PROCESSING / DONE PHASES ———
  const processing = phase === 'processing';
  const done = phase === 'done';

  return (
    <div className="screen upload">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Week 4 · Batch Intake</div>
          <h1>
            {phase === 'matched'  && '20 PDFs matched'}
            {processing && 'Analyzing cohort…'}
            {done && 'Analysis complete'}
          </h1>
          <p className="sub">
            {phase === 'matched'  && 'Review the matches below, then kick off the Revision Coach agent for all 20 writers.'}
            {processing && `The Revision Coach Agent is running against Week 4 criteria. You can close this tab — we'll email you when it's done.`}
            {done && 'All 20 revision ledgers are ready. Head to the cohort overview to review.'}
          </p>
        </div>
        {phase === 'matched' && (
          <div className="head-actions">
            <button className="btn btn-ghost" onClick={() => { setPhase('drop'); setFiles([]); }}>Start over</button>
            <button className="btn btn-primary lg" onClick={startProcessing}>
              Run Revision Coach on 20 scripts →
            </button>
          </div>
        )}
        {done && (
          <div className="head-actions">
            <button className="btn btn-primary lg" onClick={() => go('cohort')}>Open cohort overview →</button>
          </div>
        )}
      </header>

      {processing && (
        <section className="processing-panel">
          <div className="pp-meter">
            <div className="pp-fill" style={{width: `${progress}%`}}/>
          </div>
          <div className="pp-meta">
            <div><strong>{processedCount}</strong> of 20 scripts analyzed</div>
            <div>{Math.round(progress)}% · ~{Math.max(1, Math.round((100-progress)/13))} min remaining</div>
          </div>
          <div className="pp-stages">
            {[
              { label: 'Parse PDFs',        done: progress > 15 },
              { label: 'Match to writers',  done: progress > 30 },
              { label: 'Load prior drafts', done: progress > 45 },
              { label: 'Align to syllabus', done: progress > 60 },
              { label: 'Generate deltas',   done: progress > 85 },
              { label: 'Finalize ledger',   done: progress >= 100 },
            ].map((s, i, arr) => {
              const active = !s.done && (i === 0 || arr[i-1].done);
              return (
                <div key={i} className={`pp-stage ${s.done?'done':''} ${active?'active':''}`}>
                  <div className="pp-stage-dot">{s.done ? <Icon.check/> : i+1}</div>
                  <div className="pp-stage-label">{s.label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="file-table">
        <div className="ft-head">
          <div>File</div>
          <div>Matched to</div>
          <div>Type</div>
          <div>Pages</div>
          <div>Confidence</div>
          <div className="col-status">Status</div>
        </div>
        {files.map((f, i) => {
          const analyzed = done || (processing && (i / files.length) * 100 < progress);
          const analyzing = processing && !analyzed && (((i - 1) / files.length) * 100 < progress);
          return (
            <div key={f.id} className={`ft-row ${analyzing?'analyzing':''} ${analyzed?'analyzed':''}`}>
              <div className="ft-file">
                <Icon.pdf/>
                <div>
                  <div className="ft-filename">{f.filename}</div>
                  <div className="ft-size">{f.size}</div>
                </div>
              </div>
              <div className="ft-writer">
                <span className="ft-writer-name">{f.matchedTo}</span>
              </div>
              <div>
                {f.isRevision
                  ? <span className="ft-type rev">Revision · {f.priorDraft} → D{COHORT.find(c=>c.id===f.id).drafts}</span>
                  : <span className="ft-type new">First draft</span>}
              </div>
              <div className="ft-pages">{f.pages}</div>
              <div>
                <div className="conf">
                  <div className="conf-bar"><div className="conf-fill" style={{width: `${f.matchedConfidence*100}%`}}/></div>
                  <span>{Math.round(f.matchedConfidence*100)}%</span>
                </div>
              </div>
              <div className="col-status">
                {phase === 'matched' && <span className="ft-status matched"><Icon.check/> Matched</span>}
                {analyzing && <span className="ft-status analyzing"><span className="spinner"/> Analyzing…</span>}
                {analyzed && <span className="ft-status done"><Icon.check/> Ledger ready</span>}
                {processing && !analyzed && !analyzing && <span className="ft-status queued">Queued</span>}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

window.UploadScreen = UploadScreen;
