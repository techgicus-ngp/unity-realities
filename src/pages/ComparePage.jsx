// import React, {
//   useCallback, useEffect, useMemo, useState,
// } from 'react';
// import { Navigate, useNavigate, useParams } from 'react-router-dom';

// import PlanPane from '../components/compare/PlanPane';
// import AllotmentLetter from '../components/compare/AllotmentLetter';
// import {
//   CloseIcon, DocIcon, DownloadIcon, PinIcon, SearchIcon, SwapIcon, UserIcon,
// } from '../components/compare/icons';
// import { useQuotations } from '../hooks/useQuotations';
// import { PAIRS } from '../config/maps';
// import { customerNames, scopeQuotes } from '../lib/customerPlots';
// import { autoPair, plotsOf } from '../lib/allotment';
// import { dimensionText } from '../lib/geometry';
// import { BODY, MONO, SANS } from '../theme/tokens';
// import {
//   GOLD, GOLD_DEEP, GOLD_GLOW, GOLD_LINE, INK, INK_SOFT, NAVY, NAVY_2, NAVY_3,
// } from '../theme/compare';
// import logo from '../assets/logo.jpg';

// /* A is the sanctioned (NEW) layout, B the not-sanctioned (OLD) one. */
// const A = { letter: 'A', label: 'Sanctioned', color: '#7CB342' };
// const B = { letter: 'B', label: 'Not sanctioned', color: '#E0A33C' };

// /* Below this width the two maps stack instead of sitting side by side. */
// const STACK_BP = 1200;

// const collator = new Intl.Collator(undefined, { numeric: true });

// function useViewportWidth() {
//   const [w, setW] = useState(() => window.innerWidth);
//   useEffect(() => {
//     const on = () => setW(window.innerWidth);
//     window.addEventListener('resize', on);
//     window.addEventListener('orientationchange', on);
//     return () => {
//       window.removeEventListener('resize', on);
//       window.removeEventListener('orientationchange', on);
//     };
//   }, []);
//   return w;
// }

// function useDebounced(value, ms) {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setV(value), ms);
//     return () => clearTimeout(t);
//   }, [value, ms]);
//   return v;
// }

// const chip = {
//   font: `500 12px/1 ${MONO}`, color: INK, background: 'transparent',
//   border: `1px solid ${GOLD_LINE}`, borderRadius: 999, padding: '7px 11px', cursor: 'pointer',
// };

// const rule = { width: 1, alignSelf: 'stretch', background: GOLD_LINE, flex: '0 0 auto' };

// /* One side of the bottom summary: plot number, area, dimensions. */
// function SideCard({ letter, title, plot }) {
//   const cells = plot
//     ? [
//       ['Plot No.', plot.name],
//       ['Area', `${plot.area.toFixed(2)} sq.m`],
//       ['Dimensions', (plot.doc && plot.doc.dimensions) || dimensionText(plot.sides) || '—'],
//     ]
//     : [['Plot No.', '—'], ['Area', '—'], ['Dimensions', '—']];
//   return (
//     <div style={{
//       flex: '1 1 250px', minWidth: 230, maxWidth: 380, borderRadius: 10,
//       overflow: 'hidden', border: `1px solid ${GOLD}`, boxShadow: GOLD_GLOW,
//     }}>
//       <div style={{
//         background: `linear-gradient(180deg, ${NAVY_3}, ${NAVY})`, color: INK,
//         textAlign: 'center', padding: '7px 8px', fontFamily: SANS, fontSize: 15,
//         fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap',
//         overflow: 'hidden', textOverflow: 'ellipsis',
//       }}>
//         Layout {letter} <span style={{ color: INK_SOFT, fontWeight: 400 }}>({title || '—'})</span>
//       </div>
//       <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1.3fr', background: '#F3EBD8' }}>
//         {cells.map(([k, v], i) => (
//           <div key={k} style={{
//             padding: '7px 6px', textAlign: 'center', color: '#1A1208', minWidth: 0,
//             borderLeft: i ? '1px solid rgba(26,18,8,0.14)' : 'none',
//           }}>
//             <div style={{ font: `500 11px/1.2 ${MONO}`, color: '#6B5B3A' }}>{k}</div>
//             <div style={{
//               font: `700 13px/1.3 ${MONO}`, marginTop: 3, overflow: 'hidden',
//               textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//             }}>
//               {v}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function Hits({ spec, names, onPick }) {
//   if (!names) return null;
//   const list = [...names].sort(collator.compare);
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
//       <span style={{
//         color: spec.color, fontFamily: SANS, fontSize: 12,
//         letterSpacing: '0.08em', textTransform: 'uppercase',
//       }}>
//         {spec.label}
//       </span>
//       {list.length === 0 && (
//         <span style={{ color: INK_SOFT, fontFamily: MONO, fontSize: 12 }}>no plot</span>
//       )}
//       {list.slice(0, 12).map((n) => (
//         <button key={n} type="button" style={chip} onClick={() => onPick(n)}>{n}</button>
//       ))}
//       {list.length > 12 && (
//         <span style={{ color: INK_SOFT, fontFamily: MONO, fontSize: 12 }}>+{list.length - 12}</span>
//       )}
//     </div>
//   );
// }

// function CompareView({ aId, bId }) {
//   const navigate = useNavigate();
//   const vw = useViewportWidth();
//   const stacked = vw < STACK_BP;

//   const { quotes, error: quotesError } = useQuotations(true);

//   const [view, setView] = useState('both');            // 'both' | 'a' | 'b'
//   const [input, setInput] = useState('');
//   const query = useDebounced(input, 250);

//   const [selA, setSelA] = useState(null);
//   const [selB, setSelB] = useState(null);
//   const [matchA, setMatchA] = useState(null);
//   const [matchB, setMatchB] = useState(null);
//   const [dataA, setDataA] = useState(null);
//   const [dataB, setDataB] = useState(null);
//   const [letter, setLetter] = useState(null);          // null | { auto }
//   const [pickedCustomer, setPickedCustomer] = useState('');
//   const [pairIdx, setPairIdx] = useState(0);

//   const showA = view !== 'b';
//   const showB = view !== 'a';
//   const both = showA && showB;

//   /* Quotations name a project, not a map: keep each layout's own. */
//   const titleA = dataA ? dataA.title : '';
//   const titleB = dataB ? dataB.title : '';
//   const quotesA = useMemo(() => scopeQuotes(quotes, titleA, titleB), [quotes, titleA, titleB]);
//   const quotesB = useMemo(() => scopeQuotes(quotes, titleB, titleA), [quotes, titleA, titleB]);

//   const customers = useMemo(() => customerNames([
//     { layout: dataA && dataA.layout, quotes: quotesA },
//     { layout: dataB && dataB.layout, quotes: quotesB },
//   ], query), [dataA, dataB, quotesA, quotesB, query]);

//   const customer = customers.includes(pickedCustomer) ? pickedCustomer : (customers[0] || '');

//   /* the bottom summary follows the same pairing the letter starts from */
//   const pairs = useMemo(() => autoPair(
//     plotsOf(dataB && dataB.layout, quotesB, customer),
//     plotsOf(dataA && dataA.layout, quotesA, customer),
//   ), [dataA, dataB, quotesA, quotesB, customer]);
//   const pair = pairs[Math.min(pairIdx, Math.max(0, pairs.length - 1))] || null;
//   const plotB = pair && pair.o && dataB && dataB.layout ? dataB.layout.byName.get(pair.o) : null;
//   const plotA = pair && pair.n && dataA && dataA.layout ? dataA.layout.byName.get(pair.n) : null;

//   useEffect(() => { setPairIdx(0); }, [customer]);

//   const pickFromChip = useCallback((key, name) => {
//     if (view !== 'both' && view !== key) setView(key);
//     (key === 'a' ? setSelA : setSelB)(name);
//   }, [view]);

//   const seg = (v, label) => (
//     <button
//       key={v}
//       type="button"
//       onClick={() => setView(v)}
//       aria-pressed={view === v}
//       style={{
//         ...chip,
//         color: view === v ? '#1A1208' : INK,
//         background: view === v ? GOLD : 'transparent',
//         borderColor: view === v ? GOLD : GOLD_LINE,
//       }}
//     >
//       {label}
//     </button>
//   );

//   const searched = query.trim().length > 0;
//   const nothingFound = searched && matchA && matchB && matchA.size === 0 && matchB.size === 0;
//   const canLetter = customers.length > 0;

//   const needsRow2 = searched || stacked || PAIRS.length > 1;

//   return (
//     <div style={{
//       width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column',
//       background: `radial-gradient(1200px 500px at 50% -10%, ${NAVY_3}, ${NAVY} 60%)`,
//       color: INK, fontFamily: BODY, overflow: 'hidden',
//     }}>
//       <style>{`
//         * { -webkit-tap-highlight-color: transparent; }
//         .cmp-search::placeholder { color: #8A8478; }
//         .cmp-search::-webkit-search-cancel-button { display: none; }
//         *:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }
//         .gm-style img { max-width: none; }
//       `}</style>

