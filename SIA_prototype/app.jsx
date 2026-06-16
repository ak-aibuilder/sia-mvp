// Main app shell

const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [loggedIn, setLoggedIn] = useStateApp(() => {
    try { return localStorage.getItem('sia_logged_in') !== 'false'; } catch { return true; }
  });
  const [activeProjectId, setActiveProjectId] = useStateApp(() => {
    try {
      const stored = localStorage.getItem('sia_project');
      const valid = window.SIA_DATA?.PROJECTS?.some(p => p.id === stored);
      return valid ? stored : 'puddle-13';
    } catch { return 'puddle-13'; }
  });
  const [route, setRoute] = useStateApp(() => {
    try { return JSON.parse(localStorage.getItem('sia_route')) || { screen: 'cohort', id: null }; }
    catch { return { screen: 'cohort', id: null }; }
  });
  const [density, setDensity]           = useStateApp('comfortable');
  const [deltaVariant, setDeltaVariant] = useStateApp('bar');
  const [accentHue, setAccentHue]       = useStateApp(55);
  const [tweaksOpen, setTweaksOpen]     = useStateApp(false);

  const go = (screen, id = null) => {
    const r = { screen, id };
    setRoute(r);
    try { localStorage.setItem('sia_route', JSON.stringify(r)); } catch {}
    window.scrollTo({ top: 0 });
  };

  const setProject = (id) => {
    setActiveProjectId(id);
    try { localStorage.setItem('sia_project', id); } catch {}
  };

  const onLogin  = () => { setLoggedIn(true);  try { localStorage.setItem('sia_logged_in','true'); } catch {}; go('cohort'); };
  const onLogout = () => { setLoggedIn(false); try { localStorage.setItem('sia_logged_in','false'); } catch {}; };

  useEffectApp(() => {
    document.documentElement.style.setProperty('--accent-h', accentHue);
  }, [accentHue]);

  useEffectApp(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode')   setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!loggedIn) return <LoginScreen onLogin={onLogin} />;

  const activeProject = window.SIA_DATA.PROJECTS.find(p => p.id === activeProjectId) || window.SIA_DATA.PROJECTS[0];

  return (
    <div className="app">
      <NavRail current={route.screen} go={go} activeProject={activeProject} loggedIn={loggedIn} onLogin={onLogin} onLogout={onLogout}/>
      <main data-screen-label={route.screen}>
        {route.screen === 'cohort'   && <CohortScreen  go={go} density={density} deltaVariant={deltaVariant} />}
        {route.screen === 'student'  && <StudentScreen go={go} studentId={route.id || 1} />}
        {route.screen === 'upload'   && <UploadScreen  go={go} />}
        {route.screen === 'projects' && <ProjectsScreen go={go} activeProjectId={activeProjectId} setActiveProjectId={setProject}/>}
        {route.screen === 'account'  && <AccountScreen  go={go}/>}
      </main>

      {tweaksOpen && (
        <div className="tweaks-panel">
          <div className="tweaks-head">
            <h3>Tweaks</h3>
            <button onClick={() => setTweaksOpen(false)}><Icon.x/></button>
          </div>
          <div className="tweak-row">
            <div className="tweak-label">Table density</div>
            <div className="tweak-options">
              <button className={density==='comfortable'?'on':''} onClick={()=>setDensity('comfortable')}>Comfortable</button>
              <button className={density==='compact'?'on':''}     onClick={()=>setDensity('compact')}>Compact</button>
            </div>
          </div>
          <div className="tweak-row">
            <div className="tweak-label">Revision delta style</div>
            <div className="tweak-options">
              <button className={deltaVariant==='bar'?'on':''}    onClick={()=>setDeltaVariant('bar')}>Bar</button>
              <button className={deltaVariant==='arrows'?'on':''} onClick={()=>setDeltaVariant('arrows')}>Numbers</button>
              <button className={deltaVariant==='dots'?'on':''}   onClick={()=>setDeltaVariant('dots')}>Dots</button>
            </div>
          </div>
          <div className="tweak-row">
            <div className="tweak-label">Accent hue</div>
            <div className="tweak-swatches">
              {[
                { h: 55,  name: 'Ember' },
                { h: 25,  name: 'Rust' },
                { h: 155, name: 'Moss' },
                { h: 240, name: 'Slate' },
                { h: 300, name: 'Plum' },
              ].map(s => (
                <button key={s.h}
                  className={`tweak-swatch ${accentHue===s.h?'on':''}`}
                  title={s.name}
                  style={{background: `oklch(0.72 0.14 ${s.h})`}}
                  onClick={()=>setAccentHue(s.h)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
