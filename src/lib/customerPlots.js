// import { asPlotNo } from '../models/PlotData';

// /* One definition of "same name" for the whole feature. */
// export const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// const words = (q) => norm(q).split(' ').filter(Boolean);
// const hasAll = (name, ws) => {
//   const n = norm(name);
//   return !!n && ws.every((w) => n.includes(w));
// };

// /** The customer recorded on a plot document (set from the Flutter app). */
// export const ownerOf = (plot) => (plot && plot.doc && plot.doc.ownerName) || '';

// /**
//  * Keep the quotations that belong to ONE layout of a pair.
//  *
//  * A quotation stores a free-text project name, not a map id. So a
//  * quotation is dropped from a layout only when its project name clearly
//  * names the OTHER layout; anything ambiguous (both layouts share a title,
//  * or the name matches neither) stays in both, because wrongly hiding a
//  * customer's plot is worse than showing it twice.
//  */
// export function scopeQuotes(quotes, title, otherTitle) {
//   const t = norm(title);
//   const o = norm(otherTitle);
//   if (!t || !o || t === o) return quotes;
//   const names = (p, q) => !!p && (q.includes(p) || p.includes(q));
//   return quotes.filter((q) => {
//     const p = norm(q.projectName);
//     return names(p, t) || !names(p, o);
//   });
// }

// /** Quotations whose plot number exists in this layout. */
// const quoteHits = (layout, quotes, test) => quotes.filter(
//   (q) => layout.byName.has(asPlotNo(q.plotNumber)) && test(q.customerName),
// );

// /**
//  * Plot names in `layout` that belong to a customer, or null when nothing
//  * has been typed. Two sources, because a freshly sanctioned layout often
//  * has no owner names yet while the quotations already exist:
//  *   1. the plot's own ownerName
//  *   2. a quotation for that plot number made in the customer's name
//  * Every typed word must appear in the name ("rahul pat" finds "Rahul Patil").
//  */
// export function plotsForCustomer(layout, query, quotes = []) {
//   const ws = words(query);
//   if (!layout || !ws.length) return null;
//   const hits = new Set();
//   layout.byName.forEach((plot, name) => {
//     if (hasAll(ownerOf(plot), ws)) hits.add(name);
//   });
//   quoteHits(layout, quotes, (n) => hasAll(n, ws))
//     .forEach((q) => hits.add(asPlotNo(q.plotNumber)));
//   return hits;
// }

// /** Distinct customer names behind a search, across the given layouts. */
// export function customerNames(sources, query) {
//   const ws = words(query);
//   if (!ws.length) return [];
//   const seen = new Map();
//   const add = (n) => {
//     const key = norm(n);
//     if (key && hasAll(n, ws) && !seen.has(key)) seen.set(key, String(n).trim());
//   };
//   sources.forEach(({ layout, quotes }) => {
//     if (!layout) return;
//     layout.byName.forEach((plot) => add(ownerOf(plot)));
//     quoteHits(layout, quotes || [], () => true).forEach((q) => add(q.customerName));
//   });
//   return [...seen.values()].sort();
// }








import { asPlotNo } from '../models/PlotData';

/* One definition of "same name" for the whole feature. */
export const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const words = (q) => norm(q).split(' ').filter(Boolean);
const hasAll = (name, ws) => {
  const n = norm(name);
  return !!n && ws.every((w) => n.includes(w));
};

/* ---------- field access ----------
   The first listed key that has a value wins. Rename or add keys here to
   match what the Flutter app and the quotation form actually save. */
const pick = (obj, keys) => {
  if (!obj) return '';
  for (const k of keys) if (obj[k]) return obj[k];
  return '';
};
const MOBILE_KEYS = ['ownerMobile', 'ownerPhone', 'mobile', 'mobileNumber', 'customerMobile', 'phone'];
const DATE_KEYS = ['allotmentDate', 'allottedOn', 'allotedDate'];

/** The customer recorded on a plot document (set from the Flutter app). */
export const ownerOf = (plot) => (plot && plot.doc && plot.doc.ownerName) || '';

const plotRecord = (plot) => ({
  name: ownerOf(plot),
  mobile: pick(plot && plot.doc, MOBILE_KEYS),
  date: pick(plot && plot.doc, DATE_KEYS),
});
const quoteRecord = (q) => ({
  name: q.customerName,
  mobile: pick(q, MOBILE_KEYS),
  date: pick(q, DATE_KEYS),
});

