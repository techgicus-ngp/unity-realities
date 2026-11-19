import { SQFT } from './units';
import { asPlotNo } from '../models/PlotData';
import { norm, ownerOf } from './customerPlots';

const collator = new Intl.Collator(undefined, { numeric: true });

export const num = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const sameName = (a, b) => norm(a) === norm(b);

const when = (q) => {
  const d = q.quotationDate;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
};

/** The newest quotation for this customer and plot number, if any. */
export function quoteFor(quotes, customer, plotName) {
  return quotes
    .filter((q) => sameName(q.customerName, customer) && asPlotNo(q.plotNumber) === plotName)
    .sort((a, b) => when(b) - when(a))[0] || null;
}

/** Plots of one customer in one layout (owner on the plot, or a quotation). */
export function plotsOf(layout, quotes, customer) {
  if (!layout) return [];
  const out = new Set();
  layout.byName.forEach((plot, name) => {
    if (sameName(ownerOf(plot), customer)) out.add(name);
  });
  quotes.forEach((q) => {
    const n = asPlotNo(q.plotNumber);
    if (sameName(q.customerName, customer) && layout.byName.has(n)) out.add(n);
  });
  return [...out].sort(collator.compare);
}

/** Same plot number pairs with the same number; the rest pair in order. */
export function autoPair(oldNames, newNames) {
  const pairs = [];
  const restNew = new Set(newNames);
  const restOld = [];
  oldNames.forEach((o) => {
    if (restNew.has(o)) { pairs.push({ o, n: o }); restNew.delete(o); } else restOld.push(o);
  });
  const leftNew = [...restNew];
  const len = Math.max(restOld.length, leftNew.length);
  for (let i = 0; i < len; i += 1) pairs.push({ o: restOld[i] || '', n: leftNew[i] || '' });
  return pairs.sort((a, b) => collator.compare(a.o || a.n, b.o || b.n));
}

/** What one side of a row knows: the drawn area and the quoted money. */
function side(layout, quotes, customer, name) {
  const plot = name && layout ? layout.byName.get(name) : null;
  if (!plot) return null;
  const q = quoteFor(quotes, customer, name);
  const qRate = q ? (q.ratePerSqFt || (q.plotSize ? q.totalPlotAmount / q.plotSize : 0)) : 0;
  return {
    name,
    sqft: plot.area * SQFT,
    quote: q,
    rate: qRate > 0 ? qRate : null,
    total: q && q.totalPlotAmount > 0 ? q.totalPlotAmount : null,
  };
}

const diff = (a, b) => (a != null && b != null ? b - a : null);

/**
 * One letter row per pair.
 *
 * `edits[i] = { o, n }` are rates typed over the top; blank means "use
 * what the data says".
 *   OLD amount = typed rate x area, else the quotation's total, else
 *                quoted rate x area.
 *   NEW rate   = typed, else the quotation made for the sanctioned plot,
 *                else the OLD rate (so the change is purely the area).
 * `source` records which of those applied, so the letter never presents a
 * guessed figure as a quoted one.
 */
export function buildRows(pairs, edits, old, nu) {
  return pairs.filter((p) => p.o || p.n).map((p, i) => {
    const o = side(old.layout, old.quotes, old.customer, p.o);
    const n = side(nu.layout, nu.quotes, nu.customer, p.n);
    const e = edits[i] || {};

    let oRate = null; let oTotal = null; let oSrc = 'none';
    if (o) {
      const typed = num(e.o);
      if (typed != null) { oRate = typed; oTotal = o.sqft * typed; oSrc = 'manual'; }
      else if (o.total != null) { oRate = o.rate; oTotal = o.total; oSrc = 'quotation'; }
      else if (o.rate != null) { oRate = o.rate; oTotal = o.sqft * o.rate; oSrc = 'quotation'; }
    }

    let nRate = null; let nTotal = null; let nSrc = 'none';
    if (n) {
      const typed = num(e.n);
      if (typed != null) { nRate = typed; nTotal = n.sqft * typed; nSrc = 'manual'; }
      else if (n.total != null) { nRate = n.rate; nTotal = n.total; nSrc = 'quotation'; }
      else if (oRate != null) { nRate = oRate; nTotal = n.sqft * oRate; nSrc = 'assumed'; }
    }

    return {
      oName: p.o, nName: p.n,
      oSqft: o ? o.sqft : null, nSqft: n ? n.sqft : null,
      oRate, oTotal, oSrc, nRate, nTotal, nSrc,
      dArea: diff(o && o.sqft, n && n.sqft),
      dRate: diff(oRate, nRate),
      dTotal: diff(oTotal, nTotal),
      pct: oTotal ? (diff(oTotal, nTotal) / oTotal) * 100 : null,
    };
  });
}

export function totalsOf(rows) {
  const sum = (f) => rows.reduce((a, r) => a + (f(r) || 0), 0);
  const oTotal = sum((r) => r.oTotal);
  const nTotal = sum((r) => r.nTotal);
  return {
    oArea: sum((r) => r.oSqft),
    nArea: sum((r) => r.nSqft),
    oTotal,
    nTotal,
    dTotal: nTotal - oTotal,
    pct: oTotal ? ((nTotal - oTotal) / oTotal) * 100 : null,
    /* false when any row lacks a price, so the totals would be partial */
    complete: rows.length > 0
      && rows.every((r) => r.oTotal != null && r.nTotal != null),
    assumed: rows.some((r) => r.nSrc === 'assumed'),
  };
}

export const fmtMoney = (v) => (v == null ? '—' : `₹ ${Math.round(v).toLocaleString('en-IN')}`);
export const fmtArea = (v) => (v == null ? '—' : v.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
export const fmtSigned = (v, f) => (v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${f(Math.abs(v))}`);
