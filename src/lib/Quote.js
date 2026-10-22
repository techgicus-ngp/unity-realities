// // lib/quote.js — the arithmetic behind a quotation, and nothing else.

// import { sessionUid, sessionUser } from './Session';

// /**
//  * The Flutter screen does this with sixteen TextEditingControllers, each
//  * listening to the others, guarded by an _isRecalculating flag to stop
//  * the listeners from re-entering. That guard exists because the inputs
//  * and the outputs live in the same mutable place.
//  *
//  * Here they don't. The form holds only what the user TYPED, and derive()
//  * computes everything else on each render. There is no recalculation
//  * step to guard, no ordering between fields, and no way for a computed
//  * value to drift out of step with the numbers it came from.
//  *
//  * Three fields are both computed AND editable — total, down payment and
//  * admin total. Each carries an "edited" flag: false means derive owns
//  * it, true means the user has taken it over. That is the whole of the
//  * override mechanism, and it's why the reset arrow just sets a flag back
//  * to false.
//  */

// const num = (v, d = 0) => {
//   const n = parseFloat(v);
//   return Number.isFinite(n) ? n : d;
// };

// export const AGREEMENT_PCT = 0.20;
// export const REG_CAP = 3000000;      // ₹30 lakh
// export const REG_PCT = 0.01;
// export const REG_FIXED = 30000;

// export const BOOKING_DEFAULT = 51000;
// export const MUTATION_DEFAULT = 15000;
// export const SOCIETY_DEFAULT = 13500;
// export const STAMP_PCT_DEFAULT = 6;

// /** The set of down-payment plans the UI offers. Kept in one place so the
//  *  <select> options and any validation can be built off the same list
//  *  instead of drifting out of sync. */
// export const DOWN_PAYMENT_OPTIONS = ['10%', '20%', '25%'];
// export const DOWN_PAYMENT_DEFAULT = '20%';

// /**
//  * The signed-in user's id, whatever reached this call.
//  *
//  * Three sources, in order of trust:
//  *   1. the object passed in — a screen that has the user should say so;
//  *   2. localStorage, via sessionUid();
//  *   3. nothing, which callers must treat as "not signed in".
//  *
//  * The fallback is here because the map opens QuotationModal without a
//  * user prop and has no reason to know about auth. Without it every
//  * quotation saved from the map went in with createdByUid: '' — a record
//  * that writes, prints, and then matches nobody's list query.
//  *
//  * All three sources produce the same string: the saraswati_user document
//  * id, which ensureSeedUser and registerEmployee also write into the
//  * document's own `uid` field.
//  */
// export const userUid = (user) => user?.uid || user?.id || sessionUid();

// /** 1% up to ₹30L, a flat ₹30,000 above it. */
// export const autoRegistration = (total) => (
//   total <= REG_CAP ? total * REG_PCT : REG_FIXED
// );

// /** yyyy-mm-dd for <input type="date">; '' for nothing. */
// export const dateIn = (d) => {
//   if (!d) return '';
//   const x = d.toDate ? d.toDate() : new Date(d);
//   if (Number.isNaN(x.getTime())) return '';
//   const p = (n) => String(n).padStart(2, '0');
//   return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
// };

// export const dateOut = (s) => (s ? new Date(`${s}T00:00:00`) : null);

// export function emptyForm({ plotNo = '', areaSqft = 0, projectName = '' } = {}) {
//   return {
//     customerName: '',
//     mobileNumber: '',
//     address: '',
//     projectName,
//     plotNumber: plotNo,
//     plotSize: areaSqft ? String(Math.round(areaSqft)) : '',
//     ratePerSqFt: '',
//     bookingAmount: String(BOOKING_DEFAULT),
//     downPaymentOption: DOWN_PAYMENT_DEFAULT,
//     downPayment: '',
//     stampDutyPercent: String(STAMP_PCT_DEFAULT),
//     mutation: String(MUTATION_DEFAULT),
//     societyCharges: String(SOCIETY_DEFAULT),
//     totalPlotAmount: '',
//     adminTotal: '',
//     quotationDate: dateIn(new Date()),
//     bookingDate: '',
//     downPaymentDate: '',
//     saleDeedDate: '',
//     totalEdited: false,
//     downPaymentEdited: false,
//     adminEdited: false,
//   };
// }

