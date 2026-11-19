// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import LOGO_SRC from "../assets/logo.jpg";
// import Hanuman from "../assets/premier.jpeg";
// import vastu from "../assets/madhav.jpeg";
// /* ---------------------------------------------------------------
//    Default / fallback crest
//    Used whenever a project has no matching entry in PROJECT_IMAGES
//    below, or the record itself has no projectId/projectName.
// ------------------------------------------------------------------ */

// /* ---------------------------------------------------------------
//    Per-project image registry
//    -----------------------------------------------------------------
//    Add one entry per project id (or project name, if that's the
//    only identifier you have on your records).

//    Matching is CASE- AND WHITESPACE-INSENSITIVE (see normalizeKey
//    below), so 'Aradhya Nagari', 'ARADHYA NAGARI', and
//    '  aradhya nagari ' all resolve to the same image. This matters
//    because real Firestore data is rarely typed with perfectly
//    consistent casing.

//    To add a new project's crest/photo:
//      1. Import the image at the top of this file, e.g.
//           import LAKEVIEW_LOGO_SRC from "../assets/lakeview-logo.jpeg";
//      2. Add a line below mapping its id or name to that import.
// ------------------------------------------------------------------ */
// const PROJECT_IMAGES_RAW = {
//   Nisarg: LOGO_SRC,
//   "Prime heritage": Hanuman,
//   "Madhav Nagri": vastu,
//   // 'prospera-lakeview': LAKEVIEW_LOGO_SRC,
//   // 'prospera-hillcrest': HILLCREST_LOGO_SRC,
// };

// const DEFAULT_PROJECT_IMAGE = LOGO_SRC;

// /** Normalizes a key so casing/whitespace differences don't break the match. */
// function normalizeKey(value) {
//   return String(value || "")
//     .trim()
//     .toUpperCase();
// }

// // Pre-normalize the registry once so lookups are cheap and consistent.
// const PROJECT_IMAGES = Object.fromEntries(
//   Object.entries(PROJECT_IMAGES_RAW).map(([key, src]) => [
//     normalizeKey(key),
//     src,
//   ]),
// );

// /**
//  * Resolves the correct crest/cover image for a project, trying each
//  * candidate identifier in order (e.g. projectId, then projectName,
//  * then a plain "name" field) and falling back to the default image
//  * if none of them match a registered entry. Pass as many candidates
//  * as your data model might use — undefined/empty ones are skipped.
//  */
// function getProjectImage(...candidates) {
//   for (const candidate of candidates) {
//     const match = PROJECT_IMAGES[normalizeKey(candidate)];
//     if (match) return match;
//   }
//   return DEFAULT_PROJECT_IMAGE;
// }

// /* ---------------------------------------------------------------
//    Formatters (stand-ins for the ones normally imported from
//    ./HomeParts, included here so this file runs standalone)
// ------------------------------------------------------------------ */
// const inr = new Intl.NumberFormat("en-IN", {
//   style: "currency",
//   currency: "INR",
//   maximumFractionDigits: 0,
// });
// const plain = new Intl.NumberFormat("en-IN");
// const shortDate = new Intl.DateTimeFormat("en-IN", {
//   day: "2-digit",
//   month: "short",
//   year: "numeric",
// });

// /* ---------------------------------------------------------------
//    Motion
// ------------------------------------------------------------------ */
// const reveal = {
//   hidden: { opacity: 0, y: 18 },
//   show: (i) => ({
//     opacity: 1,
//     y: 0,
//     transition: {
//       delay: Math.min(i, 8) * 0.06,
//       duration: 0.36,
//       ease: [0.16, 1, 0.3, 1],
//     },
//   }),
// };

// /* =================================================================
//    QuotationCard
//    Shows a small per-project glyph/crest instead of the fixed
//    document icon, resolved from q.projectId (falls back to
//    q.projectName, then to the default crest, then to the plain
//    document icon if the image itself fails to load).
// ================================================================= */
// export function QuotationCard({ quotation: q, index, onOpen }) {
//   const [pressed, setPressed] = useState(false);

