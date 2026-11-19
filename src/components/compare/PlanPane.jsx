// import React, {
//   useCallback, useEffect, useMemo, useRef, useState,
// } from 'react';

// import DetailPanel from '../panels/DetailPanel';
// import QuotationModal from '../modals/QuotationModal';
// import PlanMap from '../map/PlanMap';
// import { LayersIcon } from './icons';

// import { useMapLayout } from '../../hooks/useMapLayout';
// import { useAuth } from '../../context/Authcontext';
// import { plotsForCustomer } from '../../lib/customerPlots';
// import { CANVAS, HAIR, MONO, MUTED, SANS } from '../../theme/tokens';
// import {
//   GOLD, GOLD_LINE, INK, INK_SOFT, NAVY_2, NAVY_3,
// } from '../../theme/compare';

// /* PlanMap calls onReady() unguarded, so it must always be a function.
//    Module level, so its identity never changes. */
// const noop = () => {};

// const NO_RESERVE = { right: 0, bottom: 0 };

// const overlay = {
//   position: 'absolute', inset: 0, zIndex: 50, display: 'grid',
//   placeItems: 'center', background: CANVAS, fontFamily: MONO,
//   fontSize: 13, textAlign: 'center', padding: 24,
// };

// /**
//  * One layout inside the compare page: its own map, selection, plot panel
//  * and quotation. Nothing here is shared with the other pane except what
//  * the page hands down (the search text and the quotations).
//  *
//  *   data       { layout, status, title } is lifted to the page
//  *   matches    lifted too, for the hit chips under the search box
//  */
// export default function PlanPane({
//   mapId, spec, query, quotes, selected, onSelect, onMatches, onData,
// }) {
//   const { user } = useAuth();
//   const mapRef = useRef(null);
//   const [quoting, setQuoting] = useState(false);
//   const [reserve, setReserve] = useState(NO_RESERVE);

//   const { layout, status, setStatus, error, loading } = useMapLayout(mapId);
//   const title = layout ? layout.meta.title : '';

//   const matches = useMemo(
//     () => plotsForCustomer(layout, query, quotes),
//     [layout, query, quotes],
//   );

//   useEffect(() => { onMatches(matches); }, [matches, onMatches]);
//   useEffect(() => { onData({ layout, status, title }); }, [layout, status, title, onData]);

//   const selPlot = selected && layout ? layout.byName.get(selected) : null;
//   const selLL = selPlot ? layout.toLL(selPlot.c[0], selPlot.c[1]) : null;

//   /* a plot number that exists in the other layout only */
//   useEffect(() => {
//     if (selected && layout && !layout.byName.has(selected)) onSelect(null);
//   }, [selected, layout, onSelect]);

//   useEffect(() => { setQuoting(false); }, [selected]);

//   const pick = useCallback(
//     (name) => onSelect(!name || name === selected ? null : name),
//     [onSelect, selected],
//   );

//   /* DetailPanel measures its own footprint and reports it; PlanMap frames
//      the plot in what is left. Only a real change is stored, so a stream of
//      identical reports cannot re-render the map. */
//   const onReserve = useCallback((r) => {
//     setReserve((cur) => (
//       cur.right === (r.right || 0) && cur.bottom === (r.bottom || 0)
//         ? cur
//         : { right: r.right || 0, bottom: r.bottom || 0 }
//     ));
//   }, []);

//   const searching = query.trim().length > 0;

