// Screens: Projects, Account, Login

function ProjectsScreen({ go, activeProjectId, setActiveProjectId }) {
  const { PROJECTS } = window.SIA_DATA;
  const [filter, setFilter] = React.useState('all');
  const shown = PROJECTS.filter(p => filter === 'all' ? true : p.status === filter);

  return (
    <div className="screen projects">
      <header className="screen-head">
        <div>
          <div className="eyebrow">My workspace</div>
          <h1>Projects</h1>
          <p className="sub">Each project is a cohort you're teaching. Switch to one to load its writers, syllabus, and revision history.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost">Import roster CSV</button>
          <button className="btn btn-primary lg">+ New cohort</button>
        </div>
      </header>

      <div className="proj-filters">
        {['all', 'active', 'completed'].map(k => (
          <button key={k} className={`ctrl ${filter===k?'on':''}`} onClick={()=>setFilter(k)}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
            <span className="ctrl-count">{k === 'all' ? PROJECTS.length : PROJECTS.filter(p=>p.status===k).length}</span>
          </button>
        ))}
      </div>

      <section className="project-grid">
        {shown.map(p => {
          const isActive = p.id === activeProjectId;
          return (
            <div key={p.id} className={`project-card ${isActive?'active':''} ${p.status}`} style={{'--p-hue': p.color}}>
              <div className="pc-top">
                <div className="pc-marker" />
                <div className={`pc-status pc-${p.status}`}>{p.status === 'active' ? 'Active' : 'Completed'}</div>
              </div>
              <div className="pc-term">{p.term}</div>
              <h3 className="pc-name">{p.name}</h3>
              <div className="pc-program">{p.program}</div>
              <div className="pc-progress">
                <div className="pc-prog-bar"><div className="pc-prog-fill" style={{width: `${(p.week/p.totalWeeks)*100}%`}}/></div>
                <div className="pc-prog-label">Week {p.week} of {p.totalWeeks}</div>
              </div>
              <div className="pc-stats">
                <div><span className="pc-stat-num">{p.writers}</span><span className="pc-stat-lbl">writers</span></div>
                <div><span className="pc-stat-num">{p.pending}</span><span className="pc-stat-lbl">to review</span></div>
                <div><span className="pc-stat-num">{p.lastActivity}</span><span className="pc-stat-lbl">activity</span></div>
              </div>
              <div className="pc-actions">
                {isActive
                  ? <button className="btn btn-ghost" disabled><span className="dot-on"/> Currently active</button>
                  : <button className="btn btn-primary" onClick={() => { setActiveProjectId(p.id); go('cohort'); }}>Switch to this cohort</button>}
                <button className="btn btn-ghost">Settings</button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function AccountScreen({ go }) {
  const { ACCOUNT, PROJECTS } = window.SIA_DATA;
  const [tab, setTab] = React.useState('profile');
  const sub = ACCOUNT.subscription;
  const activeCohorts = PROJECTS.filter(p => p.status === 'active').length;

  return (
    <div className="screen account">
      <header className="screen-head">
        <div>
          <div className="eyebrow">My Account</div>
          <h1>{ACCOUNT.name}</h1>
          <p className="sub">{ACCOUNT.role} · Member since {ACCOUNT.joined}</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => go('cohort')}>Back to dashboard</button>
        </div>
      </header>

      <div className="acct-layout">
        <aside className="acct-tabs">
          <div className="acct-id">
            <div className="avatar xl">{ACCOUNT.initials}</div>
            <div>
              <div className="acct-id-name">{ACCOUNT.name}</div>
              <div className="acct-id-email">{ACCOUNT.email}</div>
            </div>
          </div>
          {[
            { id: 'profile',      label: 'Profile',      sub: 'Personal details' },
            { id: 'subscription', label: 'Subscription', sub: `${sub.plan}` },
            { id: 'projects',     label: 'Projects',     sub: `${activeCohorts} active cohorts` },
          ].map(t => (
            <button key={t.id} className={`acct-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              <div className="acct-tab-label">{t.label}</div>
              <div className="acct-tab-sub">{t.sub}</div>
            </button>
          ))}
        </aside>

        <main className="acct-body">
          {tab === 'profile' && (
            <div className="acct-panel">
              <div className="section-label"><span className="sec-num">•</span><span>Profile</span></div>
              <div className="form-grid">
                <div className="field"><label>Full name</label><input defaultValue={ACCOUNT.name}/></div>
                <div className="field"><label>Email</label><input defaultValue={ACCOUNT.email}/></div>
                <div className="field"><label>Title</label><input defaultValue={ACCOUNT.title}/></div>
                <div className="field"><label>Location</label><input defaultValue={ACCOUNT.location}/></div>
                <div className="field wide">
                  <label>Credentials</label>
                  <div className="cred-list">
                    {ACCOUNT.credentials.map((c,i) => <span key={i} className="cred-chip">{c}</span>)}
                    <button className="cred-add">+ add</button>
                  </div>
                </div>
                <div className="field wide"><label>Teaching bio</label><textarea rows="3" defaultValue="Writer-producer and screenwriting instructor at UCLA's School of Theater, Film and Television. I teach across the Professional Programs curriculum — from fundamentals through advanced rewriting — with a focus on character-driven narrative and visual storytelling. Before teaching I developed features and limited series at Fox and Lionsgate. I believe revision is craft, not correction."/></div>
              </div>
              <div className="form-actions">
                <button className="btn btn-ghost">Cancel</button>
                <button className="btn btn-primary">Save profile</button>
              </div>
            </div>
          )}

          {tab === 'subscription' && (
            <div className="acct-panel">
              <div className="section-label"><span className="sec-num">•</span><span>Subscription</span></div>
              <div className="plan-card">
                <div className="plan-top">
                  <div>
                    <div className="plan-eyebrow">Current plan</div>
                    <div className="plan-name">{sub.plan}</div>
                    <div className="plan-seat">{sub.seat} · renews {sub.renews}</div>
                  </div>
                  <div className="plan-price">
                    <div className="pp-num">{sub.price}</div>
                    <div className="pp-cycle">{sub.cycle}</div>
                  </div>
                </div>
                <div className="plan-usage">
                  <div className="usage">
                    <div className="usage-head"><span>Scripts analyzed</span><span>{sub.scriptsUsed} / {sub.scriptsIncluded}</span></div>
                    <div className="usage-bar"><div className="usage-fill" style={{width: `${(sub.scriptsUsed/sub.scriptsIncluded)*100}%`}}/></div>
                  </div>
                  <div className="usage">
                    <div className="usage-head"><span>Active cohorts</span><span>{sub.cohortsUsed} / {sub.cohortsIncluded}</span></div>
                    <div className="usage-bar"><div className="usage-fill" style={{width: `${(sub.cohortsUsed/sub.cohortsIncluded)*100}%`}}/></div>
                  </div>
                </div>
                <div className="plan-actions">
                  <button className="btn btn-ghost">Manage billing</button>
                  <button className="btn btn-ghost">Download invoices</button>
                  <button className="btn btn-primary">Upgrade to Studio+</button>
                </div>
              </div>
              <div className="plan-grid">
                {[
                  { name: 'Solo',    price: '$19', cta: 'Downgrade',       active: false, feats: ['1 cohort', '40 scripts / mo', 'Portfolio memory'] },
                  { name: 'Studio',  price: '$49', cta: 'Current plan',    active: true,  feats: ['3 cohorts', '120 scripts / mo', 'Revision Coach', 'Rubric pinning'] },
                  { name: 'Studio+', price: '$99', cta: 'Upgrade',         active: false, feats: ['10 cohorts', 'Unlimited scripts', 'Co-instructor seats', 'Canvas / LMS integration'] },
                ].map(p => (
                  <div key={p.name} className={`tier ${p.active?'active':''}`}>
                    <div className="tier-name">{p.name}</div>
                    <div className="tier-price">{p.price}<span>/mo</span></div>
                    <ul>{p.feats.map(f => <li key={f}>{f}</li>)}</ul>
                    <button className={`btn ${p.active?'btn-ghost':'btn-primary'}`} disabled={p.active}>{p.cta}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'projects' && (
            <div className="acct-panel">
              <div className="section-label"><span className="sec-num">•</span><span>Your projects</span></div>
              <p className="acct-lede">You have {activeCohorts} active cohorts and {PROJECTS.length - activeCohorts} archived. <button className="link-btn" onClick={()=>go('projects')}>Open the full Projects view →</button></p>
              <div className="acct-proj-list">
                {PROJECTS.map(p => (
                  <div key={p.id} className={`acct-proj-row ${p.status}`} style={{'--p-hue': p.color}}>
                    <div className="apr-marker"/>
                    <div className="apr-main">
                      <div className="apr-name">{p.name}</div>
                      <div className="apr-sub">{p.term} · {p.program}</div>
                    </div>
                    <div className="apr-stat">Week {p.week}/{p.totalWeeks}</div>
                    <div className="apr-stat">{p.writers} writers</div>
                    <div className={`apr-status ${p.status}`}>{p.status === 'active' ? 'Active' : 'Completed'}</div>
                    <button className="btn btn-ghost" onClick={()=>go('projects')}>Open</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('bfagan@tft.ucla.edu');
  const [pw, setPw] = React.useState('••••••••••');
  return (
    <div className="login-shell">
      <div className="login-aside">
        <div className="login-brand">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M16 4 Q22 10 16 16 Q10 22 16 28" stroke="currentColor" strokeWidth="1" fill="none"/>
            <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
          </svg>
          <div>
            <div className="brand-name">SIA</div>
            <div className="brand-sub">Script Intelligence</div>
          </div>
        </div>
        <blockquote className="login-quote">
          <p>"I used to spend my Sundays alone with twenty scripts. Now I spend them with the ones that actually need me."</p>
          <cite>— Brian Fagan, UCLA TFT Professional Programs</cite>
        </blockquote>
        <div className="login-foot">Confidential · v2.0 · © 2026 Ember AI</div>
      </div>
      <div className="login-main">
        <div className="login-card">
          <div className="eyebrow">Instructor sign-in</div>
          <h1>Welcome back.</h1>
          <p className="sub">Your cohort is waiting — Week 4 drafts were processed overnight.</p>

          <div className="field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="field"><label>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)}/></div>
          <label className="remember"><input type="checkbox" defaultChecked/> <span>Keep me signed in on this device</span></label>
          <button className="btn btn-primary lg full" onClick={onLogin}>Sign in</button>
          <div className="login-alt">
            <button className="link-btn">Forgot password?</button>
            <span className="link-sep">·</span>
            <button className="link-btn">SSO with institution</button>
          </div>
          <div className="login-foot-note">New to SIA? <button className="link-btn">Request an instructor seat →</button></div>
        </div>
      </div>
    </div>
  );
}

window.ProjectsScreen = ProjectsScreen;
window.AccountScreen  = AccountScreen;
window.LoginScreen    = LoginScreen;