//       <header style={{
//         flex: '0 0 auto', padding: '10px 14px', display: 'grid', gap: 8,
//         background: `linear-gradient(180deg, ${NAVY_2}, ${NAVY})`,
//         borderBottom: `1px solid ${GOLD_LINE}`,
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
//           <button
//             type="button"
//             onClick={() => navigate('/sanctioned')}
//             aria-label="Back"
//             style={{
//               width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
//               border: `1px solid ${GOLD_LINE}`, background: NAVY_3, color: INK,
//               font: `500 22px/1 ${MONO}`,
//             }}
//           >
//             ‹
//           </button>

//           <img
//             src={logo}
//             alt="Logo"
//             style={{ height: 46, borderRadius: 10, background: '#fff', padding: 3, display: 'block' }}
//           />

//           <span style={{ ...rule, minHeight: 36 }} />

//           <label style={{
//             flex: '1 1 260px', minWidth: 220, maxWidth: 560, height: 46,
//             display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
//             borderRadius: 999, background: '#F4F1EA', color: '#1A1208',
//             boxShadow: GOLD_GLOW,
//           }}>
//             <SearchIcon style={{ flex: '0 0 auto' }} />
//             <input
//               className="cmp-search"
//               type="search"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Search customer name…"
//               aria-label="Search customer name"
//               style={{
//                 flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
//                 font: `600 16px/1 ${BODY}`, color: '#1A1208',
//               }}
//             />
//             {input && (
//               <button
//                 type="button"
//                 onClick={() => setInput('')}
//                 aria-label="Clear search"
//                 style={{
//                   border: 'none', background: 'none', cursor: 'pointer', color: '#1A1208',
//                   display: 'grid', placeItems: 'center', padding: 2,
//                 }}
//               >
//                 <CloseIcon />
//               </button>
//             )}
//           </label>

//           <span style={{ ...rule, minHeight: 36 }} />

//           <div style={{
//             display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 6px 12px',
//             borderRadius: 14, border: `1px solid ${GOLD_LINE}`, background: NAVY_2,
//             opacity: canLetter ? 1 : 0.5,
//           }}>
//             <DocIcon style={{ color: GOLD, flex: '0 0 auto' }} />
//             <div style={{ lineHeight: 1.25, minWidth: 0 }}>
//               <div style={{ font: `700 14px/1.2 ${BODY}`, color: INK }}>Allotment Comparison Letter</div>
//               <div style={{ font: `400 12px/1.2 ${BODY}`, color: INK_SOFT }}>Layout A vs Layout B</div>
//             </div>
//             <button
//               type="button"
//               disabled={!canLetter}
//               title={canLetter ? 'Open the letter and print or save as PDF' : 'Search a customer first'}
//               onClick={() => setLetter({ auto: true })}
//               style={{
//                 display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px',
//                 borderRadius: 10, border: 'none', cursor: canLetter ? 'pointer' : 'default',
//                 background: `linear-gradient(180deg, ${GOLD}, ${GOLD_DEEP})`, color: '#1A1208',
//                 font: `700 13px/1 ${BODY}`, whiteSpace: 'nowrap',
//               }}
//             >
//               <DownloadIcon width={17} height={17} /> Download PDF
//             </button>
//           </div>
//         </div>

//         {needsRow2 && (
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
//             {PAIRS.length > 1 && (
//               <select
//                 value={PAIRS.find((p) => p.aId === aId && p.bId === bId)?.name || ''}
//                 onChange={(e) => {
//                   const p = PAIRS.find((x) => x.name === e.target.value);
//                   if (p) navigate(`/sanctioned/${p.aId}/${p.bId}`);
//                 }}
//                 aria-label="Switch project"
//                 style={{
//                   font: `500 12px/1 ${MONO}`, color: INK, background: NAVY_3,
//                   border: `1px solid ${GOLD_LINE}`, borderRadius: 999, padding: '8px 11px',
//                 }}
//               >
//                 <option value="" disabled>Switch project…</option>
//                 {PAIRS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
//               </select>
//             )}

//             {searched && (
//               <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
//                 {showA && <Hits spec={A} names={matchA} onPick={(n) => pickFromChip('a', n)} />}
//                 {showB && <Hits spec={B} names={matchB} onPick={(n) => pickFromChip('b', n)} />}
//               </div>
//             )}

//             {stacked && (
//               <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
//                 {seg('both', 'Both')}
//                 {seg('a', 'A')}
//                 {seg('b', 'B')}
//               </div>
//             )}
//           </div>
//         )}

//         {nothingFound && (
//           <div style={{ color: '#E0A33C', fontFamily: MONO, fontSize: 12 }}>
//             No plot found for this name in either layout. Plots are matched on the
//             owner name saved on the plot and on the customer name of saved quotations.
//           </div>
//         )}
//         {quotesError && (
//           <div style={{ color: '#E0A33C', fontFamily: MONO, fontSize: 12 }}>
//             Quotations could not be read ({quotesError}). Search will use plot owner
//             names only, and the letter will have no prices.
//           </div>
//         )}
//       </header>

//       <main style={{
//         flex: 1, minHeight: 0, display: 'grid', gap: 12, padding: 12,
//         gridTemplateColumns: both && !stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
//         gridTemplateRows: both && stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
//       }}>
//         {showA && (
//           <PlanPane
//             key={aId}
//             mapId={aId}
//             spec={A}
//             query={query}
//             quotes={quotesA}
//             selected={selA}
//             onSelect={setSelA}
//             onMatches={setMatchA}
//             onData={setDataA}
//           />
//         )}
//         {showB && (
//           <PlanPane
//             key={bId}
//             mapId={bId}
//             spec={B}
//             query={query}
//             quotes={quotesB}
//             selected={selB}
//             onSelect={setSelB}
//             onMatches={setMatchB}
//             onData={setDataB}
//           />
//         )}
//       </main>

//       {canLetter && (
//         <footer style={{
//           flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
//           margin: '0 12px 12px', padding: '10px 14px', borderRadius: 14,
//           background: `linear-gradient(180deg, ${NAVY_3}, ${NAVY_2})`,
//           border: `1px solid ${GOLD_LINE}`, boxShadow: '0 -6px 24px rgba(0,0,0,0.3)',
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
//             <UserIcon width={30} height={30} style={{ color: GOLD, flex: '0 0 auto' }} />
//             <div style={{ minWidth: 0 }}>
//               <div style={{ font: `400 12px/1.2 ${BODY}`, color: INK_SOFT }}>Customer</div>
//               {customers.length > 1 ? (
//                 <select
//                   value={customer}
//                   onChange={(e) => setPickedCustomer(e.target.value)}
//                   aria-label="Customer"
//                   style={{
//                     font: `700 16px/1.2 ${BODY}`, color: INK, background: 'transparent',
//                     border: 'none', outline: 'none', maxWidth: 220,
//                   }}
//                 >
//                   {customers.map((c) => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
//                 </select>
//               ) : (
//                 <div style={{
//                   font: `700 17px/1.2 ${BODY}`, color: INK, overflow: 'hidden',
//                   textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
//                 }}>
//                   {customer}
//                 </div>
//               )}
//             </div>
//           </div>

//           <span style={{ ...rule, minHeight: 44 }} />

//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <PinIcon width={28} height={28} style={{ color: GOLD, flex: '0 0 auto' }} />
//             <div style={{ font: `700 16px/1.2 ${SANS}`, letterSpacing: '0.04em', color: INK }}>
//               Allotment<br />Comparison
//               {pairs.length > 1 && (
//                 <select
//                   value={Math.min(pairIdx, pairs.length - 1)}
//                   onChange={(e) => setPairIdx(Number(e.target.value))}
//                   aria-label="Plot pair"
//                   style={{
//                     display: 'block', marginTop: 4, font: `500 11px/1 ${MONO}`, color: INK,
//                     background: NAVY, border: `1px solid ${GOLD_LINE}`, borderRadius: 6, padding: '3px 4px',
//                   }}
//                 >
//                   {pairs.map((p, i) => (
//                     <option key={i} value={i}>{`${p.o || '—'} → ${p.n || '—'}`}</option>
//                   ))}
//                 </select>
//               )}
//             </div>
//           </div>

//           <div style={{
//             flex: '1 1 560px', display: 'flex', alignItems: 'center', justifyContent: 'center',
//             gap: 12, flexWrap: 'wrap', minWidth: 0,
//           }}>
//             <SideCard letter="A" title={titleA} plot={plotA} />
//             <SwapIcon width={28} height={28} style={{ color: GOLD, flex: '0 0 auto' }} />
//             <SideCard letter="B" title={titleB} plot={plotB} />
//           </div>

//           <span style={{ ...rule, minHeight: 44 }} />