//   return (
//     <motion.button
//       type="button"
//       className={`qcard${pressed ? " is-pressed" : ""}`}
//       custom={index}
//       variants={reveal}
//       initial="hidden"
//       animate="show"
//       onPointerDown={() => setPressed(true)}
//       onPointerUp={() => setPressed(false)}
//       onPointerLeave={() => setPressed(false)}
//       onClick={() => onOpen(q)}
//     >
//       <span className="qcard-spine" aria-hidden="true" />
//       <span className="qcard-body">
//         <span className="qcard-top">
//           <span className="qcard-glyph" aria-hidden="true">
//             <svg
//               viewBox="0 0 24 24"
//               width="18"
//               height="18"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.4"
//             >
//               <path d="M6 3h9l4 4v14H6z" />
//               <path d="M15 3v4h4" />
//               <path d="M9 13h6M9 16.5h6M9 9.5h3" />
//             </svg>
//           </span>
//           <span className="qcard-who">
//             <strong>{q.customerName}</strong>
//             <span>
//               {q.projectName} · Plot {q.plotNumber}
//             </span>
//           </span>
//           <span className="qcard-money">
//             <strong>{inr.format(q.finalTotalAmount)}</strong>
//             <span>{shortDate.format(q.quotationDate)}</span>
//           </span>
//         </span>
//         <span className="qcard-chips">
//           <span className="pill">{plain.format(q.plotSize)} sq ft</span>
//           <span className="pill">{inr.format(q.ratePerSqFt)}/sq ft</span>
//         </span>
//       </span>
//     </motion.button>
//   );
// }
// /* =================================================================
//    MapCard
//    Resolves its cover image per-project via map.projectId (falling
//    back to map.projectName, then the default crest). Falls back to
//    a plain glyph if the resolved image fails to decode.
// ================================================================= */
// /* ---------------------------------------------------------------
//    Share helpers (frontend only)
// ------------------------------------------------------------------ */
// function buildShareUrl(mapId) {
//   return `${window.location.origin}/share/maps/${encodeURIComponent(mapId)}`;
// }

// async function copyText(text) {
//   try {
//     if (navigator.clipboard && window.isSecureContext) {
//       await navigator.clipboard.writeText(text);
//       return true;
//     }
//   } catch {
//     /* fall through to legacy copy */
//   }
//   try {
//     const ta = document.createElement("textarea");
//     ta.value = text;
//     ta.style.cssText = "position:fixed;opacity:0";
//     document.body.appendChild(ta);
//     ta.select();
//     const ok = document.execCommand("copy");
//     document.body.removeChild(ta);
//     return ok;
//   } catch {
//     return false;
//   }
// }

// /** Native share sheet if available, otherwise copy to clipboard. */
// async function shareMapLink(map) {
//   const url = buildShareUrl(map.id);
//   const title = map.name || "Layout map";

//   if (navigator.share) {
//     try {
//       await navigator.share({ title, text: `${title} – layout map`, url });
//       return "shared";
//     } catch (err) {
//       if (err?.name === "AbortError") return "cancelled";
//     }
//   }
//   return (await copyText(url)) ? "copied" : "failed";
// }

// /* =================================================================
//    MapCard
//    Share moved onto the cover image itself, top-right corner —
//    icon only, no label. The label text still lives in `title`
//    (tooltip) and `aria-label` so it stays accessible; it just isn't
//    painted on the card anymore.
// ================================================================= */
// export function MapCard({ map, index, onOpen }) {
//   const [pressed, setPressed] = useState(false);
//   const [broken, setBroken] = useState(false);
//   const [shareState, setShareState] = useState("idle"); // idle | copied | failed

//   const open = onOpen || (() => {});
//   const crestSrc = getProjectImage(
//     map.projectId,
//     map.projectName,
//     map.project,
//     map.name,
//     map.title,
//   );

//   const shareLabel =
//     shareState === "copied"
//       ? "Link copied"
//       : shareState === "failed"
//         ? "Copy failed"
//         : "Share layout link";

//   const handleShare = async (e) => {
//     e.stopPropagation();
//     const result = await shareMapLink(map);
//     if (result === "copied" || result === "failed") {
//       setShareState(result);
//       setTimeout(() => setShareState("idle"), 2000);
//     }
//   };

