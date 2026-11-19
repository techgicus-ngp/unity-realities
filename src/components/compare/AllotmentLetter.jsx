import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { autoPair, buildRows, num, plotsOf } from '../../lib/allotment';
import { norm } from '../../lib/customerPlots';
import { ACCENT, CANVAS, HAIR, MONO, MUTED } from '../../theme/tokens';
import logo from '../../assets/logo.jpg';

/* ── LETTERHEAD ──────────────────────────────────────────────────────
   Copied from the printed Registry Statement. Each can be overridden in
   .env (VITE_COMPANY_ADDRESS, VITE_REGISTRATION_NO, ...). */
const env = import.meta.env;
const COMPANY = {
  name: env.VITE_COMPANY_NAME || 'Unity Realities',
  registration: env.VITE_REGISTRATION_NO || 'NG000007151',
  address: env.VITE_COMPANY_ADDRESS
    || 'Shop No.6, Pancham Apartment, Dixit Nagar Nari Road, Nagpur - 440026.',
  phone: env.VITE_COMPANY_PHONE || '8237766051',
  website: env.VITE_COMPANY_WEBSITE || 'www.unityrealities.in/com',
  invocation: env.VITE_INVOCATION || '॥ Om Sai Ram ॥',
};

/* The printed form's colours. */
const RED = '#C62828';
const BLUE = '#1E4FA3';
const ORANGE = '#F28C1E';
const INK = '#1B2A8A';          /* filled-in values, like the blue pen on the form */
const LABEL = '#1B1B1B';
const UP = '#B3261E';           /* the customer pays more */
const DOWN = '#1B7F3B';         /* the customer pays less */
const AREA = '#1A56A0';

/* Figures are written the way the printed form writes them. */
const rs = (v) => (v == null ? '' : `${Math.round(v).toLocaleString('en-IN')}/-`);
const sqft = (v) => (v == null ? '' : v.toFixed(2));
const rate = (v) => (v == null ? '' : (Math.round(v * 100) / 100).toLocaleString('en-IN'));

const stamp = (d) => {
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
};

/* Address and phone for the header: the customer's newest quotations
   first, then the plots themselves. Staff can correct both. */
function detailsFor(oldSide, newSide, customer, pairs) {
  const mine = [...oldSide.quotes, ...newSide.quotes]
    .filter((q) => norm(q.customerName) === norm(customer))
    .sort((a, b) => stamp(b.quotationDate) - stamp(a.quotationDate));

  const address = (mine.find((q) => q.address) || {}).address || '';
  let phone = (mine.find((q) => q.mobileNumber) || {}).mobileNumber || '';

  if (!phone) {
    pairs.some((p) => {
      const plots = [
        oldSide.layout && oldSide.layout.byName.get(p.o),
        newSide.layout && newSide.layout.byName.get(p.n),
      ];
      const hit = plots.find((pl) => pl && pl.doc && pl.doc.contactPhone);
      if (hit) phone = hit.doc.contactPhone;
      return !!hit;
    });
  }
  return { address, phone };
}

/* ── PIECES OF ONE STATEMENT PAGE ───────────────────────────────────── */

/* A label, then its value on a dotted line. An unknown value leaves the
   line empty, so a statement can still be finished by hand. */
function Line({
  label, children, color = INK, wide, cont,
}) {
  const hide = cont ? { visibility: 'hidden' } : undefined;
  return (
    <div className="rs-line">
      <span className={`rs-label${wide ? ' rs-wide' : ''}`} style={hide}>{cont ? 'x' : label}</span>
      <span className="rs-colon" style={hide}>:</span>
      <span className="rs-value" style={{ color }}>{children}</span>
    </div>
  );
}

/* "Net / Increase / Decrease": the word that applies is underlined, the
   way it is marked on the paper form. */
function Net({ up, down, children }) {
  const on = { color: RED, textDecoration: 'underline', textUnderlineOffset: 3 };
  return (
    <span className="rs-label">
      Net / <span style={up ? on : undefined}>Increase</span>
      {' / '}<span style={down ? on : undefined}>Decrease</span> {children}
    </span>
  );
}

const signed = (v, text, color) => {
  if (v == null) return '';
  if (Math.abs(v) < 0.005) return 'No change';
  return <span style={{ color }}>{v > 0 ? '▲' : '▼'} {text}</span>;
};

/**
 * oldSide / newSide: { layout, quotes } — the layout and the quotations
 * already scoped to it by the page.
 */
