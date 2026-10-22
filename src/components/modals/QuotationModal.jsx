
import React, {
  useEffect, useId, useMemo, useRef, useState,
} from 'react';
import { getAuth } from 'firebase/auth';
import Eyebrow from '../ui/Eyebrow';
import { SQFT, inr } from '../../lib/units';
import { ACCENT, HAIR, MONO, PANEL, SANS } from '../../theme/tokens';
import {
  derive, emptyForm, toDoc, toForm, userUid, serializeDates, num,
} from '../../lib/Quote';
import { createQuotation, updateQuotation } from '../../services/Quotationservice';
import { printQuotation } from '../../lib/quotationHtml';
import '../../styles/Quotationmodal.css';

const GREEN = '#8CC98F';
const GREEN_DIM = 'rgba(140,201,143,0.55)';

/* ── Auth helpers ─────────────────────────────────────────────────────────
   The `user` prop can be null while Firebase is still restoring the session,
   or can have a different shape (id / user.uid). Try the prop first, then fall
   back to the live Firebase Auth user. */
const uidOf = (u) => userUid(u) || u?.uid || u?.id || u?.user?.uid || '';

const resolveUser = (u) => {
  if (uidOf(u)) return u;
  try {
    const live = getAuth().currentUser;
    if (live?.uid) return live;
  } catch (e) { /* firebase not initialised */ }
  return u;
};

/* Local-time yyyy-MM-dd for <input type="date">. Never toISOString: in IST
   that turns a date into the previous day for half the day. */
const toDateValue = (v) => {
  if (!v) return '';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    const dmy = v.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }
  const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fmtDate = (d) => (d ? d.toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '—');

// ── Field building blocks (kept OUTSIDE the modal so focus survives typing)

function Field({
  label, name, value, onChange, type, mode, readOnly, autoComplete,
}) {
  return (
    <label className="qm-field">
      <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
      <input
        className={`qm-input${readOnly ? ' qm-input--readonly' : ''}`}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        type={type}
        inputMode={mode}
        autoComplete={autoComplete}
        readOnly={readOnly}
      />
    </label>
  );
}

function Derived({
  label, name, active, displayValue, onChange, onRelease,
}) {
  return (
    <label className="qm-field">
      <span className="qm-field-label-row">
        <Eyebrow style={{ marginBottom: 0 }}>{label}</Eyebrow>
        <button
          type="button"
          onClick={onRelease}
          disabled={!active}
          title="Back to the calculated value"
          className={`qm-auto-toggle${active ? ' is-active' : ''}`}
        >
          {active ? '↺ auto' : 'auto'}
        </button>
      </span>
      <input
        className="qm-input qm-input--auto"
        name={name}
        type="number"
        inputMode="decimal"
        value={displayValue ?? ''}
        onChange={onChange}
      />
    </label>
  );
}

function ReadonlyAuto({ label, value, title }) {
  return (
    <label className="qm-field">
      <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
      <input
        className="qm-input qm-input--auto qm-input--dim"
        value={Number.isFinite(value) ? Math.round(value) : ''}
        readOnly
        title={title}
      />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="qm-section">
      <div className="qm-section-title">{title}</div>
      {children}
    </div>
  );
}

/* `auto` is optional: pass { active, onRelease } to get the "↺ auto" toggle. */
function DateField({
  label, name, value, onChange, auto,
}) {
  const ref = useRef(null);
  const id = useId();

  const open = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker !== 'function') return;
    try { el.showPicker(); } catch (e) { /* already open */ }
  };

  return (
    <div className="qm-field">
      {auto ? (
        <span className="qm-field-label-row">
          <label htmlFor={id}>
            <Eyebrow style={{ marginBottom: 0 }}>{label}</Eyebrow>
          </label>
          <button
            type="button"
            onClick={auto.onRelease}
            disabled={!auto.active}
            title="Back to the calculated date"
            className={`qm-auto-toggle${auto.active ? ' is-active' : ''}`}
          >
            {auto.active ? '↺ auto' : 'auto'}
          </button>
        </span>
      ) : (
        <label htmlFor={id}>
          <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
        </label>
      )}
      <span className="qm-date-wrap">
        <input
          ref={ref}
          id={id}
          className={`qm-input qm-input--date${auto ? ' qm-input--auto' : ''}`}
          type="date"
          name={name}
          value={toDateValue(value)}
          onChange={onChange}
          onClick={open}
        />
      </span>
    </div>
  );
}