//           <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//             <button
//               type="button"
//               onClick={() => setLetter({ auto: false })}
//               style={{
//                 display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px',
//                 borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
//                 background: `linear-gradient(180deg, ${GOLD}, ${GOLD_DEEP})`, color: '#1A1208',
//               }}
//             >
//               <DocIcon style={{ flex: '0 0 auto' }} />
//               <span style={{ lineHeight: 1.2 }}>
//                 <span style={{ display: 'block', font: `700 14px/1.2 ${BODY}` }}>Allotment Comparison Letter</span>
//                 <span style={{ display: 'block', font: `500 12px/1.2 ${BODY}` }}>(Layout A vs Layout B)</span>
//               </span>
//             </button>
//             <button
//               type="button"
//               onClick={() => setLetter({ auto: true })}
//               style={{
//                 display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
//                 borderRadius: 12, cursor: 'pointer', background: 'transparent',
//                 border: `1px solid ${GOLD}`, color: INK, font: `700 14px/1 ${BODY}`,
//               }}
//             >
//               <DownloadIcon width={18} height={18} style={{ color: GOLD }} /> Download PDF
//             </button>
//           </div>
//         </footer>
//       )}

//       {letter && canLetter && (
//         <AllotmentLetter
//           customers={customers}
//           initialCustomer={customer}
//           autoPrint={letter.auto}
//           oldSide={{ layout: dataB && dataB.layout, quotes: quotesB }}
//           newSide={{ layout: dataA && dataA.layout, quotes: quotesA }}
//           onClose={() => setLetter(null)}
//         />
//       )}
//     </div>
//   );
// }

// /* Keyed by the pair, so switching project starts from a clean page: no
//    stale search, selection or half-loaded layout from the previous one. */
// export default function ComparePage() {
//   const { aId, bId } = useParams();
//   /* Only configured pairs: the route cannot be pointed at any two maps. */
//   if (!PAIRS.some((p) => p.aId === aId && p.bId === bId)) {
//     return <Navigate to="/sanctioned" replace />;
//   }
//   return <CompareView key={`${aId}/${bId}`} aId={aId} bId={bId} />;
// }







// import React, {
//   useCallback, useEffect, useMemo, useState,
// } from 'react';
// import { Navigate, useNavigate, useParams } from 'react-router-dom';

// import PlanPane from '../components/compare/PlanPane';
// import AllotmentLetter from '../components/compare/AllotmentLetter';
// import {
//   CloseIcon, DocIcon, DownloadIcon, PinIcon, SearchIcon, SwapIcon, UserIcon,
// } from '../components/compare/icons';
// import { useQuotations } from '../hooks/useQuotations';
// import { PAIRS } from '../config/maps';
// import { customerNames, scopeQuotes } from '../lib/customerPlots';
// import { autoPair, plotsOf } from '../lib/allotment';
// import { dimensionText } from '../lib/geometry';
// import { BODY, MONO, SANS } from '../theme/tokens';
// import {
//   GOLD, GOLD_DEEP, GOLD_GLOW, GOLD_LINE, INK, INK_SOFT, NAVY, NAVY_2, NAVY_3,
// } from '../theme/compare';
// import logo from '../assets/logo.jpg';

// /* A is the sanctioned (NEW) layout, B the not-sanctioned (OLD) one. */
// const A = { letter: 'A', label: 'Sanctioned', color: '#7CB342' };
// const B = { letter: 'B', label: 'Not sanctioned', color: '#E0A33C' };

// /* Below this width the two maps stack instead of sitting side by side. */
// const STACK_BP = 1200;
// /* Below this width the page uses its phone layout. */
// const PHONE_BP = 720;

// const collator = new Intl.Collator(undefined, { numeric: true });

// /* Theme tokens are exposed as CSS variables so the stylesheet below can use
//    media queries, hover and focus states, which inline styles cannot. */
// const THEME_VARS = {
//   '--navy': NAVY,
//   '--navy2': NAVY_2,
//   '--navy3': NAVY_3,
//   '--gold': GOLD,
//   '--gold-deep': GOLD_DEEP,
//   '--glow': GOLD_GLOW,
//   '--line': GOLD_LINE,
//   '--ink': INK,
//   '--ink-soft': INK_SOFT,
//   '--body': BODY,
//   '--mono': MONO,
//   '--sans': SANS,
//   '--a': A.color,
//   '--b': B.color,
// };

// const CSS = `
// .cp, .cp * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
// .cp {
//   width: 100%; height: 100vh; height: 100dvh;
//   display: flex; flex-direction: column; overflow: hidden;
//   background: radial-gradient(1200px 500px at 50% -10%, var(--navy3), var(--navy) 60%);
//   color: var(--ink); font-family: var(--body);
//   padding-left: env(safe-area-inset-left, 0px);
//   padding-right: env(safe-area-inset-right, 0px);
// }
// .cp button, .cp select, .cp input { font-family: inherit; }
// .cp :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
// .cp select option { color: #1A1208; background: #fff; }
// .cp .gm-style img { max-width: none; }

// /* ---------- shared controls ---------- */
// .cp .btn {
//   display: inline-flex; align-items: center; justify-content: center; gap: 8px;
//   min-height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer;
//   font: 700 13px/1 var(--body); white-space: nowrap; border: 1px solid transparent;
//   transition: filter .15s ease, background-color .15s ease;
// }
// .cp .btn:disabled { opacity: .45; cursor: not-allowed; }
// .cp .btn-gold {
//   background: linear-gradient(180deg, var(--gold), var(--gold-deep)); color: #1A1208;
// }
// .cp .btn-gold:not(:disabled):hover { filter: brightness(1.08); }
// .cp .btn-ghost { background: transparent; border-color: var(--gold); color: var(--ink); }
// .cp .btn-ghost:hover { background: color-mix(in srgb, var(--gold) 14%, transparent); }
// .cp .iconbtn {
//   flex: 0 0 auto; width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
//   display: grid; place-items: center; padding: 0;
//   border: 1px solid var(--line); background: var(--navy3); color: var(--ink);
//   transition: background-color .15s ease;
// }
// .cp .iconbtn:hover { background: var(--navy2); }
// .cp .sel {
//   min-height: 34px; max-width: 100%; padding: 0 28px 0 12px; border-radius: 10px;
//   border: 1px solid var(--line); background-color: var(--navy3); color: var(--ink);
//   font: 600 13px/1 var(--body); cursor: pointer; text-overflow: ellipsis;
// }
// .cp .lbl { font: 500 12px/1.2 var(--body); color: var(--ink-soft); }

// /* ---------- header ---------- */
// .cp-hdr {
//   flex: 0 0 auto; display: grid; gap: 10px;
//   padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px;
//   background: linear-gradient(180deg, var(--navy2), var(--navy));
//   border-bottom: 1px solid var(--line);
// }
// .cp-bar {
//   display: grid; align-items: center; gap: 10px 12px;
//   grid-template-columns: minmax(0, 1fr) auto;
//   grid-template-areas: "nav act" "search search";
// }
// .cp-nav { grid-area: nav; display: flex; align-items: center; gap: 10px; min-width: 0; }
// .cp-act { grid-area: act; }
// .cp-logo {
//   flex: 0 0 auto; height: 40px; width: auto; display: block;
//   border-radius: 10px; background: #fff; padding: 3px;
// }
// .cp-title { display: grid; gap: 3px; min-width: 0; }
// .cp-name {
//   font: 700 15px/1.2 var(--body); color: var(--ink);
//   overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
// }
// .cp-sub { font: 400 12px/1.2 var(--body); color: var(--ink-soft); }
// .cp .sel-title { min-height: 30px; padding-left: 0; border: none; background-color: transparent; font-weight: 700; font-size: 15px; }
// .cp-searchbox {
//   grid-area: search; width: 100%; height: 44px; display: flex; align-items: center; gap: 10px;
//   padding: 0 8px 0 14px; border-radius: 999px; background: #F4F1EA; color: #1A1208;
//   box-shadow: var(--glow);
// }
// .cp-searchbox input {
//   flex: 1; min-width: 0; border: none; outline: none; background: transparent;
//   font: 600 16px/1 var(--body); color: #1A1208;
// }
// .cp-searchbox input::placeholder { color: #8A8478; font-weight: 500; }
// .cp-searchbox input::-webkit-search-cancel-button { display: none; }
// .cp-searchbox:focus-within { outline: 2px solid var(--gold); outline-offset: 2px; }
// .cp-searchbox .clear {
//   flex: 0 0 auto; width: 32px; height: 32px; border: none; border-radius: 50%;
//   background: transparent; color: #1A1208; cursor: pointer; display: grid; place-items: center;
// }
// .cp-searchbox .clear:hover { background: rgba(26,18,8,.08); }

// .cp-tools {
//   display: flex; align-items: center; justify-content: space-between;
//   gap: 8px 14px; flex-wrap: wrap;
// }
// .cp-hint { font: 400 13px/1.3 var(--body); color: var(--ink-soft); }
// .cp-hits { display: flex; flex-wrap: wrap; gap: 8px 16px; max-height: 88px; overflow: auto; min-width: 0; }
// .hits { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
// .hits-l { display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1 var(--body); color: var(--ink); }
// .dot { flex: 0 0 auto; width: 9px; height: 9px; border-radius: 50%; background: var(--dot); }
// .hits-none, .hits-more { font: 500 12px/1 var(--body); color: var(--ink-soft); }
// .chip {
//   min-height: 32px; padding: 0 12px; border-radius: 999px; cursor: pointer;
//   border: 1px solid var(--line); background: transparent; color: var(--ink);
//   font: 600 12.5px/1 var(--body); font-variant-numeric: tabular-nums;
//   transition: background-color .15s ease, border-color .15s ease;
// }
// .chip:hover { background: color-mix(in srgb, var(--gold) 14%, transparent); border-color: var(--gold); }