//   return (
//     <motion.div
//       className={`mcard${pressed ? " is-pressed" : ""}`}
//       custom={index}
//       variants={reveal}
//       initial="hidden"
//       animate="show"
//       onPointerDown={() => setPressed(true)}
//       onPointerUp={() => setPressed(false)}
//       onPointerLeave={() => setPressed(false)}
//     >
//       <div className="mcard-cover">
//         {broken ? (
//           <div className="mcard-fallback" aria-hidden="true">
//             <svg
//               viewBox="0 0 24 24"
//               width="28"
//               height="28"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.3"
//             >
//               <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2z" />
//               <path d="M10 4v14M14 6v14" />
//             </svg>
//           </div>
//         ) : (
//           <>
//             <img
//               key={map.projectId || map.projectName || map.name}
//               src={crestSrc}
//               alt={`${map.projectName || map.name || map.projectId || "Project"} crest`}
//               className="mcard-crest"
//               onError={() => setBroken(true)}
//             />
//             <span
//               className="mcard-corner mcard-corner--tl"
//               aria-hidden="true"
//             />
//             <span
//               className="mcard-corner mcard-corner--br"
//               aria-hidden="true"
//             />
//           </>
//         )}
//         <span className="mcard-fade" aria-hidden="true" />

//         <button
//           type="button"
//           className={`mcard-share-icon${shareState !== "idle" ? ` is-${shareState}` : ""}`}
//           onClick={handleShare}
//           aria-label={shareLabel}
//           title={shareLabel}
//         >
//           <svg
//             viewBox="0 0 24 24"
//             width="15"
//             height="15"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="1.8"
//           >
//             <circle cx="18" cy="5" r="2.5" />
//             <circle cx="6" cy="12" r="2.5" />
//             <circle cx="18" cy="19" r="2.5" />
//             <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
//           </svg>
//         </button>
//       </div>

//       <div className="mcard-foot">
//         <div className="mcard-name">
//           <strong>{map.name || map.id}</strong>
//           {map.createdDate && (
//             <span>
//               {shortDate.format(
//                 map.createdDate?.toDate
//                   ? map.createdDate.toDate()
//                   : new Date(map.createdDate),
//               )}
//             </span>
//           )}
//         </div>

//         <button type="button" className="mcard-open" onClick={() => open(map)}>
//           Open map
//         </button>
//       </div>
//     </motion.div>
//   );
// }

// /* =================================================================
//    Demo shell — sample data + styling, so the two cards above can be
//    previewed exactly as they'll look once dropped into the real app.
//    These now use YOUR three real project names (not the old
//    Prospera placeholders), so you can actually see the crest switch
//    between cards.
// ================================================================= */
// const sampleQuotations = [
//   {
//     projectId: "ARADHYA NAGARI",
//     customerName: "Rohan Deshmukh",
//     projectName: "Aradhya Nagari",
//     plotNumber: "A-14",
//     finalTotalAmount: 4850000,
//     quotationDate: new Date("2026-07-18"),
//     plotSize: 2400,
//     ratePerSqFt: 2020,
//   },
//   {
//     projectId: "HANUMAN VATIKA",
//     customerName: "Ananya & Kunal Rao",
//     projectName: "Hanuman Vatika",
//     plotNumber: "C-07",
//     finalTotalAmount: 6120000,
//     quotationDate: new Date("2026-08-02"),
//     plotSize: 3000,
//     ratePerSqFt: 2040,
//   },
//   {
//     projectId: "VASTU BHUMI",
//     customerName: "Priya Sharma",
//     projectName: "Vastu Bhumi",
//     plotNumber: "D-02",
//     finalTotalAmount: 3990000,
//     quotationDate: new Date("2026-08-20"),
//     plotSize: 2000,
//     ratePerSqFt: 1995,
//   },
// ];

// // Deliberately shaped like the real data: NO projectId/projectName
// // field, only `name` — this is the shape that was falling back to
// // the default image before the getProjectImage fallback chain fix.
// const sampleMaps = [
//   {
//     id: "layout-master",
//     name: "ARADHYA NAGARI",
//     createdDate: new Date("2026-09-03"),
//   },
//   {
//     id: "layout-phase2",
//     name: "HANUMAN VATIKA",
//     createdDate: new Date("2026-09-07"),
//   },
//   {
//     id: "layout-vastu",
//     name: "Vastu Bhumi",
//     createdDate: new Date("2026-09-16"),
//   },
// ];

