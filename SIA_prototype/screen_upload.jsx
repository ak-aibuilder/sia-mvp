// Screen 3 — Live upload + Revision Coach (real draft-over-draft analysis)
// Drops a single screenplay; the server (agent/server.py) finds the prior draft
// in its library and runs the real comparison. Falls back to a friendly message
// if the server isn't running.

const TREND_TO_STATUS = { up: 'on-track', down: 'intervene', flat: 'attention' };

function UploadScreen({ go }) {
  const [phase, setPhase] = React.useState('drop'); // drop, matched, processing, done
  const [dragOver, setDragOver] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [detected, setDetected] = React.useState(null); // {title, pages, priorName, priorFound}
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  const { COHORT } = window.SIA_DATA;

  const onPick = (f) => {
    if (!f) return;
    setError(null);
    setBusy(true);
    setFile(f);
    const body = new FormData();
    body.append('file', f);
    fetch('/api/inspect', { method: 'POST', body })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error || 'Inspect failed');
        setDetected(j);
        setPhase('matched');
      })
      .catch(err => setError(serverHint(err)))
      .finally(() => setBusy(false));
  };

  const runAnalyze = () => {
    setPhase('processing');
    setProgress(0);
    setError(null);
    let p = 0;
    let done = false;
    const tick = () => {
      if (done) return;
      p += (p < 70 ? 2.2 : 0.5) + Math.random() * 0.8;
      setProgress(Math.min(p, 93));
      if (p < 93) setTimeout(tick, 120);
    };
    tick();

    const body = new FormData();
    body.append('file', file);
    fetch('/api/analyze', { method: 'POST', body })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        done = true;
        if (!ok) throw new Error(j.error || 'Analyze failed');
        injectResult(j);
        setProgress(100);
        setTimeout(() => go('student', 1), 500);
      })
      .catch(err => { done = true; setError(serverHint(err)); setPhase('matched'); });
  };

  // Replace the featured student's analysis (id 1) with the live result.
  const injectResult = (res) => {
    const D = window.SIA_DATA;
    D.FEATURED = res.featured;
    const s = D.COHORT.find(c => c.id === 1);
    if (s) {
      s.title = res.title;
      s.pages = res.draftPage;
      const sum = res.featured.summary;
      s.improved = sum.improved;
      s.regressed = sum.regressed;
      s.unaddressed = sum.unaddressed;
      s.trend = sum.overallTrend;
      s.status = TREND_TO_STATUS[sum.overallTrend] || 'attention';
    }
  };

  const drafts1 = (COHORT.find(c => c.id === 1) || {}).drafts || 3;

  // ——— DROP PHASE ———
  if (phase === 'drop') {
    return (
      <div className="screen upload">
        <input ref={inputRef} type="file" accept=".pdf,.txt,.fdx" style={{ display: 'none' }}
          onChange={e => onPick(e.target.files[0])} />
        <header className="screen-head">
          <div>
            <div className="eyebrow">Week 4 · Revision Coach</div>
            <h1>Drop a revised draft</h1>
            <p className="sub">SIA finds the writer's prior draft, then runs the Revision Coach diff against the Week 4 criteria.</p>
          </div>
          <div className="head-meta">
            <div className="meta-block"><div className="meta-val">6</div><div className="meta-label">criteria loaded</div></div>
            <div className="meta-block"><div className="meta-val">~1<span className="unit">min</span></div><div className="meta-label">est. analysis</div></div>
          </div>
        </header>

        {error && <div className="drop-meta" style={{ color: '#b4452f', padding: '12px 16px' }}>{error}</div>}

        <div className={`drop-zone ${dragOver ? 'over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); onPick(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current && inputRef.current.click()}>
          <div className="drop-icon"><Icon.upload /></div>
          <h2>{busy ? 'Reading draft…' : 'Drop a screenplay PDF here'}</h2>
          <p>or <span className="link">click to browse</span> · FDX and TXT also accepted</p>
          <div className="drop-meta">
            <div>Week 4 roster loaded · <strong>TFT 434 — Short Film Workshop</strong></div>
            <div className="drop-hint">SIA detects the title, pulls the matching prior draft, and diffs them.</div>
          </div>
        </div>

        <section className="context-strip">
          <div className="cs-block">
            <div className="cs-label">Syllabus</div>
            <div className="cs-val">week4_objectives.pdf</div>
            <div className="cs-sub">6 criteria loaded · Inciting, Protagonist want, Scene economy…</div>
          </div>
          <div className="cs-block">
            <div className="cs-label">Prior drafts on file</div>
            <div className="cs-val">Portfolio library</div>
            <div className="cs-sub">SIA auto-matches the uploaded draft to its earlier version</div>
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

        <section className="will-do">
          <div className="section-label"><span className="sec-num">→</span><span>What happens after you drop</span></div>
          <ol className="will-list">
            <li><div className="wl-num">1</div><div>
              <div className="wl-head">Match the PDF to a writer</div>
              <div className="wl-body">Title + content fingerprint identify the script and the writer.</div></div></li>
            <li><div className="wl-num">2</div><div>
              <div className="wl-head">Pull the prior draft</div>
              <div className="wl-body">SIA finds the earlier version in the portfolio and runs the Revision Coach diff.</div></div></li>
            <li><div className="wl-num">3</div><div>
              <div className="wl-head">Align to this week's syllabus</div>
              <div className="wl-body">Evaluation runs against the same Week 4 criteria, every writer.</div></div></li>
            <li><div className="wl-num">4</div><div>
              <div className="wl-head">Open the revision ledger</div>
              <div className="wl-body">A draft-over-draft ledger of what improved, regressed, and went unaddressed.</div></div></li>
          </ol>
        </section>
      </div>
    );
  }

  // ——— MATCHED / PROCESSING PHASES (single live file) ———
  const processing = phase === 'processing';
  const title = (detected && detected.title) || 'Screenplay';
  const pages = (detected && detected.pages) || 0;
  const priorFound = detected && detected.priorFound;
  const row = {
    id: 1,
    filename: (file && file.name) || `${title}.pdf`,
    size: file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : '',
    pages,
    matchedTo: 'Priya Sharma',
    priorName: detected && detected.priorName,
  };

  return (
    <div className="screen upload">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Week 4 · Revision Coach</div>
          <h1>{processing ? 'Running Revision Coach…' : (priorFound ? 'Draft matched' : 'No prior draft found')}</h1>
          <p className="sub">
            {processing
              ? `Comparing "${title}" against its prior draft on the Week 4 criteria.`
              : priorFound
                ? `Found "${title}" and its earlier draft in the portfolio. Run the diff to generate the revision ledger.`
                : `Detected "${title}" but no earlier draft is in the library to compare against.`}
          </p>
        </div>
        {phase === 'matched' && (
          <div className="head-actions">
            <button className="btn btn-ghost" onClick={() => { setPhase('drop'); setFile(null); setDetected(null); }}>Start over</button>
            <button className="btn btn-primary lg" disabled={!priorFound} onClick={runAnalyze}>
              Run Revision Coach →
            </button>
          </div>
        )}
      </header>

      {error && <div className="drop-meta" style={{ color: '#b4452f', padding: '12px 16px' }}>{error}</div>}

      {processing && (
        <section className="processing-panel">
          <div className="pp-meter"><div className="pp-fill" style={{ width: `${progress}%` }} /></div>
          <div className="pp-meta">
            <div><strong>{title}</strong> · {pages} pages</div>
            <div>{Math.round(progress)}%</div>
          </div>
          <div className="pp-stages">
            {[
              { label: 'Parse PDF', done: progress > 12 },
              { label: 'Match to writer', done: progress > 28 },
              { label: 'Load prior draft', done: progress > 44 },
              { label: 'Align to syllabus', done: progress > 60 },
              { label: 'Generate deltas', done: progress > 88 },
              { label: 'Finalize ledger', done: progress >= 100 },
            ].map((s, i, arr) => {
              const active = !s.done && (i === 0 || arr[i - 1].done);
              return (
                <div key={i} className={`pp-stage ${s.done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  <div className="pp-stage-dot">{s.done ? <Icon.check /> : i + 1}</div>
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
        <div className={`ft-row ${processing ? 'analyzing' : ''}`}>
          <div className="ft-file">
            <Icon.pdf />
            <div>
              <div className="ft-filename">{row.filename}</div>
              <div className="ft-size">{row.size}</div>
            </div>
          </div>
          <div className="ft-writer"><span className="ft-writer-name">{row.matchedTo}</span></div>
          <div>
            {priorFound
              ? <span className="ft-type rev">Revision · D{drafts1 - 1} → D{drafts1}</span>
              : <span className="ft-type new">First draft</span>}
          </div>
          <div className="ft-pages">{row.pages}</div>
          <div>
            <div className="conf">
              <div className="conf-bar"><div className="conf-fill" style={{ width: `${priorFound ? 97 : 40}%` }} /></div>
              <span>{priorFound ? 97 : 40}%</span>
            </div>
          </div>
          <div className="col-status">
            {phase === 'matched' && priorFound && <span className="ft-status matched"><Icon.check /> Matched · {row.priorName}</span>}
            {phase === 'matched' && !priorFound && <span className="ft-status queued">No prior</span>}
            {processing && <span className="ft-status analyzing"><span className="spinner" /> Analyzing…</span>}
          </div>
        </div>
      </section>
    </div>
  );
}

function serverHint(err) {
  const msg = (err && err.message) || String(err);
  if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
    return 'Cannot reach the analysis server. Start it with:  python agent/server.py  (then reload this page from http://localhost:8731).';
  }
  return msg;
}

window.UploadScreen = UploadScreen;
