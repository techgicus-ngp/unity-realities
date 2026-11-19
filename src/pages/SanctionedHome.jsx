import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PAIRS } from '../config/maps';
import { fetchPairMaps } from '../services/Quotationservice';
import { lock } from '../lib/sanctionedGate';
import { BODY, MONO, SANS } from '../theme/tokens';
import {
  GOLD, GOLD_DEEP, GOLD_GLOW, GOLD_LINE, INK, INK_SOFT, NAVY, NAVY_2, NAVY_3,
} from '../theme/compare';

/* Same two sides as the compare page: A is sanctioned, B is not. */
const A = { label: 'Sanctioned', color: '#7CB342' };
const B = { label: 'Not sanctioned', color: '#E0A33C' };

const THEME_VARS = {
  '--navy': NAVY,
  '--navy2': NAVY_2,
  '--navy3': NAVY_3,
  '--gold': GOLD,
  '--gold-deep': GOLD_DEEP,
  '--glow': GOLD_GLOW,
  '--line': GOLD_LINE,
  '--ink': INK,
  '--ink-soft': INK_SOFT,
  '--body': BODY,
  '--mono': MONO,
  '--sans': SANS,
};

const CSS = `
.sh, .sh * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.sh {
  min-height: 100vh; min-height: 100dvh;
  background: radial-gradient(1200px 500px at 50% -10%, var(--navy3), var(--navy) 60%) fixed;
  color: var(--ink); font-family: var(--body);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sh button { font-family: inherit; }
.sh :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

/* ---------- top bar ---------- */
.sh-bar {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; gap: 12px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 20px 10px;
  background: linear-gradient(180deg, var(--navy2), var(--navy));
  border-bottom: 1px solid var(--line);
}
.sh-back {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 12px;
  display: grid; place-items: center; text-decoration: none;
  border: 1px solid var(--line); background: var(--navy3); color: var(--ink);
  font: 500 22px/1 var(--mono); transition: background-color .15s ease;
}
.sh-back:hover { background: var(--navy2); }
.sh-bar-t { font: 700 15px/1.2 var(--body); color: var(--ink); min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sh-lock {
  margin-left: auto; flex: 0 0 auto; min-height: 40px; padding: 0 14px;
  display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--line); background: transparent; color: var(--ink);
  font: 600 13px/1 var(--body); transition: background-color .15s ease, border-color .15s ease;
}
.sh-lock:hover { background: color-mix(in srgb, var(--gold) 14%, transparent); border-color: var(--gold); }

/* ---------- page ---------- */
.sh-main { width: 100%; max-width: 1080px; margin: 0 auto; padding: 32px 20px 48px; }
.sh-intro { max-width: 60ch; margin-bottom: 24px; }
.sh-h1 { margin: 0; font: 700 clamp(24px, 4vw, 34px)/1.15 var(--sans); letter-spacing: 0.01em; color: var(--ink); }
.sh-lead { margin: 10px 0 0; font: 400 15px/1.55 var(--body); color: var(--ink-soft); }
.sh-key { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 14px; }
.sh-key span { display: inline-flex; align-items: center; gap: 7px; font: 600 13px/1 var(--body); color: var(--ink); }
.dot { flex: 0 0 auto; width: 9px; height: 9px; border-radius: 50%; background: var(--c); }

.sh-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }

/* ---------- project card ---------- */
.card {
  display: grid; gap: 16px; padding: 18px; border-radius: 16px;
  text-decoration: none; color: inherit;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--navy3), var(--navy2));
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.card:hover { border-color: var(--gold); box-shadow: var(--glow); transform: translateY(-1px); }
.card-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.card-name {
  margin: 0; font: 600 19px/1.25 var(--sans); color: var(--ink);
  overflow-wrap: anywhere;
}
.card-sides { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); align-items: stretch; }
.vs {
  justify-self: center; font: 600 12px/1 var(--body); color: var(--ink-soft);
}
.side {
  min-width: 0; display: grid; gap: 6px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
  border-left: 4px solid var(--c);
  background: color-mix(in srgb, var(--c) 7%, var(--navy));
}
.side-l { display: inline-flex; align-items: center; gap: 7px; font: 600 12.5px/1.2 var(--body); color: var(--c); }
.side-n {
  font: 500 14.5px/1.35 var(--body); color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.card-f {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding-top: 14px; border-top: 1px solid var(--line);
}
.card-cta {
  display: inline-flex; align-items: center; gap: 6px;
  font: 700 14px/1 var(--body); color: var(--gold);
}
.card-cta svg { transition: transform .15s ease; }
.card:hover .card-cta svg { transform: translateX(3px); }

/* loading placeholder for the layout names */
.sk { display: block; height: 14px; width: 62%; border-radius: 6px; background: rgba(255,255,255,.1); }
.sk-title { height: 22px; width: 48%; }

/* ---------- states ---------- */
.note {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 16px; padding: 12px 14px; border-radius: 12px;
  font: 500 14px/1.45 var(--body); color: #F0C46E;
  background: rgba(224,163,60,.1); border: 1px solid rgba(224,163,60,.35);
}
.note button {
  min-height: 36px; padding: 0 14px; border-radius: 9px; cursor: pointer;
  border: 1px solid rgba(224,163,60,.6); background: transparent; color: #F0C46E;
  font: 700 13px/1 var(--body);
}
.empty {
  max-width: 52ch; padding: 24px; border-radius: 16px; border: 1px dashed var(--line);
  background: rgba(255,255,255,.02);
}
.empty h2 { margin: 0 0 8px; font: 600 18px/1.3 var(--sans); }
.empty p { margin: 0; font: 400 14.5px/1.55 var(--body); color: var(--ink-soft); }
.empty code { font: 500 13px/1.5 var(--mono); color: var(--ink); overflow-wrap: anywhere; }

/* ---------- wider screens ---------- */
@media (min-width: 560px) {
  .card-sides { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 10px; }
}

/* ---------- phones ---------- */
@media (max-width: 559px) {
  .sh-bar { padding-left: 12px; padding-right: 12px; gap: 10px; }
  .sh-main { padding: 22px 14px 36px; }
  .card { padding: 14px; gap: 14px; }
  .card-name { font-size: 17px; }
}
@media (max-width: 379px) {
  .sh-lock-t { display: none; }
  .sh-lock { width: 40px; padding: 0; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .sh * { transition: none !important; }
  .card:hover { transform: none; }
}
`;