// export default function ProsperaCardsPreview() {
//   return (
//     <div className="ps-shell">
//       <header className="ps-header">
//         <span className="ps-eyebrow">Site records</span>
//         <h1>Quotations & Maps</h1>
//         <p>
//           Quotations issued and layout maps on file, grouped across all active
//           projects.
//         </p>
//       </header>

//       <section>
//         <h2>Quotations</h2>
//         <div className="ps-qgrid">
//           {sampleQuotations.map((q, i) => (
//             <QuotationCard
//               key={q.plotNumber}
//               quotation={q}
//               index={i}
//               onOpen={() => {}}
//             />
//           ))}
//         </div>
//       </section>

//       <section>
//         <h2>Maps</h2>
//         <div className="ps-mgrid">
//           {sampleMaps.map((m, i) => (
//             <MapCard key={m.id} map={m} index={i} onOpen={() => {}} />
//           ))}
//         </div>
//       </section>

//       <style>{`
//         :root {
//           --ink: #211c14;
//           --ivory: #faf6ee;
//           --panel: #fffdf9;
//           --gold: #a9812f;
//           --gold-deep: #7c5e21;
//           --gold-soft: #e7d4a1;
//           --hair: #e4d9bf;
//           --muted: #7a715f;
//           --charcoal: #201c17;
//         }

//         .ps-shell {
//           background: var(--ivory);
//           color: var(--ink);
//           font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
//           padding: 48px 32px 72px;
//           max-width: 920px;
//           margin: 0 auto;
//         }

//         .ps-header {
//           margin-bottom: 44px;
//           padding-bottom: 28px;
//           border-bottom: 1px solid var(--hair);
//         }
//         .ps-eyebrow {
//           font-family: 'Playfair Display', Georgia, serif;
//           font-style: italic;
//           font-size: 15px;
//           color: var(--gold-deep);
//         }
//         .ps-header h1 {
//           font-family: 'Playfair Display', Georgia, serif;
//           font-weight: 600;
//           font-size: 34px;
//           margin: 6px 0 8px;
//           letter-spacing: 0.2px;
//         }
//         .ps-header p {
//           color: var(--muted);
//           font-size: 15px;
//           margin: 0;
//         }

//         section { margin-bottom: 40px; }
//         section h2 {
//           font-family: 'Playfair Display', Georgia, serif;
//           font-weight: 600;
//           font-size: 19px;
//           margin: 0 0 16px;
//           color: var(--ink);
//         }

//         .ps-qgrid, .ps-mgrid {
//           display: grid;
//           gap: 16px;
//         }
//         .ps-mgrid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

//         /* ---------- Quotation card ---------- */
//         .qcard {
//           display: flex;
//           align-items: stretch;
//           width: 100%;
//           background: var(--panel);
//           border: 1px solid var(--hair);
//           border-radius: 10px;
//           padding: 0;
//           text-align: left;
//           cursor: pointer;
//           overflow: hidden;
//           transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
//         }
//         .qcard:hover {
//           border-color: var(--gold);
//           box-shadow: 0 6px 24px rgba(122, 92, 33, 0.12);
//         }
//         .qcard.is-pressed { transform: scale(0.995); }
//         .qcard-spine {
//           width: 4px;
//           flex-shrink: 0;
//           background: linear-gradient(180deg, var(--gold), var(--gold-deep));
//         }
//         .qcard-body {
//           flex: 1;
//           padding: 18px 20px;
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//         }
//         .qcard-top {
//           display: flex;
//           align-items: flex-start;
//           gap: 12px;
//         }
//         .qcard-glyph {
//           color: var(--gold-deep);
//           margin-top: 2px;
//           flex-shrink: 0;
//           width: 22px;
//           height: 22px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           border-radius: 6px;
//           overflow: hidden;
//           background: var(--gold-soft);
//         }
//         .qcard-crest-img {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//         }
//         .qcard-who {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//           flex: 1;
//           min-width: 0;
//         }
//         .qcard-who strong {
//           font-family: 'Playfair Display', Georgia, serif;
//           font-size: 16px;
//           font-weight: 600;
//         }
//         .qcard-who span {
//           font-size: 12.5px;
//           color: var(--muted);
//         }
//         .qcard-money {
//           display: flex;
//           flex-direction: column;
//           align-items: flex-end;
//           gap: 2px;
//           flex-shrink: 0;
//         }
//         .qcard-money strong {
//           font-size: 15.5px;
//           font-weight: 700;
//           color: var(--gold-deep);
//         }
//         .qcard-money span {
//           font-size: 11.5px;
//           color: var(--muted);
//         }
//         .qcard-chips {
//           display: flex;
//           gap: 8px;
//           padding-left: 30px;
//         }
//         .pill {
//           font-size: 11.5px;
//           padding: 4px 10px;
//           border-radius: 999px;
//           background: var(--gold-soft);
//           color: var(--gold-deep);
//           font-weight: 600;
//           letter-spacing: 0.2px;
//         }