// .seg {
//   display: inline-flex; gap: 2px; padding: 3px; margin-left: auto;
//   border: 1px solid var(--line); border-radius: 999px; background: var(--navy2);
// }
// .seg button {
//   min-height: 34px; padding: 0 14px; border: none; border-radius: 999px; cursor: pointer;
//   display: inline-flex; align-items: center; gap: 7px;
//   background: transparent; color: var(--ink); font: 600 13px/1 var(--body);
//   transition: background-color .15s ease;
// }
// .seg button[aria-pressed="true"] { background: var(--gold); color: #1A1208; }
// .seg button:not([aria-pressed="true"]):hover { background: color-mix(in srgb, var(--gold) 14%, transparent); }

// .note {
//   padding: 8px 12px; border-radius: 10px; font: 500 12.5px/1.45 var(--body);
//   color: #F0C46E; background: rgba(224,163,60,.1); border: 1px solid rgba(224,163,60,.35);
// }

// /* ---------- maps ---------- */
// .cp-main { flex: 1; min-height: 0; display: grid; gap: 12px; padding: 12px; }

// /* ---------- summary footer ---------- */
// .cp-sum {
//   flex: 0 0 auto; display: grid; align-items: center; gap: 12px 18px;
//   margin: 0 12px calc(12px + env(safe-area-inset-bottom, 0px)); padding: 12px 14px;
//   border-radius: 14px; border: 1px solid var(--line);
//   background: linear-gradient(180deg, var(--navy3), var(--navy2));
//   box-shadow: 0 -6px 24px rgba(0,0,0,.3);
//   grid-template-columns: auto minmax(0, 1fr) auto;
//   grid-template-areas: "who cards acts";
// }
// .cp-who { grid-area: who; display: flex; align-items: center; gap: 12px 20px; flex-wrap: wrap; min-width: 0; }
// .cp-grp { display: flex; align-items: center; gap: 10px; min-width: 0; }
// .cp-grp-t { display: grid; gap: 3px; min-width: 0; }
// .cp-cust {
//   font: 700 16px/1.2 var(--body); color: var(--ink); max-width: 220px;
//   overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
// }
// .cp .sel-strong { min-height: 30px; padding-left: 0; border: none; background-color: transparent; font-size: 16px; font-weight: 700; max-width: 220px; }
// .cp-toggle { grid-area: toggle; display: none; }
// .cp-cards { grid-area: cards; display: flex; align-items: center; justify-content: center; gap: 12px; min-width: 0; }
// .cp-cards .swap { flex: 0 0 auto; display: grid; place-items: center; color: var(--gold); }
// .cp-acts { grid-area: acts; display: flex; gap: 10px; }

// .side {
//   flex: 1 1 0; min-width: 0; max-width: 460px; display: flex; overflow: hidden;
//   border-radius: 12px; border: 1px solid var(--line); border-left: 4px solid var(--side);
//   background: var(--navy);
// }
// .side-h { flex: 0 0 auto; width: 118px; display: flex; align-items: center; gap: 9px; padding: 8px 10px; }
// .side-badge {
//   flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
//   background: var(--side); color: #1A1208; font: 800 13px/1 var(--body);
// }
// .side-hl { display: grid; gap: 2px; min-width: 0; }
// .side-t { font: 700 13px/1.15 var(--body); color: var(--ink); white-space: nowrap; }
// .side-s {
//   font: 400 11.5px/1.2 var(--body); color: var(--ink-soft);
//   overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
// }
// .side-b {
//   flex: 1; min-width: 0; margin: 0; display: grid; grid-template-columns: 0.8fr 1fr 1.3fr;
//   background: #F3EBD8; color: #1A1208;
// }
// .side-c { min-width: 0; padding: 8px 6px; text-align: center; display: grid; align-content: center; gap: 3px; }
// .side-c + .side-c { border-left: 1px solid rgba(26,18,8,.14); }
// .side-c dt { font: 500 11px/1.2 var(--body); color: #6B5B3A; }
// .side-c dd {
//   margin: 0; font: 700 13px/1.25 var(--mono); font-variant-numeric: tabular-nums;
//   overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
// }

// /* ---------- desktop ---------- */
// @media (min-width: 900px) {
//   .cp-bar {
//     grid-template-columns: minmax(250px, auto) minmax(0, 1fr) auto;
//     grid-template-areas: "nav search act";
//   }
//   .cp-searchbox { max-width: 560px; justify-self: center; }
// }

// /* ---------- tablet and below: summary wraps to two rows ---------- */
// @media (max-width: 1099px) {
//   .cp-sum {
//     grid-template-columns: minmax(0, 1fr) auto;
//     grid-template-areas: "who acts" "cards cards";
//   }
//   .cp-cards { justify-content: stretch; }
//   .side { max-width: none; }
// }

// /* ---------- phone ---------- */
// @media (max-width: 719px) {
//   .cp-hdr { padding: calc(8px + env(safe-area-inset-top, 0px)) 10px 8px; gap: 8px; }
//   .cp-sub { display: none; }
//   .cp-main { gap: 8px; padding: 8px; }
//   .cp-sum {
//     margin: 0 8px calc(8px + env(safe-area-inset-bottom, 0px)); padding: 8px 10px; gap: 10px;
//     grid-template-columns: minmax(0, 1fr) auto;
//     grid-template-areas: "who toggle" "cards cards" "acts acts";
//     max-height: 58vh; max-height: 58dvh; overflow: auto;
//   }
//   .cp-toggle { display: grid; }
//   .cp-sum[data-open="false"] .cp-cards,
//   .cp-sum[data-open="false"] .cp-acts { display: none; }
//   .cp-cards { flex-direction: column; align-items: stretch; gap: 6px; }
//   .cp-cards .swap { transform: rotate(90deg); }
//   .cp-cards .side { flex: none; }
//   .cp-acts .btn { flex: 1; }
//   .cp-hits { max-height: 72px; }
// }
// @media (max-width: 479px) {
//   .cp-act .btn { width: 40px; padding: 0; }
//   .cp-act .btn-t { display: none; }
//   .side-h { width: 104px; padding: 8px; }
//   .seg button { padding: 0 11px; }
// }

// @media (prefers-reduced-motion: reduce) {
//   .cp * { transition: none !important; }
// }
// `;

// function useViewportWidth() {
//   const [w, setW] = useState(() => window.innerWidth);
//   useEffect(() => {
//     const on = () => setW(window.innerWidth);
//     window.addEventListener('resize', on);
//     window.addEventListener('orientationchange', on);
//     return () => {
//       window.removeEventListener('resize', on);
//       window.removeEventListener('orientationchange', on);
//     };
//   }, []);
//   return w;
// }

// function useDebounced(value, ms) {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setV(value), ms);
//     return () => clearTimeout(t);
//   }, [value, ms]);
//   return v;
// }

// /* One side of the bottom summary: plot number, area, dimensions. */
// function SideCard({ spec, title, plot }) {
//   const area = plot && Number.isFinite(plot.area) ? `${plot.area.toFixed(2)} sq.m` : '—';
//   const cells = plot
//     ? [
//       ['Plot No.', plot.name],
//       ['Area', area],
//       ['Dimensions', (plot.doc && plot.doc.dimensions) || dimensionText(plot.sides) || '—'],
//     ]
//     : [['Plot No.', '—'], ['Area', '—'], ['Dimensions', '—']];
//   return (
//     <div className="side" style={{ '--side': spec.color }}>
//       <div className="side-h">
//         <span className="side-badge" aria-hidden="true">{spec.letter}</span>
//         <span className="side-hl">
//           <span className="side-t">Layout {spec.letter}</span>
//           <span className="side-s" title={title || spec.label}>{title || spec.label}</span>
//         </span>
//       </div>
//       <dl className="side-b">
//         {cells.map(([k, v]) => (
//           <div key={k} className="side-c">
//             <dt>{k}</dt>
//             <dd title={String(v)}>{v}</dd>
//           </div>
//         ))}
//       </dl>
//     </div>
//   );
// }

// function Hits({ spec, names, onPick }) {
//   if (!names) return null;
//   const list = [...names].sort(collator.compare);
//   return (
//     <div className="hits">
//       <span className="hits-l" style={{ '--dot': spec.color }}>
//         <span className="dot" />
//         {spec.label}
//       </span>
//       {list.length === 0 && <span className="hits-none">no plot</span>}
//       {list.slice(0, 12).map((n) => (
//         <button key={n} type="button" className="chip" onClick={() => onPick(n)}>{n}</button>
//       ))}
//       {list.length > 12 && <span className="hits-more">+{list.length - 12} more</span>}
//     </div>
//   );
// }