// /**
//  * Everything computed, in one pass, from what the user typed.
//  *
//  * downPaymentOption is a string like '10%' / '20%' / '25%'. Rather than
//  * enumerate each one in a ternary or switch — which silently mis-handles
//  * any option added later, as '25%' did when it fell through to the 20%
//  * branch of a two-way ternary — the percentage is parsed straight out of
//  * the string. Adding a fourth option to the <select> needs no change here.
//  */
// export function derive(f) {
//   const size = num(f.plotSize);
//   const rate = num(f.ratePerSqFt);
//   const booking = num(f.bookingAmount);
//   const sdPct = num(f.stampDutyPercent, STAMP_PCT_DEFAULT);
//   const mutation = num(f.mutation);
//   const society = num(f.societyCharges);

//   const total = f.totalEdited ? num(f.totalPlotAmount) : size * rate;
//   const agreement = total * AGREEMENT_PCT;

//   // parseFloat('25%') === 25, so this reads whatever percent string the
//   // option carries and falls back to the default only if it's unparseable.
//   const pct = num(f.downPaymentOption, num(DOWN_PAYMENT_DEFAULT)) / 100;
//   const autoDown = Math.max(0, total * pct);
//   const down = f.downPaymentEdited ? num(f.downPayment) : autoDown;

//   const balance = Math.max(0, total - booking - down);
//   const stampDuty = (total * sdPct) / 100;
//   const registration = autoRegistration(total);

//   const autoAdmin = stampDuty + registration + mutation + society;
//   const adminTotal = f.adminEdited ? num(f.adminTotal) : autoAdmin;

//   return {
//     total,
//     agreement,
//     booking,
//     autoDown,
//     down,
//     balance,
//     stampDutyPercent: sdPct,
//     stampDuty,
//     registration,
//     mutation,
//     society,
//     autoAdmin,
//     adminTotal,
//     finalTotal: total + adminTotal,
//   };
// }

// /**
//  * The Firestore shape. Keys match QuotationModel.toMap exactly, including
//  * `saleDeederDate` — the typo is the real field name, so correcting it
//  * here would hide every record the Flutter app has already written.
//  *
//  * Dates go in as JS Date objects; the SDK stores them as Timestamps, the
//  * same type the Flutter client writes.
//  *
//  * createdByUid is the whole basis of "my quotations": it is written here,
//  * filtered on by watchEmployeeQuotations, and compared against in the
//  * detail pages. If it is ever blank, the record is invisible everywhere.
//  * Callers must refuse to save when userUid() comes back empty — see
//  * QuotationModal.save.
//  *
//  * downPaymentOption is stored as its own field (alongside the numeric
//  * downPayment) so that reopening a record for editing can read back
//  * exactly which plan was chosen, rather than guessing it from the ratio
//  * of downPayment to totalPlotAmount — a guess that only ever covered two
//  * buckets and misclassifies a third. Older records saved before this
//  * field existed fall back to '20%' in fromDoc.
//  */
// export function toDoc(f, d, user) {
//   const stored = sessionUser();
//   return {
//     customerName: f.customerName.trim(),
//     mobileNumber: f.mobileNumber.trim(),
//     address: f.address.trim(),
//     projectName: f.projectName.trim(),
//     plotNumber: f.plotNumber.trim(),
//     plotSize: num(f.plotSize),
//     ratePerSqFt: num(f.ratePerSqFt),
//     totalPlotAmount: d.total,
//     bookingAmount: d.booking,
//     downPayment: d.down,
//     downPaymentOption: f.downPaymentOption,
//     loanAmount: d.balance,
//     stampDutyPercent: d.stampDutyPercent,
//     stampDutyAmount: d.stampDuty,
//     registrationPercent: 0,
//     registrationAmount: d.registration,
//     mutation: d.mutation,
//     societyCharges: d.society,
//     adminTotal: d.adminTotal,
//     finalTotalAmount: d.finalTotal,
//     quotationDate: dateOut(f.quotationDate) || new Date(),
//     bookingDate: dateOut(f.bookingDate),
//     downPaymentDate: dateOut(f.downPaymentDate),
//     saleDeederDate: dateOut(f.saleDeedDate),
//     createdByUid: userUid(user),
//     createdByName: user?.name || user?.displayName || stored?.name || '',
//   };
// }