//         /* ---------- Map card ---------- */
//         .mcard {
//           background: var(--panel);
//           border: 1px solid var(--hair);
//           border-radius: 10px;
//           overflow: hidden;
//           transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
//         }
//         .mcard:hover {
//           border-color: var(--gold);
//           box-shadow: 0 10px 28px rgba(122, 92, 33, 0.14);
//         }
//         .mcard.is-pressed { transform: scale(0.99); }

//         .mcard-cover {
//           position: relative;
         
//         }
//         .mcard-crest {
//           width: 62%;
//           max-width: 220px;
//           height: auto;
//           filter: drop-shadow(0 4px 14px rgba(0,0,0,0.35));
//         }
//         .mcard-fallback {
//           color: var(--gold-soft);
//           opacity: 0.8;
//         }
//         .mcard-corner {
//           position: absolute;
//           width: 22px;
//           height: 22px;
//           border: 1.5px solid var(--gold);
//           opacity: 0.55;
//         }
//         .mcard-corner--tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
//         .mcard-corner--br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
//         .mcard-fade {
//           position: absolute;
//           inset: auto 0 0 0;
//           height: 46%;
//           background: linear-gradient(180deg, rgba(32,28,23,0) 0%, rgba(32,28,23,0.55) 100%);
//           pointer-events: none;
//         }

//         /* Share button: icon only, pinned to the top-right corner of the
//            cover image. Sits above mcard-fade (later in the DOM = higher
//            stacking within this positioning context) so it's always
//            clickable regardless of the crest image underneath. */
//         .mcard-share-icon {
//   position: absolute;
//   top: 14px;
//   right: 14px;
//   width: 34px;
//   height: 34px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 10px;
//   border: 1px solid rgba(255, 255, 255, 0.08);
//   background: rgba(20, 20, 22, 0.88);
//   color: #d9dbe0;
//   cursor: pointer;
//   padding: 0;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
// }
//         .mcard-share-icon:hover {
//           background: rgba(40, 40, 44, 0.95);
//           border-color: rgba(255, 255, 255, 0.18);
//           color: #fff;
//         }
//         .mcard-share-icon:active { transform: scale(0.92); }
//         .mcard-share-icon.is-copied {
//           background: #3f7d4e;
//           border-color: #3f7d4e;
//           color: #eaf5ec;
//         }
//         .mcard-share-icon.is-failed {
//           background: #b3402f;
//           border-color: #b3402f;
//           color: #fbeceA;
//         }

//         .mcard-foot {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 14px 16px;
//         }
//         .mcard-name {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//           min-width: 0;
//         }
//         .mcard-name strong {
//           font-family: 'Playfair Display', Georgia, serif;
//           font-size: 14.5px;
//           font-weight: 600;
//           white-space: nowrap;
//           overflow: hidden;
//           text-overflow: ellipsis;
//         }
//         .mcard-name span {
//           font-size: 11.5px;
//           color: var(--muted);
//         }
//         .mcard-open {
//           flex-shrink: 0;
//           font-size: 12.5px;
//           font-weight: 600;
//           padding: 7px 14px;
//           border-radius: 999px;
//           border: 1px solid var(--gold);
//           background: transparent;
//           color: var(--gold-deep);
//           cursor: pointer;
//           transition: background 0.2s ease, color 0.2s ease;
//         }
//         .mcard-open:hover {
//           background: var(--gold);
//           color: #fff;
//         }
//       `}</style>
//     </div>
//   );
// }