//   return (
//     <section
//       style={{
//         position: 'relative', minWidth: 0, minHeight: 0, display: 'flex',
//         flexDirection: 'column', overflow: 'hidden', background: CANVAS,
//         border: `1px solid ${GOLD_LINE}`, borderRadius: 14,
//         boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
//       }}
//     >
//       <header style={{
//         flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10,
//         padding: '10px 14px', minWidth: 0,
//         background: `linear-gradient(180deg, ${NAVY_3}, ${NAVY_2})`,
//         borderBottom: `1px solid ${GOLD_LINE}`,
//       }}>
//         <LayersIcon style={{ color: GOLD, flex: '0 0 auto' }} />
//         <div style={{
//           fontFamily: SANS, fontSize: 17, fontWeight: 600, letterSpacing: '0.07em',
//           textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap',
//           overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
//         }}>
//           Layout {spec.letter}
//           <span style={{ color: INK_SOFT }}> — </span>
//           <span style={{ color: GOLD }}>{title || spec.label}</span>
//         </div>
//         <span style={{
//           marginLeft: 'auto', flex: '0 0 auto', font: `500 11px/1 ${MONO}`,
//           color: spec.color, border: `1px solid ${spec.color}`, borderRadius: 999,
//           padding: '5px 9px', whiteSpace: 'nowrap',
//         }}>
//           {spec.label}
//         </span>
//         {searching && matches && (
//           <span style={{
//             flex: '0 0 auto', font: `600 11px/1 ${MONO}`, color: '#1A1208',
//             background: GOLD, borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap',
//           }}>
//             {matches.size} plot{matches.size === 1 ? '' : 's'}
//           </span>
//         )}
//       </header>

//       <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
//         {layout && (
//           <PlanMap
//             mapKey={`pane-${spec.letter}`}
//             layout={layout}
//             mapRef={mapRef}
//             selected={selected}
//             onSelect={pick}
//             highlight={matches}
//             status={status}
//             reserve={reserve}
//             onReady={noop}
//           />
           
//         )}

//         {searching && matches && (
//           <div style={{
//             position: 'absolute', top: 10, left: 14, zIndex: 8, pointerEvents: 'none',
//             display: 'flex', alignItems: 'center', gap: 12, maxWidth: 'calc(100% - 90px)',
//             padding: '8px 12px', borderRadius: 10,
//             background: 'rgba(10,18,38,0.88)', border: `1px solid ${GOLD_LINE}`,
//             font: `500 12px/1 ${MONO}`, color: INK, whiteSpace: 'nowrap',
//           }}>
//             <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
//               <i style={{ width: 13, height: 13, borderRadius: 3, background: GOLD, flex: '0 0 auto' }} />
//               <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                 Customer plot ({query.trim()})
//               </span>
//             </span>
//             <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: '0 0 auto' }}>
//               <i style={{
//                 width: 13, height: 13, borderRadius: 3, background: '#F1ECE2',
//                 border: `1px solid ${HAIR}`,
//               }} />
//               Available plot
//             </span>
//           </div>
//         )}

//         <DetailPanel
//           plot={selPlot}
//           status={status}
//           setStatus={setStatus}
//           latLng={selLL}
//           onClose={() => onSelect(null)}
//           onQuote={() => setQuoting(true)}
//           onReserve={onReserve}
//         />

//         {layout && error && (
//           <div style={{
//             position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 6,
//             fontFamily: MONO, fontSize: 11, color: '#E0A33C', textAlign: 'center',
//             pointerEvents: 'none',
//           }}>
//             {error}
//           </div>
//         )}

//         {loading && <div style={{ ...overlay, color: MUTED }}>Reading {spec.label.toLowerCase()} map…</div>}

//         {!loading && !layout && (
//           <div style={{ ...overlay, color: '#E0A33C' }}>
//             Nothing to draw for the {spec.label.toLowerCase()} layout.
//             {error ? <><br />{error}</> : null}
//           </div>
//         )}
//       </div>

//       {quoting && selPlot && (
//         <QuotationModal
//           plot={selPlot}
//           user={user}
//           projectName={title}
//           onClose={() => setQuoting(false)}
//         />
//       )}
//     </section>
//   );
// }





























































import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';

import DetailPanel from '../panels/DetailPanel';
import QuotationModal from '../modals/QuotationModal';
import PlanMap from '../map/PlanMap';
import { LayersIcon } from './icons';

