import React, { useState } from "react";
import { motion } from "framer-motion";
import LOGO_SRC from "../assets/logo.jpg";
import Hanuman from "../assets/premier.jpeg";
import vastu from "../assets/madhav.jpeg";
/* ---------------------------------------------------------------
   Default / fallback crest
   Used whenever a project has no matching entry in PROJECT_IMAGES
   below, or the record itself has no projectId/projectName.
------------------------------------------------------------------ */

/* ---------------------------------------------------------------
   Per-project image registry
   -----------------------------------------------------------------
   Add one entry per project id (or project name, if that's the
   only identifier you have on your records).

   Matching is CASE- AND WHITESPACE-INSENSITIVE (see normalizeKey
   below), so 'Aradhya Nagari', 'ARADHYA NAGARI', and
   '  aradhya nagari ' all resolve to the same image. This matters
   because real Firestore data is rarely typed with perfectly
   consistent casing.

   To add a new project's crest/photo:
     1. Import the image at the top of this file, e.g.
          import LAKEVIEW_LOGO_SRC from "../assets/lakeview-logo.jpeg";
     2. Add a line below mapping its id or name to that import.
------------------------------------------------------------------ */
const PROJECT_IMAGES_RAW = {
  Nisarg: LOGO_SRC,
  "Prime heritage": Hanuman,
  "Madhav Nagri": vastu,
  // 'prospera-lakeview': LAKEVIEW_LOGO_SRC,
  // 'prospera-hillcrest': HILLCREST_LOGO_SRC,
};

const DEFAULT_PROJECT_IMAGE = LOGO_SRC;

/** Normalizes a key so casing/whitespace differences don't break the match. */
function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

// Pre-normalize the registry once so lookups are cheap and consistent.
const PROJECT_IMAGES = Object.fromEntries(
  Object.entries(PROJECT_IMAGES_RAW).map(([key, src]) => [
    normalizeKey(key),
    src,
  ]),
);

/**
 * Resolves the correct crest/cover image for a project, trying each
 * candidate identifier in order (e.g. projectId, then projectName,
 * then a plain "name" field) and falling back to the default image
 * if none of them match a registered entry. Pass as many candidates
 * as your data model might use — undefined/empty ones are skipped.
 */
function getProjectImage(...candidates) {
  for (const candidate of candidates) {
    const match = PROJECT_IMAGES[normalizeKey(candidate)];
    if (match) return match;
  }
  return DEFAULT_PROJECT_IMAGE;
}

/* ---------------------------------------------------------------
   Formatters (stand-ins for the ones normally imported from
   ./HomeParts, included here so this file runs standalone)
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

/* ---------------------------------------------------------------
   Motion
------------------------------------------------------------------ */
const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i, 8) * 0.06,
      duration: 0.36,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* =================================================================
   QuotationCard
   Shows a small per-project glyph/crest instead of the fixed
   document icon, resolved from q.projectId (falls back to
   q.projectName, then to the default crest, then to the plain
   document icon if the image itself fails to load).
================================================================= */
export function QuotationCard({ quotation: q, index, onOpen }) {
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      type="button"
      className={`qcard${pressed ? " is-pressed" : ""}`}
      custom={index}
      variants={reveal}
      initial="hidden"
      animate="show"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => onOpen(q)}
    >
      <span className="qcard-spine" aria-hidden="true" />
      <span className="qcard-body">
        <span className="qcard-top">
          <span className="qcard-glyph" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M15 3v4h4" />
              <path d="M9 13h6M9 16.5h6M9 9.5h3" />
            </svg>
          </span>
          <span className="qcard-who">
            <strong>{q.customerName}</strong>
            <span>
              {q.projectName} · Plot {q.plotNumber}
            </span>
          </span>
          <span className="qcard-money">
            <strong>{inr.format(q.finalTotalAmount)}</strong>
            <span>{shortDate.format(q.quotationDate)}</span>
          </span>
        </span>
        <span className="qcard-chips">
          <span className="pill">{plain.format(q.plotSize)} sq ft</span>
          <span className="pill">{inr.format(q.ratePerSqFt)}/sq ft</span>
        </span>
      </span>
    </motion.button>
  );
}
/* =================================================================
   MapCard
   Resolves its cover image per-project via map.projectId (falling
   back to map.projectName, then the default crest). Falls back to
   a plain glyph if the resolved image fails to decode.
================================================================= */
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