import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ---------------------------------------------------------------
   Styles
   Injected once, so the cards look right wherever they are used.
   Class names are prefixed qt- (quotation) and mp- (map); they do
   not reuse the old .qcard / .mcard names.

   Colours come from the page: --hp-accent and --hp-panel when the
   shell sets them, otherwise gold on a faint tint. Greys are
   derived from currentColor, so the cards work on light or dark.

   Design: quiet and tabular. Small radius, hairline rules, no
   pictures, and the accent colour is kept for the one action on
   each card.
------------------------------------------------------------------ */
const CARD_CSS = `
.qt, .mp {
  --c-line: color-mix(in srgb, currentColor 13%, transparent);
  --c-strong: color-mix(in srgb, currentColor 32%, transparent);
  --c-soft: color-mix(in srgb, currentColor 60%, transparent);
  --c-fill: color-mix(in srgb, currentColor 5%, transparent);
  --c-accent: var(--hp-accent, #A9812F);
  container-type: inline-size;
  box-sizing: border-box; color: inherit; font-family: inherit;
  border: 1px solid var(--c-line); border-radius: 10px;
  background: var(--hp-panel, var(--c-fill));
  transition: border-color .15s ease, box-shadow .15s ease;
}
.qt *, .mp * { box-sizing: border-box; }
.qt:hover, .mp:hover {
  border-color: var(--c-strong);
  box-shadow: 0 1px 2px rgba(0, 0, 0, .08), 0 10px 24px rgba(0, 0, 0, .10);
}
.qt:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

/* ---------- quotation: a small statement ---------- */
.qt { display: block; width: 100%; padding: 0; overflow: hidden; text-align: left; cursor: pointer; }
.qt-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding: 16px 18px 14px;
}
.qt-who { display: grid; gap: 4px; min-width: 0; }
.qt-who strong {
  font-size: 15.5px; font-weight: 650; line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.qt-who span {
  font-size: 13px; line-height: 1.3; color: var(--c-soft);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.qt-total { display: grid; flex: 0 0 auto; gap: 4px; text-align: right; }
.qt-total strong {
  font-size: 17px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.qt-total span { font-size: 12px; line-height: 1.3; color: var(--c-soft); white-space: nowrap; }
.qt-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--c-line); background: var(--c-fill);
}
.qt-cell { display: grid; gap: 3px; min-width: 0; padding: 10px 14px 11px 18px; }
.qt-cell + .qt-cell { border-left: 1px solid var(--c-line); padding-left: 14px; }
.qt-cell i { font-style: normal; font-size: 11.5px; line-height: 1.2; color: var(--c-soft); }
.qt-cell b {
  font-size: 13px; font-weight: 650; line-height: 1.3; font-variant-numeric: tabular-nums;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

@container (max-width: 380px) {
  .qt-head { flex-direction: column; gap: 10px; }
  .qt-total { text-align: left; }
  .qt-grid { grid-template-columns: minmax(0, 1fr); }
  .qt-cell, .qt-cell + .qt-cell {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 12px; padding: 9px 18px;
  }
  .qt-cell + .qt-cell { border-left: 0; border-top: 1px solid var(--c-line); }
}

/* ---------- map: a register entry ---------- */
.mp { position: relative; display: flex; flex-direction: column; overflow: hidden; }
.mp-body { display: grid; gap: 6px; padding: 16px 18px 18px; }
.mp-kind {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12px; line-height: 1.2; color: var(--c-soft);
}
.mp-kind::before {
  content: ""; width: 8px; height: 8px; border-radius: 2px;
  background: hsl(var(--mp-hue) 45% 48%);
}
.mp-title {
  display: block; width: 100%; margin: 0; padding: 0 44px 0 0; border: 0; background: none;
  color: inherit; font: inherit; font-size: 17px; font-weight: 650; line-height: 1.3;
  letter-spacing: -0.005em; text-align: left; cursor: pointer;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* The title's overlay makes the whole card the click target. */
.mp-title::after { content: ""; position: absolute; inset: 0; border-radius: 10px; }
.mp-title:focus-visible { outline: none; }
.mp-title:focus-visible::after { outline: 2px solid var(--c-accent); outline-offset: 2px; }
.mp-date { font-size: 13px; line-height: 1.3; color: var(--c-soft); }
.mp-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 18px; border-top: 1px solid var(--c-line); background: var(--c-fill);
  font-size: 13px; font-weight: 650; color: var(--c-accent);
  transition: background-color .15s ease;
}
.mp:hover .mp-foot { background: color-mix(in srgb, var(--c-accent) 10%, transparent); }
.mp-foot svg { transition: transform .15s ease; }
.mp:hover .mp-foot svg { transform: translateX(2px); }

.mp-share {
  position: absolute; top: 9px; right: 10px; z-index: 2; width: 36px; height: 36px;
  display: grid; place-items: center; padding: 0; border-radius: 8px; cursor: pointer;
  border: 1px solid transparent; background: transparent; color: var(--c-soft);
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.mp-share:hover { color: inherit; background: var(--c-fill); border-color: var(--c-line); }
.mp-share:active { background: var(--c-line); }
.mp-share:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
.mp-share.is-copied { color: #2f8f4e; border-color: currentColor; background: rgba(47, 143, 78, .1); }
.mp-share.is-failed { color: #c2503b; border-color: currentColor; background: rgba(194, 80, 59, .1); }
.mp-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
@media (pointer: coarse) {
  .mp-share { top: 5px; right: 6px; width: 44px; height: 44px; }
  .mp-title { padding-right: 48px; }
}

@media (prefers-reduced-motion: reduce) {
  .qt, .mp, .mp-foot, .mp-foot svg, .mp-share { transition: none; }
  .mp:hover .mp-foot svg { transform: none; }
}
`;