export default function AllotmentLetter({
  customers, initialCustomer, autoPrint, oldSide, newSide, onClose,
}) {
  const [customer, setCustomer] = useState(initialCustomer || customers[0] || '');
  const [pairs, setPairs] = useState([]);
  const [edits, setEdits] = useState({});
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  /* the search can change under an open letter */
  useEffect(() => {
    if (!customers.includes(customer)) setCustomer(customers[0] || '');
  }, [customers, customer]);

  const oldNames = useMemo(
    () => plotsOf(oldSide.layout, oldSide.quotes, customer),
    [oldSide, customer],
  );
  const newNames = useMemo(
    () => plotsOf(newSide.layout, newSide.quotes, customer),
    [newSide, customer],
  );

  useEffect(() => {
    setPairs(autoPair(oldNames, newNames));
    setEdits({});
  }, [oldNames, newNames]);

  const found = useMemo(
    () => detailsFor(oldSide, newSide, customer, autoPair(oldNames, newNames)),
    [oldSide, newSide, customer, oldNames, newNames],
  );
  useEffect(() => { setAddress(found.address); setPhone(found.phone); }, [found]);

  /* "Download PDF": open the statements, then hand them to the print
     dialog, where Save as PDF is the destination. */
  useEffect(() => {
    if (!autoPrint) return undefined;
    const id = setTimeout(() => window.print(), 700);
    return () => clearTimeout(id);
  }, [autoPrint]);

  const rows = useMemo(
    () => buildRows(pairs, edits, { ...oldSide, customer }, { ...newSide, customer }),
    [pairs, edits, oldSide, newSide, customer],
  );

  const setPair = (i, key, value) => setPairs(
    (ps) => ps.map((p, j) => (j === i ? { ...p, [key]: value } : p)),
  );
  const setEdit = (i, key, value) => setEdits((e) => ({ ...e, [i]: { ...e[i], [key]: value } }));

  /* Final payment after registry: typed outright, else the new amount less
     what has been received, else left blank for the pen. */
  const finalFor = (r, i) => {
    const e = edits[i] || {};
    const typed = num(e.final);
    if (typed != null) return typed;
    const paid = num(e.paid);
    return paid != null && r.nTotal != null ? r.nTotal - paid : null;
  };

  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const sel = {
    font: `400 12px/1 ${MONO}`, color: '#E7E1D5', background: CANVAS,
    border: `1px solid ${HAIR}`, borderRadius: 8, padding: '8px 8px', minWidth: 0,
  };
  const btn = {
    font: `500 12px/1 ${MONO}`, color: '#E7E1D5', background: 'transparent',
    border: `1px solid ${HAIR}`, borderRadius: 8, padding: '9px 12px', cursor: 'pointer',
  };
  const grid = { display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' };

  const rateHint = (r, which) => {
    const v = which === 'o' ? r.oRate : r.nRate;
    const src = which === 'o' ? r.oSrc : r.nSrc;
    return v == null ? 'no rate' : `${Math.round(v).toLocaleString('en-IN')} (${src})`;
  };

  return createPortal(
    <div className="al-portal">
      <style>{`
        .al-portal { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.78);
          overflow: auto; padding: 14px; }

        .rs-page { position: relative; box-sizing: border-box; width: min(794px, 100%);
          min-height: 1060px; margin: 0 auto 18px; background: #fff; color: ${LABEL};
          padding: 30px 34px 40px; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
          box-shadow: 0 20px 50px rgba(0,0,0,.5); overflow: hidden; }
        .rs-top { position: absolute; top: 0; right: 0; width: 55%; height: 16px;
          background: linear-gradient(90deg, rgba(242,140,30,0), ${ORANGE}); }
        .rs-bottom { position: absolute; left: 0; right: 0; bottom: 0; height: 12px;
          background: linear-gradient(90deg, ${BLUE}, ${RED} 55%, ${ORANGE}); }
        .rs-mark { position: absolute; left: 50%; top: 52%; width: 62%;
          transform: translate(-50%, -50%); opacity: .07; pointer-events: none; }
        .rs-head { position: relative; display: flex; gap: 18px; align-items: flex-start;
          justify-content: space-between; }
        .rs-logo { height: 96px; width: auto; flex: 0 0 auto; display: block; }
        .rs-head-right { flex: 1 1 auto; min-width: 0; text-align: right; }
        .rs-invoke { color: ${RED}; font-size: 11px; text-align: center; font-weight: 600; }
        .rs-reg { font-weight: 800; font-size: 13px; margin: 2px 0 6px; }
        .rs-banner { display: inline-block; text-align: left; background: ${BLUE}; color: #fff;
          font-weight: 700; font-size: 12px; line-height: 1.45; padding: 7px 12px; border-radius: 6px; }
        .rs-titlerow { position: relative; display: flex; align-items: center;
          justify-content: center; margin: 18px 0 -22px; z-index: 2; }
        .rs-title { background: linear-gradient(180deg, #E53935, ${RED}); color: #fff;
          font-weight: 800; font-size: 26px; letter-spacing: .02em; padding: 8px 64px;
          border-radius: 24px; box-shadow: 0 2px 0 rgba(0,0,0,.12); }
        .rs-date { position: absolute; right: 0; top: -26px; color: ${INK}; font-weight: 700;
          font-size: 15px; }
        .rs-box { position: relative; border: 1.5px solid #9AA0A6; border-radius: 28px;
          padding: 40px 30px 22px; }
        .rs-line { display: flex; align-items: flex-end; gap: 8px; margin: 9px 0; min-width: 0; }
        .rs-label { font-weight: 800; font-size: 15px; white-space: pre; flex: 0 0 auto; }
        .rs-wide { min-width: 196px; }
        .rs-colon { font-weight: 800; flex: 0 0 auto; }
        .rs-value { flex: 1 1 auto; min-width: 40px; min-height: 22px; font-weight: 700;
          font-size: 16px; padding: 0 6px 1px; border-bottom: 1.5px dotted #555; text-align: center; }
        .rs-heading { color: ${RED}; font-weight: 800; font-size: 15.5px; letter-spacing: .01em;
          margin: 22px 0 6px; }
        .rs-two { display: grid; grid-template-columns: 1fr 1fr; column-gap: 26px; }
        .rs-sign { display: flex; justify-content: space-between; align-items: flex-end;
          gap: 16px; margin-top: 34px; }
        .rs-note { color: ${INK}; font-weight: 700; font-size: 16px; min-height: 24px; margin-top: 4px; }
        .rs-right { text-align: right; }
        .rs-foot { margin-top: 12px; font-size: 11px; color: #555; }

        @media (max-width: 640px) {
          .rs-page { padding: 22px 16px 34px; }
          .rs-head { flex-direction: column; }
          .rs-head-right { text-align: left; }
          .rs-two { grid-template-columns: 1fr; }
          .rs-title { font-size: 20px; padding: 7px 28px; }
          .rs-label { font-size: 13px; white-space: normal; }
          .rs-wide { min-width: 120px; }
        }

        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body > *:not(.al-portal) { display: none !important; }
          .al-portal { position: static !important; background: none !important;
            overflow: visible !important; padding: 0 !important; }
          .al-controls { display: none !important; }
          .rs-page { width: auto; min-height: 0; height: 279mm; margin: 0; box-shadow: none;
            break-after: page; page-break-after: always; padding: 8mm 10mm 14mm;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .rs-page:last-of-type { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* controls: never printed */}
      <div className="al-controls" style={{
        maxWidth: 794, margin: '0 auto 14px', padding: 12, display: 'grid', gap: 10,
        background: CANVAS, border: `1px solid ${HAIR}`, borderRadius: 12, color: '#E7E1D5',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...sel, flex: '1 1 200px' }} value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {customers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            type="button"
            style={{ ...btn, background: ACCENT, color: CANVAS, borderColor: ACCENT }}
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
          <button type="button" style={btn} onClick={onClose}>Close</button>
        </div>

        <div style={grid}>
          <input style={sel} placeholder="Customer address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input style={sel} placeholder="Customer contact no." value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
          One statement is printed per plot. Check each pairing and rate. Rates come from
          the customer’s saved quotations; type over one to change it. Where the new plot
          has no quotation, the old rate is applied to the new area. Anything left blank
          prints as an empty line to fill in by hand.
        </div>

        {pairs.map((p, i) => (
          <div key={i} style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: `1px solid ${HAIR}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>Statement {i + 1}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
              <select style={sel} value={p.o} onChange={(e) => setPair(i, 'o', e.target.value)}>
                <option value="">— none (old)</option>
                {oldSide.layout && [...oldSide.layout.byName.keys()].map((n) => (
                  <option key={n} value={n}>Old plot {n}</option>
                ))}
              </select>
              <span style={{ color: MUTED, fontFamily: MONO }}>→</span>
              <select style={sel} value={p.n} onChange={(e) => setPair(i, 'n', e.target.value)}>
                <option value="">— none (new)</option>
                {newSide.layout && [...newSide.layout.byName.keys()].map((n) => (
                  <option key={n} value={n}>New plot {n}</option>
                ))}
              </select>
            </div>
            {rows[i] && (
              <>
                <div style={grid}>
                  <input
                    style={sel} inputMode="decimal" placeholder={`Old rate: ${rateHint(rows[i], 'o')}`}
                    value={(edits[i] && edits[i].o) || ''}
                    onChange={(e) => setEdit(i, 'o', e.target.value)}
                  />
                  <input
                    style={sel} inputMode="decimal" placeholder={`New rate: ${rateHint(rows[i], 'n')}`}
                    value={(edits[i] && edits[i].n) || ''}
                    onChange={(e) => setEdit(i, 'n', e.target.value)}
                  />
                </div>
                <div style={grid}>
                  <input
                    style={sel} inputMode="decimal" placeholder="Amount received so far"
                    value={(edits[i] && edits[i].paid) || ''}
                    onChange={(e) => setEdit(i, 'paid', e.target.value)}
                  />
                  <input
                    style={sel} inputMode="decimal" placeholder="Final payable (overrides)"
                    value={(edits[i] && edits[i].final) || ''}
                    onChange={(e) => setEdit(i, 'final', e.target.value)}
                  />
                  <input
                    style={sel} inputMode="decimal" placeholder="Stamp duty charge"
                    value={(edits[i] && edits[i].stamp) || ''}
                    onChange={(e) => setEdit(i, 'stamp', e.target.value)}
                  />
                  <input
                    style={sel} placeholder="Note by signature (e.g. 6 month time period)"
                    value={(edits[i] && edits[i].note) || ''}
                    onChange={(e) => setEdit(i, 'note', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
        {!rows.length && (
          <div style={{ color: '#E0A33C', fontFamily: MONO, fontSize: 12 }}>
            No plots found for this customer in either layout.
          </div>
        )}
      </div>

      {/* the statements: one page per plot */}
      {rows.map((r, i) => {
        const e = edits[i] || {};
        const stampDuty = num(e.stamp);
        const areaUp = r.dArea != null && r.dArea > 0.005;
        const areaDown = r.dArea != null && r.dArea < -0.005;
        const amtUp = r.dTotal != null && r.dTotal > 0.5;
        const amtDown = r.dTotal != null && r.dTotal < -0.5;
        const assumed = r.nSrc === 'assumed' ? ' *' : '';

        return (
          <section className="rs-page" key={i}>
            <i className="rs-top" />
            <img className="rs-mark" src={logo} alt="" />

            <header className="rs-head">
              <img className="rs-logo" src={logo} alt={COMPANY.name} />
              <div className="rs-head-right">
                <div className="rs-invoke">{COMPANY.invocation}</div>
                <div className="rs-reg">Registration No. {COMPANY.registration}</div>
                <div className="rs-banner">
                  {COMPANY.address}<br />
                  Mob. No. {COMPANY.phone} | Website : {COMPANY.website}
                </div>
              </div>
            </header>

            <div className="rs-titlerow">
              <div className="rs-title">REGISTRY STATEMENT</div>
              <div className="rs-date">{date}</div>
            </div>

            <div className="rs-box">
              <Line wide label="Customer Name">{customer}</Line>
              <Line wide cont>&nbsp;</Line>
              <Line wide label="Customer Address">{address}</Line>
              <Line wide cont>&nbsp;</Line>
              <Line wide label="Customer Contact No.">{phone}</Line>

              <div className="rs-heading">CUSTOMER OLD PLOT STATEMENT</div>
              <div className="rs-two">
                <Line label="Plot Area">{sqft(r.oSqft)}</Line>
                <Line label="Rate">{rate(r.oRate)}</Line>
                <Line label="Plot No.">{r.oName}</Line>
                <Line label="Total Plot Amount">{rs(r.oTotal)}</Line>
              </div>

              <div className="rs-heading">AFTER SANCTIONING NEW PLOT FINAL STATEMENT</div>
              <div className="rs-two">
                <Line label="New Plot No.">{r.nName}</Line>
                <Line label="New Plot Area">{sqft(r.nSqft)}</Line>
                <Line label="Rate">{rate(r.nRate)}{assumed}</Line>
                <Line label="Total New Plot Amount">{rs(r.nTotal)}{assumed}</Line>
              </div>

              <div className="rs-heading">NEW PLOT PENDING AMOUNT</div>
              <div className="rs-line">
                <Net up={areaUp} down={areaDown}>Plot Area</Net>
                <span className="rs-colon">:</span>
                <span className="rs-value">
                  {signed(r.dArea, sqft(r.dArea == null ? null : Math.abs(r.dArea)), AREA)}
                </span>
              </div>
              <div className="rs-line">
                <Net up={amtUp} down={amtDown}>Plot Amount</Net>
                <span className="rs-colon">:</span>
                <span className="rs-value">
                  {signed(r.dTotal, rs(r.dTotal == null ? null : Math.abs(r.dTotal)), r.dTotal > 0 ? UP : DOWN)}
                </span>
              </div>
              <Line label="Final Payment Payable Amount After Registry">{rs(finalFor(r, i))}</Line>
              <Line label="Stamp Duty Charge">{rs(stampDuty)}</Line>

              <div className="rs-sign">
                <div>
                  <div className="rs-label">Customer Signature</div>
                  <div className="rs-note">{e.note || ''}</div>
                </div>
                <div className="rs-label rs-right">Authorised Signature</div>
              </div>

              {assumed && <div className="rs-foot">* New amount calculated at the old plot&apos;s rate.</div>}
            </div>

            <i className="rs-bottom" />
          </section>
        );
      })}
    </div>,
    document.body,
  );
}