/* =================================================================
   MapCard
   Share moved onto the cover image itself, top-right corner —
   icon only, no label. The label text still lives in `title`
   (tooltip) and `aria-label` so it stays accessible; it just isn't
   painted on the card anymore.
================================================================= */
export function MapCard({ map, index, onOpen }) {
  const [pressed, setPressed] = useState(false);
  const [broken, setBroken] = useState(false);
  const [shareState, setShareState] = useState("idle"); // idle | copied | failed

  const open = onOpen || (() => {});
  const crestSrc = getProjectImage(
    map.projectId,
    map.projectName,
    map.project,
    map.name,
    map.title,
  );

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
    <motion.div
      className={`mcard${pressed ? " is-pressed" : ""}`}
      custom={index}
      variants={reveal}
      initial="hidden"
      animate="show"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <div className="mcard-cover">
        {broken ? (
          <div className="mcard-fallback" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2z" />
              <path d="M10 4v14M14 6v14" />
            </svg>
          </div>
        ) : (
          <>
            <img
              key={map.projectId || map.projectName || map.name}
              src={crestSrc}
              alt={`${map.projectName || map.name || map.projectId || "Project"} crest`}
              className="mcard-crest"
              onError={() => setBroken(true)}
            />
            <span
              className="mcard-corner mcard-corner--tl"
              aria-hidden="true"
            />
            <span
              className="mcard-corner mcard-corner--br"
              aria-hidden="true"
            />
          </>
        )}
        <span className="mcard-fade" aria-hidden="true" />

        <button
          type="button"
          className={`mcard-share-icon${shareState !== "idle" ? ` is-${shareState}` : ""}`}
          onClick={handleShare}
          aria-label={shareLabel}
          title={shareLabel}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
          </svg>
        </button>
      </div>

      <div className="mcard-foot">
        <div className="mcard-name">
          <strong>{map.name || map.id}</strong>
          {map.createdDate && (
            <span>
              {shortDate.format(
                map.createdDate?.toDate
                  ? map.createdDate.toDate()
                  : new Date(map.createdDate),
              )}
            </span>
          )}
        </div>

        <button type="button" className="mcard-open" onClick={() => open(map)}>
          Open map
        </button>
      </div>
    </motion.div>
  );
}

/* =================================================================
   Demo shell — sample data + styling, so the two cards above can be
   previewed exactly as they'll look once dropped into the real app.
   These now use YOUR three real project names (not the old
   Prospera placeholders), so you can actually see the crest switch
   between cards.
================================================================= */
const sampleQuotations = [
  {
    projectId: "ARADHYA NAGARI",
    customerName: "Rohan Deshmukh",
    projectName: "Aradhya Nagari",
    plotNumber: "A-14",
    finalTotalAmount: 4850000,
    quotationDate: new Date("2026-07-18"),
    plotSize: 2400,
    ratePerSqFt: 2020,
  },
  {
    projectId: "HANUMAN VATIKA",
    customerName: "Ananya & Kunal Rao",
    projectName: "Hanuman Vatika",
    plotNumber: "C-07",
    finalTotalAmount: 6120000,
    quotationDate: new Date("2026-08-02"),
    plotSize: 3000,
    ratePerSqFt: 2040,
  },
  {
    projectId: "VASTU BHUMI",
    customerName: "Priya Sharma",
    projectName: "Vastu Bhumi",
    plotNumber: "D-02",
    finalTotalAmount: 3990000,
    quotationDate: new Date("2026-08-20"),
    plotSize: 2000,
    ratePerSqFt: 1995,
  },
];

// Deliberately shaped like the real data: NO projectId/projectName
// field, only `name` — this is the shape that was falling back to
// the default image before the getProjectImage fallback chain fix.
const sampleMaps = [
  {
    id: "layout-master",
    name: "ARADHYA NAGARI",
    createdDate: new Date("2026-09-03"),
  },
  {
    id: "layout-phase2",
    name: "HANUMAN VATIKA",
    createdDate: new Date("2026-09-07"),
  },
  {
    id: "layout-vastu",
    name: "Vastu Bhumi",
    createdDate: new Date("2026-09-16"),
  },
];