// const asDate = (v) => {
//   if (!v) return null;
//   const x = v.toDate ? v.toDate() : new Date(v);
//   return Number.isNaN(x.getTime()) ? null : x;
// };

// /** Firestore record → the plain object the document renderer wants. */
// export function fromDoc(data, id) {
//   return {
//     id,
//     customerName: data.customerName || '',
//     mobileNumber: data.mobileNumber || '',
//     address: data.address || '',
//     projectName: data.projectName || '',
//     plotNumber: data.plotNumber || '',
//     plotSize: Number(data.plotSize) || 0,
//     ratePerSqFt: Number(data.ratePerSqFt) || 0,
//     totalPlotAmount: Number(data.totalPlotAmount) || 0,
//     bookingAmount: Number(data.bookingAmount) || 0,
//     downPayment: Number(data.downPayment) || 0,
//     // Older records were saved before this field existed; '20%' matches
//     // what toForm used to infer for anything that wasn't clearly 10%.
//     downPaymentOption: data.downPaymentOption || DOWN_PAYMENT_DEFAULT,
//     loanAmount: Number(data.loanAmount) || 0,
//     stampDutyPercent: Number(data.stampDutyPercent) || 0,
//     stampDutyAmount: Number(data.stampDutyAmount) || 0,
//     registrationAmount: Number(data.registrationAmount) || 0,
//     mutation: Number(data.mutation) || 0,
//     societyCharges: Number(data.societyCharges) || 0,
//     adminTotal: Number(data.adminTotal) || 0,
//     finalTotalAmount: Number(data.finalTotalAmount) || 0,
//     quotationDate: asDate(data.quotationDate) || new Date(),
//     bookingDate: asDate(data.bookingDate),
//     downPaymentDate: asDate(data.downPaymentDate),
//     saleDeederDate: asDate(data.saleDeederDate),
//     // createdByUid is the Flutter field; employeeId is what the older web
//     // records used. Read both so one list can show either.
//     //
//     // NOTE: this fallback is read-time only. A record whose stored
//     // createdByUid is empty still cannot be reached by
//     // watchEmployeeQuotations, because the where clause runs on the
//     // server against the stored field.
//     createdByUid: data.createdByUid || data.employeeId || '',
//     createdByName: data.createdByName || '',
//   };
// }

// /** An existing record back into form state, for editing. */
// export function toForm(q) {
//   return {
//     ...emptyForm(),
//     customerName: q.customerName,
//     mobileNumber: q.mobileNumber,
//     address: q.address,
//     projectName: q.projectName,
//     plotNumber: q.plotNumber,
//     plotSize: String(q.plotSize || ''),
//     ratePerSqFt: String(q.ratePerSqFt || ''),
//     bookingAmount: String(q.bookingAmount || 0),
//     downPayment: String(q.downPayment || 0),
//     stampDutyPercent: String(q.stampDutyPercent || STAMP_PCT_DEFAULT),
//     mutation: String(q.mutation || 0),
//     societyCharges: String(q.societyCharges || 0),
//     totalPlotAmount: String(q.totalPlotAmount || 0),
//     adminTotal: String(q.adminTotal || 0),
//     quotationDate: dateIn(q.quotationDate),
//     bookingDate: dateIn(q.bookingDate),
//     downPaymentDate: dateIn(q.downPaymentDate),
//     saleDeedDate: dateIn(q.saleDeederDate),
//     // Read directly from the stored field now (see toDoc/fromDoc) instead
//     // of inferring it from the ratio of downPayment to totalPlotAmount —
//     // that inference only ever distinguished two buckets and silently
//     // mislabels a 25% (or any other) record as '20%'.
//     downPaymentOption: q.downPaymentOption || DOWN_PAYMENT_DEFAULT,
//     /* A saved record's numbers are whatever was saved, not whatever the
//        formula would produce now — so the overrides start ON. Clearing an
//        override hands the field back to derive. */
//     totalEdited: true,
//     downPaymentEdited: true,
//     adminEdited: true,
//   };
// }