const STYLE_ID = "cards-css";
function ensureStyles() {
  if (typeof document === "undefined") return;
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = CARD_CSS;
}
ensureStyles();

/* ---------------------------------------------------------------
   Formatters
------------------------------------------------------------------ */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const plain = new Intl.NumberFormat("en-IN");
const shortDate = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Accepts a Date, a Firestore Timestamp or a date string; '' if unusable. */
function fmtDate(value) {
  if (!value) return "";
  const d = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : shortDate.format(d);
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* A steady muted hue per map name: a small marker so maps are easy to
   tell apart without any imagery. */
const HUES = [38, 158, 205, 265, 12];
function hueFor(name) {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

/* ---------------------------------------------------------------
   Motion — a short, small rise; skipped for reduced motion.
------------------------------------------------------------------ */
const reveal = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i, 8) * 0.04,
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* =================================================================
   QuotationCard
   Reads like a line on a statement: who and how much on top, then
   plot, size and rate in ruled columns.
================================================================= */
export function QuotationCard({ quotation: q, index = 0, onOpen }) {
  const reduce = useReducedMotion();
  const date = fmtDate(q.quotationDate);

  return (
    <motion.button
      type="button"
      className="qt"
      custom={index}
      variants={reveal}
      initial={reduce ? false : "hidden"}
      animate="show"
      onClick={() => onOpen && onOpen(q)}
    >
      <span className="qt-head">
        <span className="qt-who">
          <strong title={q.customerName}>{q.customerName}</strong>
          <span title={q.projectName}>{q.projectName}</span>
        </span>
        <span className="qt-total">
          <strong>{inr.format(num(q.finalTotalAmount))}</strong>
          {date && <span>Quoted {date}</span>}
        </span>
      </span>

      <span className="qt-grid">
        <span className="qt-cell">
          <i>Plot</i>
          <b>{q.plotNumber}</b>
        </span>
        <span className="qt-cell">
          <i>Plot size</i>
          <b>{plain.format(num(q.plotSize))} sq ft</b>
        </span>
        <span className="qt-cell">
          <i>Rate per sq ft</i>
          <b>{inr.format(num(q.ratePerSqFt))}</b>
        </span>
      </span>
    </motion.button>
  );
}

/* ---------------------------------------------------------------
   Share helpers (frontend only)
------------------------------------------------------------------ */
function buildShareUrl(mapId) {
  return `${window.location.origin}/share/maps/${encodeURIComponent(mapId)}`;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Native share sheet if available, otherwise copy to clipboard. */
async function shareMapLink(map) {
  const url = buildShareUrl(map.id);
  const title = map.name || "Layout map";

  if (navigator.share) {
    try {
      await navigator.share({ title, text: `${title} – layout map`, url });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }
  return (await copyText(url)) ? "copied" : "failed";
}

function ShareIcon({ state }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 17,
    height: 17,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  if (state === "copied") {
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  if (state === "failed") {
    return (
      <svg {...common}>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </svg>
  );
}

/* =================================================================
   MapCard
   A register entry: kind, name and date, with the open action as
   a ruled footer. The whole card opens the map; share is a quiet
   icon button in the corner.
================================================================= */
export function MapCard({ map, index = 0, onOpen }) {
  const reduce = useReducedMotion();
  const [shareState, setShareState] = useState("idle"); // idle | copied | failed

  const title = map.name || map.id;
  const date = fmtDate(map.createdDate);

  const shareLabel =
    shareState === "copied"
      ? "Link copied"
      : shareState === "failed"
        ? "Copy failed"
        : "Share layout link";

  const handleShare = async (e) => {
    e.stopPropagation();
    const result = await shareMapLink(map);
    if (result === "copied" || result === "failed") {
      setShareState(result);
      setTimeout(() => setShareState("idle"), 2000);
    }
  };

  return (
    <motion.article
      className="mp"
      style={{ "--mp-hue": hueFor(title) }}
      custom={index}
      variants={reveal}
      initial={reduce ? false : "hidden"}
      animate="show"
    >
      <div className="mp-body">
        <span className="mp-kind">Layout map</span>
        <button
          type="button"
          className="mp-title"
          title={title}
          onClick={() => onOpen && onOpen(map)}
        >
          {title}
        </button>
        {date && <span className="mp-date">Added {date}</span>}
      </div>

      <div className="mp-foot" aria-hidden="true">
        Open map
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>

      <button
        type="button"
        className={`mp-share${shareState !== "idle" ? ` is-${shareState}` : ""}`}
        onClick={handleShare}
        aria-label={shareLabel}
        title={shareLabel}
      >
        <ShareIcon state={shareState} />
      </button>
      <span className="mp-sr" role="status">
        {shareState !== "idle" ? shareLabel : ""}
      </span>
    </motion.article>
  );
}

/* =================================================================
   Preview — sample data so the two cards can be viewed on their
   own. Not used by the app.
================================================================= */
const sampleQuotations = [
  {
    customerName: "Rohan Deshmukh",
    projectName: "Aradhya Nagari",
    plotNumber: "A-14",
    finalTotalAmount: 4850000,
    quotationDate: new Date("2026-07-18"),
    plotSize: 2400,
    ratePerSqFt: 2020,
  },
  {
    customerName: "Ananya & Kunal Rao",
    projectName: "Hanuman Vatika",
    plotNumber: "C-07",
    finalTotalAmount: 6120000,
    quotationDate: new Date("2026-08-02"),
    plotSize: 3000,
    ratePerSqFt: 2040,
  },
  {
    customerName: "Priya Sharma",
    projectName: "Vastu Bhumi",
    plotNumber: "D-02",
    finalTotalAmount: 3990000,
    quotationDate: new Date("2026-08-20"),
    plotSize: 2000,
    ratePerSqFt: 1995,
  },
];

const sampleMaps = [
  { id: "layout-master", name: "Aradhya Nagari", createdDate: new Date("2026-09-03") },
  { id: "layout-phase2", name: "Hanuman Vatika", createdDate: new Date("2026-09-07") },
  { id: "layout-vastu", name: "Vastu Bhumi", createdDate: new Date("2026-09-16") },
];

export default function ProsperaCardsPreview() {
  return (
    <div
      style={{
        "--hp-accent": "#A9812F",
        "--hp-panel": "#FFFFFF",
        background: "#F5F3EE",
        color: "#1F1C17",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: "40px 20px 64px",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 36 }}>
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Quotations</h2>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            }}
          >
            {sampleQuotations.map((q, i) => (
              <QuotationCard key={q.plotNumber} quotation={q} index={i} onOpen={() => {}} />
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Maps</h2>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            }}
          >
            {sampleMaps.map((m, i) => (
              <MapCard key={m.id} map={m} index={i} onOpen={() => {}} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
