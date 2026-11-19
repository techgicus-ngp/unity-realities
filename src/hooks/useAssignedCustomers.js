import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, deleteDoc, doc, onSnapshot, setDoc,
} from 'firebase/firestore';

/* ADJUST: wherever your app exports its Firestore instance. */
import {db} from '../firebase/config';

/**
 * Customers of the NOT-sanctioned layout, and which of them the user has
 * attached to a SANCTIONED plot.
 *
 *   nsLayout          layout of the not-sanctioned pane (from its onData)
 *   sanctionedMapId   map id of the sanctioned layout
 *
 * Returns
 *   customers   [{ id, oldPlot, name, phone, address }]  (picker list)
 *   assigned    { [sanctionedPlotName]: customer }
 *   onAssign    (plotName, customer | null)
 *
 * Stored at  maps/{sanctionedMapId}/assignedCustomers/{plotName}
 * so the link survives a reload and is shared by everyone on the project.
 */
export function useAssignedCustomers(nsLayout, sanctionedMapId) {
  const [assigned, setAssigned] = useState({});

  const customers = useMemo(() => {
    if (!nsLayout || !nsLayout.byName) return [];
    return [...nsLayout.byName.values()]
      .filter((p) => p.doc && String(p.doc.ownerName || '').trim())
      .map((p) => ({
        id: String(p.name),
        oldPlot: String(p.name),
        name: String(p.doc.ownerName).trim(),
        phone: String(p.doc.contactPhone || '').trim(),
        address: String(p.doc.address || '').trim(),   // ADJUST field name if different
      }));
  }, [nsLayout]);

  useEffect(() => {
    if (!sanctionedMapId) return undefined;
    const ref = collection(db, 'maps', sanctionedMapId, 'assignedCustomers');
    return onSnapshot(ref, (snap) => {
      const next = {};
      snap.forEach((d) => { next[d.id] = d.data(); });
      setAssigned(next);
    });
  }, [sanctionedMapId]);

  const onAssign = useCallback(async (plotName, customer) => {
    if (!sanctionedMapId) return;
    const ref = doc(db, 'maps', sanctionedMapId, 'assignedCustomers', String(plotName));
    if (customer) await setDoc(ref, customer);
    else await deleteDoc(ref);
  }, [sanctionedMapId]);

  return { customers, assigned, onAssign };
}