// // lib/quote.js — the arithmetic behind a quotation, and nothing else.

// import { sessionUid, sessionUser } from './Session';

// /**
//  * The form holds only what the user TYPED, and derive() computes everything
//  * else on each render. No recalculation step, no ordering between fields.
//  *
//  * Three fields are both computed AND editable — total, down payment and
//  * admin total. Each carries an "edited" flag: false means derive owns
//  * it, true means the user has taken it over. The reset arrow just sets
//  * a flag back to false.
//  */

// // FIX 4: strip commas so "1,50,000" parses as 150000, not 1.
// const num = (v, d = 0) => {
//   const n = parseFloat(String(v ?? '').replace(/,/g, ''));
//   return Number.isFinite(n) ? n : d;
// };

// export const AGREEMENT_PCT = 0.20;
// export const REG_CAP = 3000000;      // ₹30 lakh
// export const REG_PCT = 0.01;
// export const REG_FIXED = 30000;

// export const BOOKING_DEFAULT = 51000;
// export const MUTATION_DEFAULT = 15000;
// export const SOCIETY_DEFAULT = 13500;
// export const STAMP_PCT_DEFAULT = 6;

// export const DOWN_PAYMENT_OPTIONS = ['10%', '20%', '25%'];
// export const DOWN_PAYMENT_DEFAULT = '20%';

// /** The signed-in user's id: passed-in user, then localStorage, else ''. */
// export const userUid = (user) => user?.uid || user?.id || sessionUid();

// /** 1% up to ₹30L, a flat ₹30,000 above it. */
// export const autoRegistration = (total) => (
//   total <= REG_CAP ? total * REG_PCT : REG_FIXED
// );

// /** yyyy-mm-dd for <input type="date">; '' for nothing. */
// export const dateIn = (d) => {
//   if (!d) return '';
//   const x = d.toDate ? d.toDate() : new Date(d);
//   if (Number.isNaN(x.getTime())) return '';
//   const p = (n) => String(n).padStart(2, '0');
//   return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
// };

// export const dateOut = (s) => (s ? new Date(`${s}T00:00:00`) : null);

// export function emptyForm({ plotNo = '', areaSqft = 0, projectName = '' } = {}) {
//   return {
//     customerName: '',
//     mobileNumber: '',
//     address: '',
//     projectName,
//     plotNumber: plotNo,
//     plotSize: areaSqft ? String(Math.round(areaSqft)) : '',
//     ratePerSqFt: '',
//     bookingAmount: String(BOOKING_DEFAULT),
//     downPaymentOption: DOWN_PAYMENT_DEFAULT,
//     downPayment: '',
//     stampDutyPercent: String(STAMP_PCT_DEFAULT),
//     mutation: String(MUTATION_DEFAULT),
//     societyCharges: String(SOCIETY_DEFAULT),
//     totalPlotAmount: '',
//     adminTotal: '',
//     quotationDate: dateIn(new Date()),
//     bookingDate: '',
//     downPaymentDate: '',
//     saleDeedDate: '',
//     totalEdited: false,
//     downPaymentEdited: false,
//     adminEdited: false,
//   };
// }

// /** Everything computed, in one pass, from what the user typed. */
// export function derive(f) {
//   const size = num(f.plotSize);
//   const rate = num(f.ratePerSqFt);
//   const booking = num(f.bookingAmount);
//   // FIX 3: a cleared stamp duty field means 0%, not a silent jump to 6%.
//   // The 6% default is already pre-filled by emptyForm.
//   const sdPct = num(f.stampDutyPercent, 0);
//   const mutation = num(f.mutation);
//   const society = num(f.societyCharges);

//   const total = f.totalEdited ? num(f.totalPlotAmount) : size * rate;
//   const agreement = total * AGREEMENT_PCT;

//   // parseFloat('25%') === 25, so any percent string works.
//   const pct = num(f.downPaymentOption, num(DOWN_PAYMENT_DEFAULT)) / 100;
//   const autoDown = Math.max(0, total * pct);
//   const down = f.downPaymentEdited ? num(f.downPayment) : autoDown;

