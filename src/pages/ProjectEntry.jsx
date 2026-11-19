import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import PlanPage from './PlanPage';
import { isProtectedMap } from '../config/site';

/**
 * What /maps/:mapId opens: the normal single-layout page. A sanctioned or
 * not-sanctioned map is restricted and is sent to the gated area instead.
 */
export default function ProjectEntry() {
  const { mapId } = useParams();
  if (isProtectedMap(mapId)) return <Navigate to="/sanctioned" replace />;
  return <PlanPage />;
}