import { useMapLayout } from '../../hooks/useMapLayout';
import { useAuth } from '../../context/Authcontext';
import { plotsForCustomer } from '../../lib/customerPlots';
import { CANVAS, HAIR, MONO, MUTED, SANS } from '../../theme/tokens';
import {
  GOLD, GOLD_LINE, INK, INK_SOFT, NAVY_2, NAVY_3,
} from '../../theme/compare';

/* PlanMap calls onReady() unguarded, so it must always be a function.
   Module level, so its identity never changes. */
const noop = () => {};

const NO_RESERVE = { right: 0, bottom: 0 };

const overlay = {
  position: 'absolute', inset: 0, zIndex: 50, display: 'grid',
  placeItems: 'center', background: CANVAS, fontFamily: MONO,
  fontSize: 13, textAlign: 'center', padding: 24,
};

/**
 * One layout inside the compare page: its own map, selection, plot panel
 * and quotation.
 *
 *   data       { layout, status, title } is lifted to the page
 *   matches    lifted too, for the hit chips under the search box
 *
 * CUSTOMER ASSIGNMENT (sanctioned pane only)
 *   canAssign  true only for the SANCTIONED pane
 *   customers  list built from the NOT-sanctioned layout
 *              [{ id, oldPlot, name, phone, address }]
 *   assigned   { [sanctionedPlotName]: customer }
 *   onAssign   (plotName, customer | null) => void
 *
 * The quotation always receives the SANCTIONED plot, so area, rate and
 * every total are calculated from the sanctioned plot, never the old one.
 */