//   const balance = Math.max(0, total - booking - down);
//   const stampDuty = (total * sdPct) / 100;
//   const registration = autoRegistration(total);

//   const autoAdmin = mutation + society;
//   const adminTotal = f.adminEdited ? num(f.adminTotal) : autoAdmin;

//   return {
//     total,
//     agreement,
//     booking,
//     autoDown,
//     down,
//     balance,
//     stampDutyPercent: sdPct,
//     stampDuty,
//     registration,
//     mutation,
//     society,
//     autoAdmin,
//     adminTotal,
//     finalTotal: total + adminTotal + stampDuty + registration,
//   };
// }

// /* ── DATE SERIALISATION ───────────────────────────────────────────────── */
// const pad = (n, w = 2) => String(n).padStart(w, '0');

// /** Same shape as Dart's DateTime.toIso8601String() for a local time. */
// const isoLocal = (d) => (d instanceof Date && !Number.isNaN(d.getTime())
//   ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
//     + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
//   : null);

// const DATE_KEYS = ['quotationDate', 'bookingDate', 'downPaymentDate', 'saleDeederDate'];

// /** toDoc's output → what Firestore should hold. */
// export const serializeDates = (doc) => {
//   const out = { ...doc };
//   DATE_KEYS.forEach((k) => { out[k] = isoLocal(out[k]); });
//   return out;
// };

// /**
//  * The record shape. Keys match QuotationModel.toMap exactly, including
//  * the `saleDeederDate` typo (it is the real field name).
//  * Run the result through serializeDates() before writing.
//  * Callers must refuse to save when userUid() comes back empty.
//  */
// export function toDoc(f, d, user) {
//   const stored = sessionUser();
//   return {
//     customerName: f.customerName.trim(),
//     mobileNumber: f.mobileNumber.trim(),
//     address: f.address.trim(),
//     projectName: f.projectName.trim(),
//     plotNumber: f.plotNumber.trim(),
//     plotSize: num(f.plotSize),
//     ratePerSqFt: num(f.ratePerSqFt),
//     totalPlotAmount: d.total,
//     bookingAmount: d.booking,
//     downPayment: d.down,
//     downPaymentOption: f.downPaymentOption,
//     loanAmount: d.balance,
//     stampDutyPercent: d.stampDutyPercent,
//     stampDutyAmount: d.stampDuty,
//     registrationPercent: d.total <= REG_CAP ? REG_PCT * 100 : 0,
//     registrationAmount: d.registration,
//     mutation: d.mutation,
//     societyCharges: d.society,
//     adminTotal: d.adminTotal,
//     finalTotalAmount: d.finalTotal,
//     quotationDate: dateOut(f.quotationDate) || new Date(),
//     bookingDate: dateOut(f.bookingDate),
//     downPaymentDate: dateOut(f.downPaymentDate),
//     saleDeederDate: dateOut(f.saleDeedDate),
//     createdByUid: userUid(user),
//     createdByName: user?.name || user?.displayName || stored?.name || '',
//   };
// }

// const asDate = (v) => {
//   if (!v) return null;
//   const x = v.toDate ? v.toDate() : new Date(v);
//   return Number.isNaN(x.getTime()) ? null : x;
// };

// /** Which plan a record used, guessed from its numbers (old records). */
// const inferOption = (down, total) => {
//   if (!(down > 0) || !(total > 0)) return DOWN_PAYMENT_DEFAULT;
//   const pct = (down / total) * 100;
//   return DOWN_PAYMENT_OPTIONS.find((o) => Math.abs(parseFloat(o) - pct) < 0.5)
//     || DOWN_PAYMENT_DEFAULT;
// };