// function Chevron({ up }) {
//   return (
//     <svg
//       width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
//       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
//       style={{ transform: up ? 'rotate(180deg)' : 'none' }}
//     >
//       <path d="M6 9l6 6 6-6" />
//     </svg>
//   );
// }

// function CompareView({ aId, bId }) {
//   const navigate = useNavigate();
//   const vw = useViewportWidth();
//   const stacked = vw < STACK_BP;
//   const wide = vw >= PHONE_BP;

//   const { quotes, error: quotesError } = useQuotations(true);

//   const [view, setView] = useState('both');            // 'both' | 'a' | 'b'
//   const [input, setInput] = useState('');
//   const query = useDebounced(input, 250);

//   const [selA, setSelA] = useState(null);
//   const [selB, setSelB] = useState(null);
//   const [matchA, setMatchA] = useState(null);
//   const [matchB, setMatchB] = useState(null);
//   const [dataA, setDataA] = useState(null);
//   const [dataB, setDataB] = useState(null);
//   const [letter, setLetter] = useState(null);          // null | { auto }
//   const [pickedCustomer, setPickedCustomer] = useState('');
//   const [pairIdx, setPairIdx] = useState(0);
//   /* On phones the plot summary starts folded so the maps keep the screen. */
//   const [sumOpen, setSumOpen] = useState(() => window.innerWidth >= PHONE_BP);

//   const showA = view !== 'b';
//   const showB = view !== 'a';
//   const both = showA && showB;

//   /* Quotations name a project, not a map: keep each layout's own. */
//   const titleA = dataA ? dataA.title : '';
//   const titleB = dataB ? dataB.title : '';
//   const quotesA = useMemo(() => scopeQuotes(quotes, titleA, titleB), [quotes, titleA, titleB]);
//   const quotesB = useMemo(() => scopeQuotes(quotes, titleB, titleA), [quotes, titleA, titleB]);

//   const customers = useMemo(() => customerNames([
//     { layout: dataA && dataA.layout, quotes: quotesA },
//     { layout: dataB && dataB.layout, quotes: quotesB },
//   ], query), [dataA, dataB, quotesA, quotesB, query]);

//   const customer = customers.includes(pickedCustomer) ? pickedCustomer : (customers[0] || '');

//   /* the bottom summary follows the same pairing the letter starts from */
//   const pairs = useMemo(() => autoPair(
//     plotsOf(dataB && dataB.layout, quotesB, customer),
//     plotsOf(dataA && dataA.layout, quotesA, customer),
//   ), [dataA, dataB, quotesA, quotesB, customer]);
//   const pair = pairs[Math.min(pairIdx, Math.max(0, pairs.length - 1))] || null;
//   const plotB = pair && pair.o && dataB && dataB.layout ? dataB.layout.byName.get(pair.o) : null;
//   const plotA = pair && pair.n && dataA && dataA.layout ? dataA.layout.byName.get(pair.n) : null;

//   useEffect(() => { setPairIdx(0); }, [customer]);

//   const pickFromChip = useCallback((key, name) => {
//     if (view !== 'both' && view !== key) setView(key);
//     (key === 'a' ? setSelA : setSelB)(name);
//   }, [view]);

//   const searched = query.trim().length > 0;
//   const nothingFound = searched && matchA && matchB && matchA.size === 0 && matchB.size === 0;
//   const canLetter = customers.length > 0;
//   const showHint = !searched && wide;

//   const currentPair = PAIRS.find((p) => p.aId === aId && p.bId === bId);

//   const seg = (v, label, color) => (
//     <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}>
//       {color && <span className="dot" style={{ '--dot': color }} />}
//       {label}
//     </button>
//   );

//   return (
//     <div className="cp" style={THEME_VARS}>
//       <style>{CSS}</style>

//       <header className="cp-hdr">
//         <div className="cp-bar">
//           <div className="cp-nav">
//             <button
//               type="button"
//               className="iconbtn"
//               onClick={() => navigate('/sanctioned')}
//               aria-label="Back to projects"
//               style={{ font: `500 22px/1 ${MONO}` }}
//             >
//               ‹
//             </button>
//             <img className="cp-logo" src={logo} alt="Logo" />
//             <div className="cp-title">
//               {PAIRS.length > 1 ? (
//                 <select
//                   className="sel sel-title"
//                   value={currentPair ? currentPair.name : ''}
//                   onChange={(e) => {
//                     const p = PAIRS.find((x) => x.name === e.target.value);
//                     if (p) navigate(`/sanctioned/${p.aId}/${p.bId}`);
//                   }}
//                   aria-label="Switch project"
//                 >
//                   <option value="" disabled>Switch project…</option>
//                   {PAIRS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
//                 </select>
//               ) : (
//                 <span className="cp-name">{currentPair ? currentPair.name : 'Layout comparison'}</span>
//               )}
//               <span className="cp-sub">Sanctioned vs not sanctioned</span>
//             </div>
//           </div>

//           <label className="cp-searchbox">
//             <SearchIcon style={{ flex: '0 0 auto' }} />
//             <input
//               type="search"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Search customer name…"
//               aria-label="Search customer name"
//               autoComplete="off"
//               enterKeyHint="search"
//             />
//             {input && (
//               <button type="button" className="clear" onClick={() => setInput('')} aria-label="Clear search">
//                 <CloseIcon />
//               </button>
//             )}
//           </label>

//           <div className="cp-act">
//             <button
//               type="button"
//               className="btn btn-gold"
//               disabled={!canLetter}
//               aria-label="Download allotment comparison letter as PDF"
//               title={canLetter ? 'Open the letter and print or save as PDF' : 'Search a customer first'}
//               onClick={() => setLetter({ auto: true })}
//             >
//               <DownloadIcon width={17} height={17} />
//               <span className="btn-t">Download PDF</span>
//             </button>
//           </div>
//         </div>

//         {(searched || stacked || showHint) && (
//           <div className="cp-tools">
//             {searched && (
//               <div className="cp-hits">
//                 {showA && <Hits spec={A} names={matchA} onPick={(n) => pickFromChip('a', n)} />}
//                 {showB && <Hits spec={B} names={matchB} onPick={(n) => pickFromChip('b', n)} />}
//               </div>
//             )}
//             {showHint && (
//               <span className="cp-hint">Search a customer name to find their plots in both layouts.</span>
//             )}
//             {stacked && (
//               <div className="seg" role="group" aria-label="Layouts shown">
//                 {seg('both', 'Both')}
//                 {seg('a', 'A', A.color)}
//                 {seg('b', 'B', B.color)}
//               </div>
//             )}
//           </div>
//         )}

//         {nothingFound && (
//           <div className="note" role="status">
//             No plot found for this name in either layout. Plots are matched on the
//             owner name saved on the plot and on the customer name of saved quotations.
//           </div>
//         )}
//         {quotesError && (
//           <div className="note" role="alert">
//             Quotations could not be read ({String(quotesError)}). Search will use plot owner
//             names only, and the letter will have no prices.
//           </div>
//         )}
//       </header>

//       <main
//         className="cp-main"
//         style={{
//           gridTemplateColumns: both && !stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
//           gridTemplateRows: both && stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
//         }}
//       >
//         {showA && (
//           <PlanPane
//             key={aId}
//             mapId={aId}
//             spec={A}
//             query={query}
//             quotes={quotesA}
//             selected={selA}
//             onSelect={setSelA}
//             onMatches={setMatchA}
//             onData={setDataA}
//           />
//         )}
//         {showB && (
//           <PlanPane
//             key={bId}
//             mapId={bId}
//             spec={B}
//             query={query}
//             quotes={quotesB}
//             selected={selB}
//             onSelect={setSelB}
//             onMatches={setMatchB}
//             onData={setDataB}
//           />
//         )}
//       </main>

//       {canLetter && (
//         <footer className="cp-sum" data-open={sumOpen}>
//           <div className="cp-who">
//             <div className="cp-grp">
//               <UserIcon width={28} height={28} style={{ color: GOLD, flex: '0 0 auto' }} />
//               <div className="cp-grp-t">
//                 <span className="lbl">Customer</span>
//                 {customers.length > 1 ? (
//                   <select
//                     className="sel sel-strong"
//                     value={customer}
//                     onChange={(e) => setPickedCustomer(e.target.value)}
//                     aria-label="Customer"
//                   >
//                     {customers.map((c) => <option key={c} value={c}>{c}</option>)}
//                   </select>
//                 ) : (
//                   <span className="cp-cust" title={customer}>{customer}</span>
//                 )}
//               </div>
//             </div>

//             {pairs.length > 1 && (
//               <div className="cp-grp">
//                 <PinIcon width={26} height={26} style={{ color: GOLD, flex: '0 0 auto' }} />
//                 <div className="cp-grp-t">
//                   <span className="lbl">Plot pair (old → new)</span>
//                   <select
//                     className="sel"
//                     value={Math.min(pairIdx, pairs.length - 1)}
//                     onChange={(e) => setPairIdx(Number(e.target.value))}
//                     aria-label="Plot pair"
//                   >
//                     {pairs.map((p, i) => (
//                       <option key={i} value={i}>{`${p.o || '—'} → ${p.n || '—'}`}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             )}
//           </div>