export default function ProsperaCardsPreview() {
  return (
    <div className="ps-shell">
      <header className="ps-header">
        <span className="ps-eyebrow">Site records</span>
        <h1>Quotations & Maps</h1>
        <p>
          Quotations issued and layout maps on file, grouped across all active
          projects.
        </p>
      </header>

      <section>
        <h2>Quotations</h2>
        <div className="ps-qgrid">
          {sampleQuotations.map((q, i) => (
            <QuotationCard
              key={q.plotNumber}
              quotation={q}
              index={i}
              onOpen={() => {}}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Maps</h2>
        <div className="ps-mgrid">
          {sampleMaps.map((m, i) => (
            <MapCard key={m.id} map={m} index={i} onOpen={() => {}} />
          ))}
        </div>
      </section>

      <style>{`
        :root {
          --ink: #211c14;
          --ivory: #faf6ee;
          --panel: #fffdf9;
          --gold: #a9812f;
          --gold-deep: #7c5e21;
          --gold-soft: #e7d4a1;
          --hair: #e4d9bf;
          --muted: #7a715f;
          --charcoal: #201c17;
        }

        .ps-shell {
          background: var(--ivory);
          color: var(--ink);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 48px 32px 72px;
          max-width: 920px;
          margin: 0 auto;
        }

        .ps-header {
          margin-bottom: 44px;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--hair);
        }
        .ps-eyebrow {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 15px;
          color: var(--gold-deep);
        }
        .ps-header h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: 34px;
          margin: 6px 0 8px;
          letter-spacing: 0.2px;
        }
        .ps-header p {
          color: var(--muted);
          font-size: 15px;
          margin: 0;
        }

        section { margin-bottom: 40px; }
        section h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: 19px;
          margin: 0 0 16px;
          color: var(--ink);
        }

        .ps-qgrid, .ps-mgrid {
          display: grid;
          gap: 16px;
        }
        .ps-mgrid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

        /* ---------- Quotation card ---------- */
        .qcard {
          display: flex;
          align-items: stretch;
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--hair);
          border-radius: 10px;
          padding: 0;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .qcard:hover {
          border-color: var(--gold);
          box-shadow: 0 6px 24px rgba(122, 92, 33, 0.12);
        }
        .qcard.is-pressed { transform: scale(0.995); }
        .qcard-spine {
          width: 4px;
          flex-shrink: 0;
          background: linear-gradient(180deg, var(--gold), var(--gold-deep));
        }
        .qcard-body {
          flex: 1;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .qcard-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .qcard-glyph {
          color: var(--gold-deep);
          margin-top: 2px;
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          overflow: hidden;
          background: var(--gold-soft);
        }
        .qcard-crest-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .qcard-who {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .qcard-who strong {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
        }
        .qcard-who span {
          font-size: 12.5px;
          color: var(--muted);
        }
        .qcard-money {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .qcard-money strong {
          font-size: 15.5px;
          font-weight: 700;
          color: var(--gold-deep);
        }
        .qcard-money span {
          font-size: 11.5px;
          color: var(--muted);
        }
        .qcard-chips {
          display: flex;
          gap: 8px;
          padding-left: 30px;
        }
        .pill {
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--gold-soft);
          color: var(--gold-deep);
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        /* ---------- Map card ---------- */
        .mcard {
          background: var(--panel);
          border: 1px solid var(--hair);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .mcard:hover {
          border-color: var(--gold);
          box-shadow: 0 10px 28px rgba(122, 92, 33, 0.14);
        }
        .mcard.is-pressed { transform: scale(0.99); }

        .mcard-cover {
          position: relative;
         
        }
        .mcard-crest {
          width: 62%;
          max-width: 220px;
          height: auto;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.35));
        }
        .mcard-fallback {
          color: var(--gold-soft);
          opacity: 0.8;
        }
        .mcard-corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border: 1.5px solid var(--gold);
          opacity: 0.55;
        }
        .mcard-corner--tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
        .mcard-corner--br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
        .mcard-fade {
          position: absolute;
          inset: auto 0 0 0;
          height: 46%;
          background: linear-gradient(180deg, rgba(32,28,23,0) 0%, rgba(32,28,23,0.55) 100%);
          pointer-events: none;
        }

        /* Share button: icon only, pinned to the top-right corner of the
           cover image. Sits above mcard-fade (later in the DOM = higher
           stacking within this positioning context) so it's always
           clickable regardless of the crest image underneath. */
        .mcard-share-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(20, 20, 22, 0.88);
  color: #d9dbe0;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
        .mcard-share-icon:hover {
          background: rgba(40, 40, 44, 0.95);
          border-color: rgba(255, 255, 255, 0.18);
          color: #fff;
        }
        .mcard-share-icon:active { transform: scale(0.92); }
        .mcard-share-icon.is-copied {
          background: #3f7d4e;
          border-color: #3f7d4e;
          color: #eaf5ec;
        }
        .mcard-share-icon.is-failed {
          background: #b3402f;
          border-color: #b3402f;
          color: #fbeceA;
        }

        .mcard-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
        }
        .mcard-name {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .mcard-name strong {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mcard-name span {
          font-size: 11.5px;
          color: var(--muted);
        }
        .mcard-open {
          flex-shrink: 0;
          font-size: 12.5px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--gold-deep);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .mcard-open:hover {
          background: var(--gold);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