function Chevron() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* The layout's own name, whichever field the map document keeps it in. */
function layoutName(doc) {
  if (!doc) return '';
  const raw = doc.name || doc.title || doc.mapName || doc.layoutName || doc.projectName || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

function Side({ spec, doc, loading }) {
  const name = layoutName(doc);
  return (
    <div className="side" style={{ '--c': spec.color }}>
      <span className="side-l"><span className="dot" />{spec.label}</span>
      {loading ? (
        <span className="sk" aria-hidden="true" />
      ) : (
        <span className="side-n" title={name || undefined}>
          {name || <span style={{ color: 'var(--ink-soft)' }}>Name not set</span>}
        </span>
      )}
    </div>
  );
}

/** /sanctioned — every sanctioned / not-sanctioned pair, each opening the
    side-by-side plots page. */
export default function SanctionedHome() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState({});
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetchPairMaps()
      .then((rows) => {
        if (!alive) return;
        setDocs(Object.fromEntries(rows.map((r) => [r.id, r])));
        setState('ready');
      })
      .catch((e) => { console.error(e); if (alive) setState('error'); });
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const lockAndLeave = () => { lock(); navigate('/'); };

  const loading = state === 'loading';

  return (
    <div className="sh" style={THEME_VARS}>
      <style>{CSS}</style>

      <header className="sh-bar">
        <Link to="/" className="sh-back" aria-label="Back">‹</Link>
        <span className="sh-bar-t">Sanctioned vs not sanctioned</span>
        <button type="button" className="sh-lock" onClick={lockAndLeave} aria-label="Lock and leave">
          <LockIcon />
          <span className="sh-lock-t">Lock</span>
        </button>
      </header>

      <main className="sh-main">
        <div className="sh-intro">
          <h1 className="sh-h1">Compare project layouts</h1>
          <p className="sh-lead">
            Pick a project to open its sanctioned and not-sanctioned layouts side by side,
            find a customer’s plots in both, and prepare the allotment comparison letter.
          </p>
          <div className="sh-key" aria-label="Layout colors">
            <span style={{ '--c': A.color }}><span className="dot" />{A.label}</span>
            <span style={{ '--c': B.color }}><span className="dot" />{B.label}</span>
          </div>
        </div>

        {state === 'error' && (
          <div className="note" role="alert">
            <span>Layout names couldn’t be loaded. You can still open a comparison.</span>
            <button type="button" onClick={retry}>Try again</button>
          </div>
        )}

        {PAIRS.length === 0 ? (
          <div className="empty">
            <h2>No projects to compare yet</h2>
            <p>
              A project needs both a sanctioned and a not-sanctioned layout. Check
              {' '}<code>VITE_SANCTIONED_MAP_IDS</code> and{' '}
              <code>VITE_NOT_SANCTIONED_MAP_IDS</code>.
            </p>
          </div>
        ) : (
          <div className="sh-grid">
            {PAIRS.map((p) => (
              <Link
                key={`${p.aId}-${p.bId}`}
                to={`/sanctioned/${p.aId}/${p.bId}`}
                className="card"
              >
                <div className="card-h">
                  {loading ? (
                    <span className="sk sk-title" aria-hidden="true" />
                  ) : (
                    <h2 className="card-name">{layoutName(docs[p.aId]) || p.name}</h2>
                  )}
                </div>

                <div className="card-sides">
                  <Side spec={A} doc={docs[p.aId]} loading={loading} />
                  <span className="vs" aria-hidden="true">vs</span>
                  <Side spec={B} doc={docs[p.bId]} loading={loading} />
                </div>

                <div className="card-f">
                  <span className="card-cta">
                    Open comparison <Chevron />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}