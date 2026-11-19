import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/Authcontext';
import { canViewSanctioned } from '../models/Usermodel';
import { verifySanctionedAccess } from '../services/Authservice';
import { isUnlocked, unlock } from '../lib/sanctionedGate';
import { ACCENT, BODY, CANVAS, HAIR, MONO, MUTED, SANS } from '../theme/tokens';

const shell = {
  minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20,
  background: CANVAS, color: '#E7E1D5', fontFamily: BODY,
};
const card = {
  width: '100%', maxWidth: 380, padding: 24, borderRadius: 14,
  border: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.03)',
};

/**
 * Wraps the /sanctioned routes. Sits inside <RequireAuth>, so the user is
 * already signed in. On top of that they must (1) be allowed to see these
 * layouts and (2) type their password again for this area.
 */
export default function RequireSanctioned({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  if (!canViewSanctioned(user)) {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ fontFamily: SANS, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
            No access
          </div>
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
            This account is not allowed to open the sanctioned layouts. Ask an administrator.
          </p>
          <button type="button" onClick={() => navigate('/')} style={btn(false)}>Back</button>
        </div>
      </div>
    );
  }

  if (isUnlocked(user.uid)) return children;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await verifySanctionedAccess(user.uid, password);
      unlock(user.uid);
      setPassword('');
      bump((n) => n + 1);
    } catch (err) {
      setError(err?.message || 'Could not verify.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={shell}>
      <form onSubmit={submit} style={card}>
        <div style={{ fontFamily: SANS, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
          Sanctioned layouts
        </div>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
          Enter your password again to open this area.
        </p>
        <input
          type="password" autoFocus value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="current-password"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 8,
            border: `1px solid ${HAIR}`, background: 'rgba(0,0,0,0.25)', color: 'inherit',
            fontFamily: MONO, fontSize: 14,
          }}
        />
        {error && <p style={{ color: '#E0A33C', fontFamily: MONO, fontSize: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" onClick={() => navigate('/')} style={btn(false)}>Back</button>
          <button type="submit" disabled={busy || !password} style={btn(true)}>
            {busy ? 'Checking…' : 'Unlock'}
          </button>
        </div>
      </form>
    </div>
  );
}

function btn(primary) {
  return {
    flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${primary ? ACCENT : HAIR}`,
    background: primary ? ACCENT : 'none', color: primary ? '#1A1208' : MUTED,
    fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
  };
}