export default function PlanPane({
  mapId, spec, query, quotes, selected, onSelect, onMatches, onData,
  canAssign = false, customers = null, assigned = null, onAssign = null,
}) {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [quoting, setQuoting] = useState(false);
  const [reserve, setReserve] = useState(NO_RESERVE);

  const { layout, status, setStatus, error, loading } = useMapLayout(mapId);
  const title = layout ? layout.meta.title : '';

  /* Search also finds a sanctioned plot through the customer assigned to
     it, so typing a customer's name lights up their NEW plot too. */
  const matches = useMemo(() => {
    const base = plotsForCustomer(layout, query, quotes);
    const q = (query || '').trim().toLowerCase();
    if (!canAssign || !assigned || !q) return base;
    const extra = Object.entries(assigned)
      .filter(([, c]) => c && `${c.name} ${c.phone}`.toLowerCase().includes(q))
      .map(([plotName]) => plotName);
    if (!extra.length) return base;
    return new Set([...(base || []), ...extra]);
  }, [layout, query, quotes, canAssign, assigned]);

  useEffect(() => { onMatches(matches); }, [matches, onMatches]);
  useEffect(() => { onData({ layout, status, title }); }, [layout, status, title, onData]);

  const selPlot = selected && layout ? layout.byName.get(selected) : null;
  const selLL = selPlot ? layout.toLL(selPlot.c[0], selPlot.c[1]) : null;
  const customer = canAssign && assigned && selected ? assigned[selected] || null : null;

  /* a plot number that exists in the other layout only */
  useEffect(() => {
    if (selected && layout && !layout.byName.has(selected)) onSelect(null);
  }, [selected, layout, onSelect]);

  useEffect(() => { setQuoting(false); }, [selected]);

  const pick = useCallback(
    (name) => onSelect(!name || name === selected ? null : name),
    [onSelect, selected],
  );

  /* DetailPanel measures its own footprint and reports it. */
  const onReserve = useCallback((r) => {
    setReserve((cur) => (
      cur.right === (r.right || 0) && cur.bottom === (r.bottom || 0)
        ? cur
        : { right: r.right || 0, bottom: r.bottom || 0 }
    ));
  }, []);

  /* No handler, no control: the not-sanctioned pane gets null here, so
     DetailPanel draws no "Add customer" at all. */
  const onAssignCustomer = useMemo(() => (
    canAssign && onAssign && selected
      ? (c) => onAssign(selected, c)
      : null
  ), [canAssign, onAssign, selected]);

  const searching = query.trim().length > 0;

  return (
    <section
      style={{
        position: 'relative', minWidth: 0, minHeight: 0, display: 'flex',
        flexDirection: 'column', overflow: 'hidden', background: CANVAS,
        border: `1px solid ${GOLD_LINE}`, borderRadius: 14,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}
    >
      <header style={{
        flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', minWidth: 0,
        background: `linear-gradient(180deg, ${NAVY_3}, ${NAVY_2})`,
        borderBottom: `1px solid ${GOLD_LINE}`,
      }}>
        <LayersIcon style={{ color: GOLD, flex: '0 0 auto' }} />
        <div style={{
          fontFamily: SANS, fontSize: 17, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: INK, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
        }}>
          Layout {spec.letter}
          <span style={{ color: INK_SOFT }}> — </span>
          <span style={{ color: GOLD }}>{title || spec.label}</span>
        </div>
        <span style={{
          marginLeft: 'auto', flex: '0 0 auto', font: `500 11px/1 ${MONO}`,
          color: spec.color, border: `1px solid ${spec.color}`, borderRadius: 999,
          padding: '5px 9px', whiteSpace: 'nowrap',
        }}>
          {spec.label}
        </span>
        {searching && matches && (
          <span style={{
            flex: '0 0 auto', font: `600 11px/1 ${MONO}`, color: '#1A1208',
            background: GOLD, borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap',
          }}>
            {matches.size} plot{matches.size === 1 ? '' : 's'}
          </span>
        )}
      </header>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {layout && (
          <PlanMap
            mapKey={`pane-${spec.letter}`}
            layout={layout}
            mapRef={mapRef}
            selected={selected}
            onSelect={pick}
            highlight={matches}
            status={status}
            reserve={reserve}
            onReady={noop}
          />
        )}

        {searching && matches && (
          <div style={{
            position: 'absolute', top: 10, left: 14, zIndex: 8, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: 12, maxWidth: 'calc(100% - 90px)',
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(10,18,38,0.88)', border: `1px solid ${GOLD_LINE}`,
            font: `500 12px/1 ${MONO}`, color: INK, whiteSpace: 'nowrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <i style={{ width: 13, height: 13, borderRadius: 3, background: GOLD, flex: '0 0 auto' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Customer plot ({query.trim()})
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: '0 0 auto' }}>
              <i style={{
                width: 13, height: 13, borderRadius: 3, background: '#F1ECE2',
                border: `1px solid ${HAIR}`,
              }} />
              Available plot
            </span>
          </div>
        )}

        <DetailPanel
          plot={selPlot}
          status={status}
          setStatus={setStatus}
          latLng={selLL}
          onClose={() => onSelect(null)}
          onQuote={() => setQuoting(true)}
          onReserve={onReserve}
          customer={customer}
          customers={canAssign ? customers : null}
          onAssignCustomer={onAssignCustomer}
        />

        {layout && error && (
          <div style={{
            position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 6,
            fontFamily: MONO, fontSize: 11, color: '#E0A33C', textAlign: 'center',
            pointerEvents: 'none',
          }}>
            {error}
          </div>
        )}

        {loading && <div style={{ ...overlay, color: MUTED }}>Reading {spec.label.toLowerCase()} map…</div>}

        {!loading && !layout && (
          <div style={{ ...overlay, color: '#E0A33C' }}>
            Nothing to draw for the {spec.label.toLowerCase()} layout.
            {error ? <><br />{error}</> : null}
          </div>
        )}
      </div>

      {quoting && selPlot && (
        <QuotationModal
          plot={selPlot}
          customer={customer}
          user={user}
          projectName={title}
          onClose={() => setQuoting(false)}
        />
      )}
    </section>
  );
}