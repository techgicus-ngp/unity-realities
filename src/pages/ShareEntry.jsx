import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import PlanPage from './PlanPage';
import { isProtectedMap } from '../config/site';

/** Public share link. Restricted maps cannot be shared. */
export default function ShareEntry() {
  const { mapId } = useParams();
  if (isProtectedMap(mapId)) return <Navigate to="/login" replace />;
  return <PlanPage share />;
}