// /** Firestore record → the plain object the document renderer wants. */
// export function fromDoc(data, id) {
//   const total = Number(data.totalPlotAmount) || 0;
//   const down = Number(data.downPayment) || 0;
//   const stampAmt = Number(data.stampDutyAmount) || 0;
//   const regAmt = Number(data.registrationAmount) || 0;
//   const admin = Number(data.adminTotal) || 0;
//   return {
//     id,
//     customerName: data.customerName || '',
//     mobileNumber: data.mobileNumber || '',
//     address: data.address || '',
//     projectName: data.projectName || '',
//     plotNumber: data.plotNumber || '',
//     plotSize: Number(data.plotSize) || 0,
//     ratePerSqFt: Number(data.ratePerSqFt) || 0,
//     totalPlotAmount: total,
//     bookingAmount: Number(data.bookingAmount) || 0,
//     downPayment: down,
//     downPaymentOption: data.downPaymentOption || inferOption(down, total),
//     loanAmount: Number(data.loanAmount) || 0,
//     stampDutyPercent: Number(data.stampDutyPercent) || 0,
//     stampDutyAmount: stampAmt,
//     registrationAmount: regAmt,
//     mutation: Number(data.mutation) || 0,
//     societyCharges: Number(data.societyCharges) || 0,
//     adminTotal: admin,
//     // FIX 1: if the stored final total is missing/0, rebuild it from the parts.
//     finalTotalAmount:
//       Number(data.finalTotalAmount) || (total + admin + stampAmt + regAmt),
//     quotationDate: asDate(data.quotationDate) || new Date(),
//     bookingDate: asDate(data.bookingDate),
//     downPaymentDate: asDate(data.downPaymentDate),
//     saleDeederDate: asDate(data.saleDeederDate),
//     // Read-time fallback only; see watchEmployeeQuotations.
//     createdByUid: data.createdByUid || data.employeeId || '',
//     createdByName: data.createdByName || '',
//   };
// }

// /** An existing record back into form state, for editing. */
// export function toForm(q) {
//   return {
//     ...emptyForm(),
//     customerName: q.customerName,
//     mobileNumber: q.mobileNumber,
//     address: q.address,
//     projectName: q.projectName,
//     plotNumber: q.plotNumber,
//     plotSize: String(q.plotSize || ''),
//     ratePerSqFt: String(q.ratePerSqFt || ''),
//     bookingAmount: String(q.bookingAmount || 0),
//     downPayment: String(q.downPayment || 0),
//     // FIX 3: ?? keeps a saved 0% instead of turning it into 6%.
//     stampDutyPercent: String(q.stampDutyPercent ?? STAMP_PCT_DEFAULT),
//     mutation: String(q.mutation || 0),
//     societyCharges: String(q.societyCharges || 0),
//     totalPlotAmount: String(q.totalPlotAmount || 0),
//     adminTotal: String(q.adminTotal || 0),
//     quotationDate: dateIn(q.quotationDate),
//     bookingDate: dateIn(q.bookingDate),
//     downPaymentDate: dateIn(q.downPaymentDate),
//     saleDeedDate: dateIn(q.saleDeederDate),
//     downPaymentOption: q.downPaymentOption || DOWN_PAYMENT_DEFAULT,
//     /* FIX 2: a saved record's numbers are what was saved, so overrides start
//        ON. If you want edits to plot size/rate to recalculate on reopen, set
//        totalEdited / downPaymentEdited / adminEdited to false instead. */
//     totalEdited: true,
//     downPaymentEdited: true,
//     adminEdited: true,
//   };
// }












// lib/quote.js — the arithmetic behind a quotation, and nothing else.

import { sessionUid, sessionUser } from './Session';

/* strip commas so "1,50,000" parses as 150000, not 1 */
export const num = (v, d = 0) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : d;
};

/* ── Defaults ─────────────────────────────────────────────────────── */
export const DOWN_PERCENT_DEFAULT = 20;
export const EMI_MONTHS_DEFAULT = 35;
export const EMI_DAY_DEFAULT = 20;

/* legacy exports, kept so other files that import them don't break */
export const AGREEMENT_PCT = 0.20;
export const REG_CAP = 3000000;
export const REG_PCT = 0.01;
export const REG_FIXED = 30000;
export const BOOKING_DEFAULT = 51000;
export const MUTATION_DEFAULT = 15000;
export const SOCIETY_DEFAULT = 13500;
export const STAMP_PCT_DEFAULT = 6;
export const DOWN_PAYMENT_OPTIONS = ['10%', '20%', '25%'];
export const DOWN_PAYMENT_DEFAULT = '20%';
export const autoRegistration = (total) => (
  total <= REG_CAP ? total * REG_PCT : REG_FIXED
);

