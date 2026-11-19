import { useEffect, useState } from 'react';
import { watchQuotations } from '../services/Quotationservice';

/**
 * Every saved quotation, live. A quotation is where a customer's rate and
 * price are recorded (plot documents carry neither), so the compare page
 * needs them both to find a customer's plots and to price the letter.
 *
 * `enabled` is false until the user is known to be signed in.
 */
export function useQuotations(enabled = true) {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    return watchQuotations(
      (list) => { setQuotes(list); setError(''); },
      (err) => setError(err?.message || 'Quotations could not be read.'),
    );
  }, [enabled]);

  return { quotes, error };
}