export default function QuotationModal({
  plot, user, existing, map, projectName = '', onClose, onSaved,
}) {
  const areaSqft = plot ? Math.round(plot.area * SQFT) : 0;
  const project = (projectName || map?.name || '').trim();

  const [f, setF] = useState(() => (existing
    ? toForm(existing)
    : emptyForm({ plotNo: plot?.name || '', areaSqft, projectName: project })));
  const [saveState, setSaveState] = useState('idle');   // idle|saving|saved|failed
  const [err, setErr] = useState('');

  const d = useMemo(() => derive(f), [f]);
  const dialogRef = useRef(null);

  /* The project name can arrive after mount (map doc still loading).
     Fill it in, unless the user already typed or the record has its own. */
  const projectTouched = useRef(false);
  useEffect(() => {
    if (!project || projectTouched.current) return;
    setF((s) => {
      if (s.projectName && s.projectName.trim()) return s;
      return { ...s, projectName: project };
    });
  }, [project]);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus trap + Escape. MOUNT ONLY: re-running this would re-focus the
  // first field on every parent render and slam the date picker shut.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const getFocusable = () => Array.from(
      dialog.querySelectorAll(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), '
        + 'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    getFocusable()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setOverride = (k, flag) => (e) => setF((s) => ({
    ...s, [k]: e.target.value, [flag]: true,
  }));
  const release = (flag) => () => setF((s) => ({ ...s, [flag]: false }));

  const save = async () => {
    if (!(f.customerName || '').trim()) {
      setErr('Customer name is required.');
      return;
    }

    // Use the prop, or fall back to the live Firebase Auth user.
    const authUser = resolveUser(user);
    if (!uidOf(authUser)) {
      // eslint-disable-next-line no-console
      console.warn('[QuotationModal] no uid. user prop =', user,
        '| auth.currentUser =', (() => {
          try { return getAuth().currentUser; } catch (e) { return 'auth unavailable'; }
        })());
      setErr('Not signed in properly — reload the page and sign in before saving.');
      return;
    }
    setErr('');
    setSaveState('saving');

    const data = toDoc(f, d, authUser);

    /* editing keeps the original author */
    if (existing) {
      data.createdByUid = existing.createdByUid || data.createdByUid;
      data.createdByName = existing.createdByName || data.createdByName;
    }

    /* toDoc may read the uid through userUid(); make sure it is set. */
    if (!data.createdByUid) data.createdByUid = uidOf(authUser);
    if (!data.createdByName) {
      data.createdByName = authUser.displayName || authUser.name || authUser.email || '';
    }

    try {
      const payload = serializeDates(data);
      const id = existing?.id
        ? (await updateQuotation(existing.id, payload), existing.id)
        : await createQuotation(payload);
      setSaveState('saved');
      if (onSaved) onSaved({ ...data, id });
      setTimeout(() => setSaveState('idle'), 1600);
    } catch (e) {
      setSaveState('failed');
      setErr(e?.message || 'Firestore refused the write.');
    }
  };

  const print = () => {
    const ok = printQuotation({ ...toDoc(f, d, resolveUser(user)), id: existing?.id });
    if (!ok) setErr('The print window was blocked. Allow pop-ups for this site.');
  };

  const lines = [
    ['Total payment', inr(d.total)],
    [`Down payment (${num(f.downPaymentPercent)}%)`, inr(d.down)],
    ['Balance payment', inr(d.balance)],
    [`EMI (${d.months} months)`, inr(d.emi)],
    [`First EMI (every ${d.day}th)`, fmtDate(d.firstEmi)],
    ['Last EMI', fmtDate(d.lastEmi)],
    ['Sale deed date', fmtDate(d.saleDeed)],
  ];

  const saveLabel = {
    idle: existing ? 'Update quotation' : 'Save quotation',
    saving: 'Saving…', saved: 'Saved', failed: 'Try again',
  }[saveState];

  return (
    <div onClick={onClose} role="presentation" className="qm-overlay">
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Quotation for plot ${f.plotNumber}`}
        className="qm-dialog"
        style={{
          '--qm-accent': ACCENT,
          '--qm-hair': HAIR,
          '--qm-panel': PANEL,
          '--qm-mono': MONO,
          '--qm-sans': SANS,
          '--qm-green': GREEN,
          '--qm-green-dim': GREEN_DIM,
        }}
      >
        <Eyebrow>Quotation</Eyebrow>
        <div className="qm-title">
          PLOT {f.plotNumber || '—'}
          {f.plotSize ? ` · ${Number(f.plotSize).toLocaleString('en-IN')} SQ FT` : ''}
        </div>

        <div className="qm-total">
          <span className="qm-total-label">Total payment</span>
          <span className="qm-total-value">{inr(d.total)}</span>
        </div>

        <Section title="Customer">
          <div className="qm-grid">
            <DateField
              label="Date"
              name="quotationDate"
              value={f.quotationDate}
              onChange={set('quotationDate')}
            />
            <Field
              label="Customer name"
              name="customerName"
              value={f.customerName}
              onChange={set('customerName')}
              autoComplete="name"
            />
          </div>
          <label className="qm-field" style={{ marginTop: 10 }}>
            <Eyebrow style={{ marginBottom: 5 }}>Address</Eyebrow>
            <textarea
              className="qm-input qm-textarea"
              name="address"
              autoComplete="street-address"
              value={f.address ?? ''}
              onChange={set('address')}
            />
          </label>
        </Section>

        <Section title="Property">
          <div className="qm-grid">
            <Field
              label="Project name"
              name="projectName"
              value={f.projectName}
              onChange={(e) => {
                projectTouched.current = true;
                set('projectName')(e);
              }}
            />
            <Field label="Mouza" name="mouza" value={f.mouza} onChange={set('mouza')} />
            <Field label="Khasra" name="khasra" value={f.khasra} onChange={set('khasra')} />
            <Field
              label="Plot no."
              name="plotNumber"
              value={f.plotNumber}
              onChange={set('plotNumber')}
              readOnly={!!plot}
            />
            <Field
              label="Sq ft"
              name="plotSize"
              value={f.plotSize}
              onChange={set('plotSize')}
              type="number"
              mode="decimal"
              readOnly={!!plot}
            />
          </div>
        </Section>

        <Section title="Payment">
          <div className="qm-grid">
            <Field
              label="Rate / sq ft"
              name="ratePerSqFt"
              value={f.ratePerSqFt}
              onChange={set('ratePerSqFt')}
              type="number"
              mode="decimal"
            />
            <Derived
              label="Total payment"
              name="totalPlotAmount"
              active={f.totalEdited}
              displayValue={f.totalEdited ? f.totalPlotAmount : Math.round(d.total)}
              onChange={setOverride('totalPlotAmount', 'totalEdited')}
              onRelease={release('totalEdited')}
            />
            <Field
              label="Down payment %"
              name="downPaymentPercent"
              value={f.downPaymentPercent}
              onChange={(e) => setF((s) => ({
                ...s, downPaymentPercent: e.target.value, downPaymentEdited: false,
              }))}
              type="number"
              mode="decimal"
            />
            <Derived
              label={`Down payment (${num(f.downPaymentPercent)}%)`}
              name="downPayment"
              active={f.downPaymentEdited}
              displayValue={f.downPaymentEdited ? f.downPayment : Math.round(d.down)}
              onChange={setOverride('downPayment', 'downPaymentEdited')}
              onRelease={release('downPaymentEdited')}
            />
            <ReadonlyAuto
              label="Balance payment"
              value={d.balance}
              title="Total payment − down payment"
            />
          </div>
        </Section>

        <Section title="EMI">
          <div className="qm-grid">
            <Field
              label="EMI months"
              name="emiMonths"
              value={f.emiMonths}
              onChange={set('emiMonths')}
              type="number"
              mode="numeric"
            />
            <Field
              label="EMI date (day of month)"
              name="emiDay"
              value={f.emiDay}
              onChange={set('emiDay')}
              type="number"
              mode="numeric"
            />
            <ReadonlyAuto label="EMI amount" value={d.emi} title="Balance ÷ months" />
            <DateField
              label="Sale deed date"
              name="saleDeedDate"
              value={f.saleDeedEdited ? f.saleDeedDate : d.saleDeed}
              onChange={setOverride('saleDeedDate', 'saleDeedEdited')}
              auto={{ active: f.saleDeedEdited, onRelease: release('saleDeedEdited') }}
            />
          </div>
        </Section>

        <div className="qm-lines">
          {lines.map(([l, v]) => (
            <div key={l} className="qm-line">
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
        </div>

        {err && <div className="qm-error" role="alert">{err}</div>}

        <div className="qm-actions">
          <button
            type="button"
            onClick={save}
            disabled={saveState === 'saving'}
            className={`qm-btn qm-btn--primary${saveState === 'saved' ? ' is-saved' : ''}`}
          >
            {saveLabel}
          </button>
          <button type="button" onClick={print} className="qm-btn qm-btn--outline">
            Print / PDF
          </button>
          <button type="button" onClick={onClose} className="qm-btn qm-btn--ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}