export const userUid = (user) => user?.uid || user?.id || sessionUid();

/* ── Dates (local time only; toISOString shifts a day in IST) ─────── */
export const dateIn = (d) => {
  if (!d) return '';
  const x = d.toDate ? d.toDate() : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
};

export const dateOut = (s) => (s ? new Date(`${s}T00:00:00`) : null);

/* `offset` months after `base`, on a fixed day, clamped to the month's
   length (day 31 in February becomes 28/29, not 3 March) */
export const monthOnDay = (base, offset, day) => {
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(day, last));
};

/* ── Form ─────────────────────────────────────────────────────────── */
export function emptyForm({ plotNo = '', areaSqft = 0, projectName = '' } = {}) {
  return {
    quotationDate: dateIn(new Date()),
    customerName: '',
    address: '',
    mouza: '',
    khasra: '',
    plotNumber: plotNo,
    plotSize: areaSqft ? String(Math.round(areaSqft)) : '',
    projectName,
    ratePerSqFt: '',
    totalPlotAmount: '',
    downPaymentPercent: String(DOWN_PERCENT_DEFAULT),
    downPayment: '',
    emiMonths: String(EMI_MONTHS_DEFAULT),
    emiDay: String(EMI_DAY_DEFAULT),
    saleDeedDate: '',
    totalEdited: false,
    downPaymentEdited: false,
    saleDeedEdited: false,
  };
}

/**
 * total     = size × rate                 (or typed override)
 * down      = total × down%               (or typed override)
 * balance   = total − down
 * emi       = balance ÷ months
 * first EMI = month after the quotation date, on emiDay
 * last EMI  = first EMI + (months − 1) months
 * sale deed = last EMI                    (or typed override)
 */
export function derive(f) {
  const total = f.totalEdited
    ? num(f.totalPlotAmount)
    : num(f.plotSize) * num(f.ratePerSqFt);
  const autoDown = Math.max(0, (total * num(f.downPaymentPercent)) / 100);
  const down = f.downPaymentEdited ? num(f.downPayment) : autoDown;
  const balance = Math.max(0, total - down);

  const months = Math.max(1, Math.floor(num(f.emiMonths)) || 1);
  const day = Math.min(31, Math.max(1, Math.floor(num(f.emiDay)) || EMI_DAY_DEFAULT));
  const emi = balance / months;

  const base = dateOut(f.quotationDate) || new Date();
  const firstEmi = monthOnDay(base, 1, day);
  const lastEmi = monthOnDay(base, months, day);
  const saleDeed = f.saleDeedEdited ? dateOut(f.saleDeedDate) : lastEmi;

  return {
    total, autoDown, down, balance, months, day, emi,
    firstEmi, lastEmi, saleDeed,
  };
}

/* ── Date serialisation ───────────────────────────────────────────── */
const pad = (n, w = 2) => String(n).padStart(w, '0');

const isoLocal = (d) => (d instanceof Date && !Number.isNaN(d.getTime())
  ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  : null);

const DATE_KEYS = [
  'quotationDate', 'bookingDate', 'downPaymentDate', 'saleDeederDate',
  'firstEmiDate', 'lastEmiDate',
];

export const serializeDates = (doc) => {
  const out = { ...doc };
  DATE_KEYS.forEach((k) => { if (k in out) out[k] = isoLocal(out[k]); });
  return out;
};

/* ── Record shape ─────────────────────────────────────────────────────
   Old keys are reused where the meaning is the same (totalPlotAmount,
   downPayment, loanAmount = balance, saleDeederDate) so the existing
   list and Flutter app keep working. finalTotalAmount is the total, so
   anything that still shows it shows something sensible. */