//           <button
//             type="button"
//             className="iconbtn cp-toggle"
//             onClick={() => setSumOpen((o) => !o)}
//             aria-expanded={sumOpen}
//             aria-label={sumOpen ? 'Hide plot details' : 'Show plot details'}
//           >
//             <Chevron up={!sumOpen} />
//           </button>

//           <div className="cp-cards">
//             <SideCard spec={A} title={titleA} plot={plotA} />
//             <span className="swap" aria-hidden="true"><SwapIcon width={26} height={26} /></span>
//             <SideCard spec={B} title={titleB} plot={plotB} />
//           </div>

//           <div className="cp-acts">
//             <button type="button" className="btn btn-ghost" onClick={() => setLetter({ auto: false })}>
//               <DocIcon width={17} height={17} /> Preview letter
//             </button>
//             <button type="button" className="btn btn-gold" onClick={() => setLetter({ auto: true })}>
//               <DownloadIcon width={17} height={17} /> Download PDF
//             </button>
//           </div>
//         </footer>
//       )}

//       {letter && canLetter && (
//         <AllotmentLetter
//           customers={customers}
//           initialCustomer={customer}
//           autoPrint={letter.auto}
//           oldSide={{ layout: dataB && dataB.layout, quotes: quotesB }}
//           newSide={{ layout: dataA && dataA.layout, quotes: quotesA }}
//           onClose={() => setLetter(null)}
//         />
//       )}
//     </div>
//   );
// }

// /* Keyed by the pair, so switching project starts from a clean page: no
//    stale search, selection or half-loaded layout from the previous one. */
// export default function ComparePage() {
//   const { aId, bId } = useParams();
//   /* Only configured pairs: the route cannot be pointed at any two maps. */
//   if (!PAIRS.some((p) => p.aId === aId && p.bId === bId)) {
//     return <Navigate to="/sanctioned" replace />;
//   }
//   return <CompareView key={`${aId}/${bId}`} aId={aId} bId={bId} />;
// }
























import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import PlanPane from '../components/compare/PlanPane';
import AllotmentLetter from '../components/compare/AllotmentLetter';
import {
  CloseIcon, DocIcon, DownloadIcon, PinIcon, SearchIcon, SwapIcon, UserIcon,
} from '../components/compare/icons';
import { useQuotations } from '../hooks/useQuotations';
import { useAssignedCustomers } from '../hooks/useAssignedCustomers';
import { PAIRS } from '../config/maps';
import { customerNames, scopeQuotes } from '../lib/customerPlots';
import { autoPair, plotsOf } from '../lib/allotment';
import { dimensionText } from '../lib/geometry';
import { BODY, MONO, SANS } from '../theme/tokens';
import {
  GOLD, GOLD_DEEP, GOLD_GLOW, GOLD_LINE, INK, INK_SOFT, NAVY, NAVY_2, NAVY_3,
} from '../theme/compare';
import logo from '../assets/logo.jpg';

/* A is the sanctioned (NEW) layout, B the not-sanctioned (OLD) one. */
const A = { letter: 'A', label: 'Sanctioned', color: '#7CB342' };
const B = { letter: 'B', label: 'Not sanctioned', color: '#E0A33C' };

/* Below this width the two maps stack instead of sitting side by side. */
const STACK_BP = 1200;
/* Below this width the page uses its phone layout. */
const PHONE_BP = 720;

const collator = new Intl.Collator(undefined, { numeric: true });

/* Theme tokens are exposed as CSS variables so the stylesheet below can use
   media queries, hover and focus states, which inline styles cannot. */
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
  '--a': A.color,
  '--b': B.color,
};

const CSS = `
.cp, .cp * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.cp {
  width: 100%; height: 100vh; height: 100dvh;
  display: flex; flex-direction: column; overflow: hidden;
  background: radial-gradient(1200px 500px at 50% -10%, var(--navy3), var(--navy) 60%);
  color: var(--ink); font-family: var(--body);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
.cp button, .cp select, .cp input { font-family: inherit; }
.cp :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.cp select option { color: #1A1208; background: #fff; }
.cp .gm-style img { max-width: none; }

/* ---------- shared controls ---------- */
.cp .btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer;
  font: 700 13px/1 var(--body); white-space: nowrap; border: 1px solid transparent;
  transition: filter .15s ease, background-color .15s ease;
}
.cp .btn:disabled { opacity: .45; cursor: not-allowed; }
.cp .btn-gold {
  background: linear-gradient(180deg, var(--gold), var(--gold-deep)); color: #1A1208;
}
.cp .btn-gold:not(:disabled):hover { filter: brightness(1.08); }
.cp .btn-ghost { background: transparent; border-color: var(--gold); color: var(--ink); }
.cp .btn-ghost:hover { background: color-mix(in srgb, var(--gold) 14%, transparent); }
.cp .iconbtn {
  flex: 0 0 auto; width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
  display: grid; place-items: center; padding: 0;
  border: 1px solid var(--line); background: var(--navy3); color: var(--ink);
  transition: background-color .15s ease;
}
.cp .iconbtn:hover { background: var(--navy2); }
.cp .sel {
  min-height: 34px; max-width: 100%; padding: 0 28px 0 12px; border-radius: 10px;
  border: 1px solid var(--line); background-color: var(--navy3); color: var(--ink);
  font: 600 13px/1 var(--body); cursor: pointer; text-overflow: ellipsis;
}
.cp .lbl { font: 500 12px/1.2 var(--body); color: var(--ink-soft); }

/* ---------- header ---------- */
.cp-hdr {
  flex: 0 0 auto; display: grid; gap: 10px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px;
  background: linear-gradient(180deg, var(--navy2), var(--navy));
  border-bottom: 1px solid var(--line);
}
.cp-bar {
  display: grid; align-items: center; gap: 10px 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "nav act" "search search";
}
.cp-nav { grid-area: nav; display: flex; align-items: center; gap: 10px; min-width: 0; }
.cp-act { grid-area: act; }
.cp-logo {
  flex: 0 0 auto; height: 40px; width: auto; display: block;
  border-radius: 10px; background: #fff; padding: 3px;
}
.cp-title { display: grid; gap: 3px; min-width: 0; }
.cp-name {
  font: 700 15px/1.2 var(--body); color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cp-sub { font: 400 12px/1.2 var(--body); color: var(--ink-soft); }
.cp .sel-title { min-height: 30px; padding-left: 0; border: none; background-color: transparent; font-weight: 700; font-size: 15px; }
.cp-searchbox {
  grid-area: search; width: 100%; height: 44px; display: flex; align-items: center; gap: 10px;
  padding: 0 8px 0 14px; border-radius: 999px; background: #F4F1EA; color: #1A1208;
  box-shadow: var(--glow);
}
.cp-searchbox input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font: 600 16px/1 var(--body); color: #1A1208;
}
.cp-searchbox input::placeholder { color: #8A8478; font-weight: 500; }
.cp-searchbox input::-webkit-search-cancel-button { display: none; }
.cp-searchbox:focus-within { outline: 2px solid var(--gold); outline-offset: 2px; }
.cp-searchbox .clear {
  flex: 0 0 auto; width: 32px; height: 32px; border: none; border-radius: 50%;
  background: transparent; color: #1A1208; cursor: pointer; display: grid; place-items: center;
}
.cp-searchbox .clear:hover { background: rgba(26,18,8,.08); }

.cp-tools {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px 14px; flex-wrap: wrap;
}
.cp-hint { font: 400 13px/1.3 var(--body); color: var(--ink-soft); }
.cp-hits { display: flex; flex-wrap: wrap; gap: 8px 16px; max-height: 88px; overflow: auto; min-width: 0; }
.hits { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hits-l { display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1 var(--body); color: var(--ink); }
.dot { flex: 0 0 auto; width: 9px; height: 9px; border-radius: 50%; background: var(--dot); }
.hits-none, .hits-more { font: 500 12px/1 var(--body); color: var(--ink-soft); }
.chip {
  min-height: 32px; padding: 0 12px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--line); background: transparent; color: var(--ink);
  font: 600 12.5px/1 var(--body); font-variant-numeric: tabular-nums;
  transition: background-color .15s ease, border-color .15s ease;
}
.chip:hover { background: color-mix(in srgb, var(--gold) 14%, transparent); border-color: var(--gold); }

.seg {
  display: inline-flex; gap: 2px; padding: 3px; margin-left: auto;
  border: 1px solid var(--line); border-radius: 999px; background: var(--navy2);
}
.seg button {
  min-height: 34px; padding: 0 14px; border: none; border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px;
  background: transparent; color: var(--ink); font: 600 13px/1 var(--body);
  transition: background-color .15s ease;
}
.seg button[aria-pressed="true"] { background: var(--gold); color: #1A1208; }
.seg button:not([aria-pressed="true"]):hover { background: color-mix(in srgb, var(--gold) 14%, transparent); }

.note {
  padding: 8px 12px; border-radius: 10px; font: 500 12.5px/1.45 var(--body);
  color: #F0C46E; background: rgba(224,163,60,.1); border: 1px solid rgba(224,163,60,.35);
}

/* ---------- maps ---------- */
.cp-main { flex: 1; min-height: 0; display: grid; gap: 12px; padding: 12px; }

/* ---------- summary footer ---------- */
.cp-sum {
  flex: 0 0 auto; display: grid; align-items: center; gap: 12px 18px;
  margin: 0 12px calc(12px + env(safe-area-inset-bottom, 0px)); padding: 12px 14px;
  border-radius: 14px; border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--navy3), var(--navy2));
  box-shadow: 0 -6px 24px rgba(0,0,0,.3);
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "who cards acts";
}
.cp-who { grid-area: who; display: flex; align-items: center; gap: 12px 20px; flex-wrap: wrap; min-width: 0; }
.cp-grp { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cp-grp-t { display: grid; gap: 3px; min-width: 0; }
.cp-cust {
  font: 700 16px/1.2 var(--body); color: var(--ink); max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cp .sel-strong { min-height: 30px; padding-left: 0; border: none; background-color: transparent; font-size: 16px; font-weight: 700; max-width: 220px; }
.cp-toggle { grid-area: toggle; display: none; }
.cp-cards { grid-area: cards; display: flex; align-items: center; justify-content: center; gap: 12px; min-width: 0; }
.cp-cards .swap { flex: 0 0 auto; display: grid; place-items: center; color: var(--gold); }
.cp-acts { grid-area: acts; display: flex; gap: 10px; }

.side {
  flex: 1 1 0; min-width: 0; max-width: 460px; display: flex; overflow: hidden;
  border-radius: 12px; border: 1px solid var(--line); border-left: 4px solid var(--side);
  background: var(--navy);
}
.side-h { flex: 0 0 auto; width: 118px; display: flex; align-items: center; gap: 9px; padding: 8px 10px; }
.side-badge {
  flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  background: var(--side); color: #1A1208; font: 800 13px/1 var(--body);
}
.side-hl { display: grid; gap: 2px; min-width: 0; }
.side-t { font: 700 13px/1.15 var(--body); color: var(--ink); white-space: nowrap; }
.side-s {
  font: 400 11.5px/1.2 var(--body); color: var(--ink-soft);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.side-b {
  flex: 1; min-width: 0; margin: 0; display: grid; grid-template-columns: 0.8fr 1fr 1.3fr;
  background: #F3EBD8; color: #1A1208;
}
.side-c { min-width: 0; padding: 8px 6px; text-align: center; display: grid; align-content: center; gap: 3px; }
.side-c + .side-c { border-left: 1px solid rgba(26,18,8,.14); }
.side-c dt { font: 500 11px/1.2 var(--body); color: #6B5B3A; }
.side-c dd {
  margin: 0; font: 700 13px/1.25 var(--mono); font-variant-numeric: tabular-nums;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ---------- desktop ---------- */
@media (min-width: 900px) {
  .cp-bar {
    grid-template-columns: minmax(250px, auto) minmax(0, 1fr) auto;
    grid-template-areas: "nav search act";
  }
  .cp-searchbox { max-width: 560px; justify-self: center; }
}

/* ---------- tablet and below: summary wraps to two rows ---------- */
@media (max-width: 1099px) {
  .cp-sum {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "who acts" "cards cards";
  }
  .cp-cards { justify-content: stretch; }
  .side { max-width: none; }
}

/* ---------- phone ---------- */
@media (max-width: 719px) {
  .cp-hdr { padding: calc(8px + env(safe-area-inset-top, 0px)) 10px 8px; gap: 8px; }
  .cp-sub { display: none; }
  .cp-main { gap: 8px; padding: 8px; }
  .cp-sum {
    margin: 0 8px calc(8px + env(safe-area-inset-bottom, 0px)); padding: 8px 10px; gap: 10px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "who toggle" "cards cards" "acts acts";
    max-height: 58vh; max-height: 58dvh; overflow: auto;
  }
  .cp-toggle { display: grid; }
  .cp-sum[data-open="false"] .cp-cards,
  .cp-sum[data-open="false"] .cp-acts { display: none; }
  .cp-cards { flex-direction: column; align-items: stretch; gap: 6px; }
  .cp-cards .swap { transform: rotate(90deg); }
  .cp-cards .side { flex: none; }
  .cp-acts .btn { flex: 1; }
  .cp-hits { max-height: 72px; }
}
@media (max-width: 479px) {
  .cp-act .btn { width: 40px; padding: 0; }
  .cp-act .btn-t { display: none; }
  .side-h { width: 104px; padding: 8px; }
  .seg button { padding: 0 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .cp * { transition: none !important; }
}
`;

function useViewportWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return w;
}

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* One side of the bottom summary: plot number, area, dimensions. */
function SideCard({ spec, title, plot }) {
  const area = plot && Number.isFinite(plot.area) ? `${plot.area.toFixed(2)} sq.m` : '—';
  const cells = plot
    ? [
      ['Plot No.', plot.name],
      ['Area', area],
      ['Dimensions', (plot.doc && plot.doc.dimensions) || dimensionText(plot.sides) || '—'],
    ]
    : [['Plot No.', '—'], ['Area', '—'], ['Dimensions', '—']];
  return (
    <div className="side" style={{ '--side': spec.color }}>
      <div className="side-h">
        <span className="side-badge" aria-hidden="true">{spec.letter}</span>
        <span className="side-hl">
          <span className="side-t">Layout {spec.letter}</span>
          <span className="side-s" title={title || spec.label}>{title || spec.label}</span>
        </span>
      </div>
      <dl className="side-b">
        {cells.map(([k, v]) => (
          <div key={k} className="side-c">
            <dt>{k}</dt>
            <dd title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Hits({ spec, names, onPick }) {
  if (!names) return null;
  const list = [...names].sort(collator.compare);
  return (
    <div className="hits">
      <span className="hits-l" style={{ '--dot': spec.color }}>
        <span className="dot" />
        {spec.label}
      </span>
      {list.length === 0 && <span className="hits-none">no plot</span>}
      {list.slice(0, 12).map((n) => (
        <button key={n} type="button" className="chip" onClick={() => onPick(n)}>{n}</button>
      ))}
      {list.length > 12 && <span className="hits-more">+{list.length - 12} more</span>}
    </div>
  );
}

function Chevron({ up }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: up ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CompareView({ aId, bId }) {
  const navigate = useNavigate();
  const vw = useViewportWidth();
  const stacked = vw < STACK_BP;
  const wide = vw >= PHONE_BP;

  const { quotes, error: quotesError } = useQuotations(true);

  const [view, setView] = useState('both');            // 'both' | 'a' | 'b'
  const [input, setInput] = useState('');
  const query = useDebounced(input, 250);

  const [selA, setSelA] = useState(null);
  const [selB, setSelB] = useState(null);
  const [matchA, setMatchA] = useState(null);
  const [matchB, setMatchB] = useState(null);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [letter, setLetter] = useState(null);          // null | { auto }
  const [pickedCustomer, setPickedCustomer] = useState('');
  const [pairIdx, setPairIdx] = useState(0);
  /* On phones the plot summary starts folded so the maps keep the screen. */
  const [sumOpen, setSumOpen] = useState(() => window.innerWidth >= PHONE_BP);

  /* ── CUSTOMERS OF THE NOT-SANCTIONED LAYOUT (B), ATTACHED TO PLOTS OF
     THE SANCTIONED LAYOUT (A) ────────────────────────────────────────
     nsCustomers  [{ id, oldPlot, name, phone, address }] — the picker list
     assigned     { [sanctioned plot no.]: customer }
     onAssign     (sanctioned plot no., customer | null)
     The sanctioned map id is aId; B's layout is dataB.layout. */
  const {
    customers: nsCustomers, assigned, onAssign,
  } = useAssignedCustomers(dataB && dataB.layout, aId);

  const showA = view !== 'b';
  const showB = view !== 'a';
  const both = showA && showB;

  /* Quotations name a project, not a map: keep each layout's own. */
  const titleA = dataA ? dataA.title : '';
  const titleB = dataB ? dataB.title : '';
  const quotesA = useMemo(() => scopeQuotes(quotes, titleA, titleB), [quotes, titleA, titleB]);
  const quotesB = useMemo(() => scopeQuotes(quotes, titleB, titleA), [quotes, titleA, titleB]);

  /* Customer names for the letter and the summary. Customers attached to a
     sanctioned plot count too, so they appear even if no quotation or
     owner name on layout A carries their name. */
  const customers = useMemo(() => {
    const base = customerNames([
      { layout: dataA && dataA.layout, quotes: quotesA },
      { layout: dataB && dataB.layout, quotes: quotesB },
    ], query);
    const q = query.trim().toLowerCase();
    const extra = Object.values(assigned || {})
      .map((c) => c && c.name)
      .filter((n) => n && (!q || n.toLowerCase().includes(q)));
    return [...new Set([...base, ...extra])].sort(collator.compare);
  }, [dataA, dataB, quotesA, quotesB, query, assigned]);

  const customer = customers.includes(pickedCustomer) ? pickedCustomer : (customers[0] || '');

  /* The bottom summary follows the same pairing the letter starts from.
     When the chosen customer has been attached to sanctioned plots, THOSE
     are the pairs: old plot (from the not-sanctioned layout) → the
     sanctioned plot it was attached to. Otherwise fall back to autoPair. */
  const pairs = useMemo(() => {
    const attached = Object.entries(assigned || {})
      .filter(([, c]) => c && c.name === customer)
      .map(([plotName, c]) => ({ o: c.oldPlot || null, n: plotName }))
      .sort((x, y) => collator.compare(x.n, y.n));
    if (attached.length) return attached;
    return autoPair(
      plotsOf(dataB && dataB.layout, quotesB, customer),
      plotsOf(dataA && dataA.layout, quotesA, customer),
    );
  }, [dataA, dataB, quotesA, quotesB, customer, assigned]);
  const pair = pairs[Math.min(pairIdx, Math.max(0, pairs.length - 1))] || null;
  const plotB = pair && pair.o && dataB && dataB.layout ? dataB.layout.byName.get(pair.o) : null;
  const plotA = pair && pair.n && dataA && dataA.layout ? dataA.layout.byName.get(pair.n) : null;

  useEffect(() => { setPairIdx(0); }, [customer]);

  const pickFromChip = useCallback((key, name) => {
    if (view !== 'both' && view !== key) setView(key);
    (key === 'a' ? setSelA : setSelB)(name);
  }, [view]);

  const searched = query.trim().length > 0;
  const nothingFound = searched && matchA && matchB && matchA.size === 0 && matchB.size === 0;
  const canLetter = customers.length > 0;
  const showHint = !searched && wide;

  const currentPair = PAIRS.find((p) => p.aId === aId && p.bId === bId);

  const seg = (v, label, color) => (
    <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}>
      {color && <span className="dot" style={{ '--dot': color }} />}
      {label}
    </button>
  );

  return (
    <div className="cp" style={THEME_VARS}>
      <style>{CSS}</style>

      <header className="cp-hdr">
        <div className="cp-bar">
          <div className="cp-nav">
            <button
              type="button"
              className="iconbtn"
              onClick={() => navigate('/sanctioned')}
              aria-label="Back to projects"
              style={{ font: `500 22px/1 ${MONO}` }}
            >
              ‹
            </button>
            <img className="cp-logo" src={logo} alt="Logo" />
            <div className="cp-title">
              {PAIRS.length > 1 ? (
                <select
                  className="sel sel-title"
                  value={currentPair ? currentPair.name : ''}
                  onChange={(e) => {
                    const p = PAIRS.find((x) => x.name === e.target.value);
                    if (p) navigate(`/sanctioned/${p.aId}/${p.bId}`);
                  }}
                  aria-label="Switch project"
                >
                  <option value="" disabled>Switch project…</option>
                  {PAIRS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              ) : (
                <span className="cp-name">{currentPair ? currentPair.name : 'Layout comparison'}</span>
              )}
              <span className="cp-sub">Sanctioned vs not sanctioned</span>
            </div>
          </div>

          <label className="cp-searchbox">
            <SearchIcon style={{ flex: '0 0 auto' }} />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search customer name…"
              aria-label="Search customer name"
              autoComplete="off"
              enterKeyHint="search"
            />
            {input && (
              <button type="button" className="clear" onClick={() => setInput('')} aria-label="Clear search">
                <CloseIcon />
              </button>
            )}
          </label>

          <div className="cp-act">
            <button
              type="button"
              className="btn btn-gold"
              disabled={!canLetter}
              aria-label="Download allotment comparison letter as PDF"
              title={canLetter ? 'Open the letter and print or save as PDF' : 'Search a customer first'}
              onClick={() => setLetter({ auto: true })}
            >
              <DownloadIcon width={17} height={17} />
              <span className="btn-t">Download PDF</span>
            </button>
          </div>
        </div>

        {(searched || stacked || showHint) && (
          <div className="cp-tools">
            {searched && (
              <div className="cp-hits">
                {showA && <Hits spec={A} names={matchA} onPick={(n) => pickFromChip('a', n)} />}
                {showB && <Hits spec={B} names={matchB} onPick={(n) => pickFromChip('b', n)} />}
              </div>
            )}
            {showHint && (
              <span className="cp-hint">Search a customer name to find their plots in both layouts.</span>
            )}
            {stacked && (
              <div className="seg" role="group" aria-label="Layouts shown">
                {seg('both', 'Both')}
                {seg('a', 'A', A.color)}
                {seg('b', 'B', B.color)}
              </div>
            )}
          </div>
        )}

        {nothingFound && (
          <div className="note" role="status">
            No plot found for this name in either layout. Plots are matched on the
            owner name saved on the plot and on the customer name of saved quotations.
          </div>
        )}
        {quotesError && (
          <div className="note" role="alert">
            Quotations could not be read ({String(quotesError)}). Search will use plot owner
            names only, and the letter will have no prices.
          </div>
        )}
      </header>

      <main
        className="cp-main"
        style={{
          gridTemplateColumns: both && !stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
          gridTemplateRows: both && stacked ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)',
        }}
      >
        {/* SANCTIONED (A): the only pane that can attach a customer, and the
            one whose plot feeds the quotation. */}
        {showA && (
          <PlanPane
            key={aId}
            mapId={aId}
            spec={A}
            query={query}
            quotes={quotesA}
            selected={selA}
            onSelect={setSelA}
            onMatches={setMatchA}
            onData={setDataA}
            canAssign
            customers={nsCustomers}
            assigned={assigned}
            onAssign={onAssign}
          />
        )}
        {/* NOT SANCTIONED (B): its layout feeds the customer list above. It
            must stay mounted for that list to exist — see the note below. */}
        {showB && (
          <PlanPane
            key={bId}
            mapId={bId}
            spec={B}
            query={query}
            quotes={quotesB}
            selected={selB}
            onSelect={setSelB}
            onMatches={setMatchB}
            onData={setDataB}
          />
        )}
      </main>

      {canLetter && (
        <footer className="cp-sum" data-open={sumOpen}>
          <div className="cp-who">
            <div className="cp-grp">
              <UserIcon width={28} height={28} style={{ color: GOLD, flex: '0 0 auto' }} />
              <div className="cp-grp-t">
                <span className="lbl">Customer</span>
                {customers.length > 1 ? (
                  <select
                    className="sel sel-strong"
                    value={customer}
                    onChange={(e) => setPickedCustomer(e.target.value)}
                    aria-label="Customer"
                  >
                    {customers.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <span className="cp-cust" title={customer}>{customer}</span>
                )}
              </div>
            </div>

            {pairs.length > 1 && (
              <div className="cp-grp">
                <PinIcon width={26} height={26} style={{ color: GOLD, flex: '0 0 auto' }} />
                <div className="cp-grp-t">
                  <span className="lbl">Plot pair (old → new)</span>
                  <select
                    className="sel"
                    value={Math.min(pairIdx, pairs.length - 1)}
                    onChange={(e) => setPairIdx(Number(e.target.value))}
                    aria-label="Plot pair"
                  >
                    {pairs.map((p, i) => (
                      <option key={i} value={i}>{`${p.o || '—'} → ${p.n || '—'}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="iconbtn cp-toggle"
            onClick={() => setSumOpen((o) => !o)}
            aria-expanded={sumOpen}
            aria-label={sumOpen ? 'Hide plot details' : 'Show plot details'}
          >
            <Chevron up={!sumOpen} />
          </button>

          <div className="cp-cards">
            <SideCard spec={A} title={titleA} plot={plotA} />
            <span className="swap" aria-hidden="true"><SwapIcon width={26} height={26} /></span>
            <SideCard spec={B} title={titleB} plot={plotB} />
          </div>

          <div className="cp-acts">
            <button type="button" className="btn btn-ghost" onClick={() => setLetter({ auto: false })}>
              <DocIcon width={17} height={17} /> Preview letter
            </button>
            <button type="button" className="btn btn-gold" onClick={() => setLetter({ auto: true })}>
              <DownloadIcon width={17} height={17} /> Download PDF
            </button>
          </div>
        </footer>
      )}

      {letter && canLetter && (
        <AllotmentLetter
          customers={customers}
          initialCustomer={customer}
          autoPrint={letter.auto}
          oldSide={{ layout: dataB && dataB.layout, quotes: quotesB }}
          newSide={{ layout: dataA && dataA.layout, quotes: quotesA }}
          assigned={assigned}
          onClose={() => setLetter(null)}
        />
      )}
    </div>
  );
}

/* Keyed by the pair, so switching project starts from a clean page: no
   stale search, selection or half-loaded layout from the previous one. */
export default function ComparePage() {
  const { aId, bId } = useParams();
  /* Only configured pairs: the route cannot be pointed at any two maps. */
  if (!PAIRS.some((p) => p.aId === aId && p.bId === bId)) {
    return <Navigate to="/sanctioned" replace />;
  }
  return <CompareView key={`${aId}/${bId}`} aId={aId} bId={bId} />;
}