/* ---------- dates and phones ---------- */
const pad = (n) => String(n).padStart(2, '0');
const digits = (s) => String(s ?? '').replace(/\D/g, '');

/** Any date shape -> 'YYYY-MM-DD', or '' if it is not a date.
 *  Handles Firestore Timestamp, Date, 2026-11-12 and day-first 12/11/2026. */
export function toISODate(v) {
  if (!v) return '';
  if (typeof v.toDate === 'function') v = v.toDate();
  else if (typeof v === 'object' && typeof v.seconds === 'number') v = new Date(v.seconds * 1000);
  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? '' : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})$/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${pad(m[2])}-${pad(m[1])}`;
  }
  return '';
}

/** Decide once what kind of search the text is: date, mobile or name. */
function parseQuery(raw) {
  const q = String(raw ?? '').trim();
  if (!q) return null;

  const date = toISODate(q);
  if (date) return { kind: 'date', date };

  if (/^[\d\s+()-]+$/.test(q) && digits(q).length >= 4) {
    let d = digits(q);
    if (d.length > 10 && d.startsWith('91')) d = d.slice(2); // +91 prefix
    return { kind: 'phone', digits: d };
  }
  return { kind: 'name', ws: words(q) };
}

const recordMatches = (rec, p) => {
  if (p.kind === 'date') return toISODate(rec.date) === p.date;
  if (p.kind === 'phone') return digits(rec.mobile).slice(-10).includes(p.digits);
  return hasAll(rec.name, p.ws);
};

/**
 * Keep the quotations that belong to ONE layout of a pair.
 *
 * A quotation stores a free-text project name, not a map id. So a
 * quotation is dropped from a layout only when its project name clearly
 * names the OTHER layout; anything ambiguous (both layouts share a title,
 * or the name matches neither) stays in both, because wrongly hiding a
 * customer's plot is worse than showing it twice.
 */
export function scopeQuotes(quotes, title, otherTitle) {
  const t = norm(title);
  const o = norm(otherTitle);
  if (!t || !o || t === o) return quotes;
  const names = (p, q) => !!p && (q.includes(p) || p.includes(q));
  return quotes.filter((q) => {
    const p = norm(q.projectName);
    return names(p, t) || !names(p, o);
  });
}

/** Quotations whose plot number exists in this layout and match the search. */
const quoteHits = (layout, quotes, parsed) => quotes.filter(
  (q) => layout.byName.has(asPlotNo(q.plotNumber)) && recordMatches(quoteRecord(q), parsed),
);

/**
 * Plot names in `layout` that belong to a customer, or null when nothing
 * has been typed. The text can be a name (every word must appear:
 * "rahul pat" finds "Rahul Patil"), a mobile number (full or the last 4+
 * digits, +91 ignored) or an allotment date (12/11/2026, 12-11-26 or
 * 2026-11-12, day first). Two sources, as before:
 *   1. the plot's own owner fields
 *   2. a quotation for that plot number
 */
export function plotsForCustomer(layout, query, quotes = []) {
  const parsed = parseQuery(query);
  if (!layout || !parsed) return null;
  const hits = new Set();
  layout.byName.forEach((plot, name) => {
    if (recordMatches(plotRecord(plot), parsed)) hits.add(name);
  });
  quoteHits(layout, quotes, parsed)
    .forEach((q) => hits.add(asPlotNo(q.plotNumber)));
  return hits;
}

/** Distinct customer names behind a search, across the given layouts. */
export function customerNames(sources, query) {
  const parsed = parseQuery(query);
  if (!parsed) return [];
  const seen = new Map();
  const add = (n) => {
    const key = norm(n);
    if (key && !seen.has(key)) seen.set(key, String(n).trim());
  };
  sources.forEach(({ layout, quotes }) => {
    if (!layout) return;
    layout.byName.forEach((plot) => {
      const rec = plotRecord(plot);
      if (recordMatches(rec, parsed)) add(rec.name);
    });
    quoteHits(layout, quotes || [], parsed).forEach((q) => add(q.customerName));
  });
  return [...seen.values()].sort();
}