export function toDoc(f, d, user) {
  const stored = sessionUser();
  return {
    customerName: (f.customerName || '').trim(),
    address: (f.address || '').trim(),
    mouza: (f.mouza || '').trim(),
    khasra: (f.khasra || '').trim(),
    projectName: (f.projectName || '').trim(),
    plotNumber: (f.plotNumber || '').trim(),
    plotSize: num(f.plotSize),
    ratePerSqFt: num(f.ratePerSqFt),
    totalPlotAmount: Math.round(d.total),
    downPaymentPercent: num(f.downPaymentPercent),
    downPayment: Math.round(d.down),
    loanAmount: Math.round(d.balance),          // balance payment
    emiMonths: d.months,
    emiDay: d.day,
    emiAmount: Math.round(d.emi),
    finalTotalAmount: Math.round(d.total),
    quotationDate: dateOut(f.quotationDate) || new Date(),
    firstEmiDate: d.firstEmi,
    lastEmiDate: d.lastEmi,
    saleDeederDate: d.saleDeed,                 // real field name, typo and all
    totalEdited: !!f.totalEdited,
    downPaymentEdited: !!f.downPaymentEdited,
    saleDeedEdited: !!f.saleDeedEdited,
    createdByUid: userUid(user),
    createdByName: user?.name || user?.displayName || stored?.name || '',
  };
}

const asDate = (v) => {
  if (!v) return null;
  const x = v.toDate ? v.toDate() : new Date(v);
  return Number.isNaN(x.getTime()) ? null : x;
};

/** Firestore record → plain object for lists and the printout. */
export function fromDoc(data, id) {
  const total = Number(data.totalPlotAmount) || 0;
  const down = Number(data.downPayment) || 0;
  const balance = Number(data.loanAmount) || 0;
  return {
    id,
    customerName: data.customerName || '',
    mobileNumber: data.mobileNumber || '',          // old records only
    address: data.address || '',
    mouza: data.mouza || '',
    khasra: data.khasra || '',
    projectName: data.projectName || '',
    plotNumber: data.plotNumber || '',
    plotSize: Number(data.plotSize) || 0,
    ratePerSqFt: Number(data.ratePerSqFt) || 0,
    totalPlotAmount: total,
    downPayment: down,
    downPaymentPercent: data.downPaymentPercent != null
      ? Number(data.downPaymentPercent)
      : (total > 0 && down > 0 ? Math.round((down / total) * 100) : DOWN_PERCENT_DEFAULT),
    loanAmount: balance,
    balanceAmount: balance,
    emiMonths: Number(data.emiMonths) || EMI_MONTHS_DEFAULT,
    emiDay: Number(data.emiDay) || EMI_DAY_DEFAULT,
    emiAmount: Number(data.emiAmount) || 0,
    finalTotalAmount: Number(data.finalTotalAmount) || total,
    quotationDate: asDate(data.quotationDate) || new Date(),
    firstEmiDate: asDate(data.firstEmiDate),
    lastEmiDate: asDate(data.lastEmiDate),
    saleDeederDate: asDate(data.saleDeederDate),
    totalEdited: data.totalEdited,
    downPaymentEdited: data.downPaymentEdited,
    saleDeedEdited: data.saleDeedEdited,
    createdByUid: data.createdByUid || data.employeeId || '',
    createdByName: data.createdByName || '',
  };
}

/** An existing record back into form state, for editing. */
export function toForm(q) {
  return {
    ...emptyForm(),
    quotationDate: dateIn(q.quotationDate),
    customerName: q.customerName,
    address: q.address,
    mouza: q.mouza || '',
    khasra: q.khasra || '',
    projectName: q.projectName,
    plotNumber: q.plotNumber,
    plotSize: String(q.plotSize || ''),
    ratePerSqFt: String(q.ratePerSqFt || ''),
    totalPlotAmount: String(q.totalPlotAmount || 0),
    downPaymentPercent: String(q.downPaymentPercent ?? DOWN_PERCENT_DEFAULT),
    downPayment: String(q.downPayment || 0),
    emiMonths: String(q.emiMonths ?? EMI_MONTHS_DEFAULT),
    emiDay: String(q.emiDay ?? EMI_DAY_DEFAULT),
    saleDeedDate: dateIn(q.saleDeederDate),
    /* old records have no flags: keep their saved numbers as overrides */
    totalEdited: q.totalEdited ?? true,
    downPaymentEdited: q.downPaymentEdited ?? true,
    saleDeedEdited: q.saleDeedEdited ?? !!q.saleDeederDate,
  };
}