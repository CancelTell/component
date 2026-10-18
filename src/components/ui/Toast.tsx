'use client';

import { useCallback, useEffect, useState } from 'react';

/** Small status message at the bottom of the screen; disappears by itself */
export function useToast(duration = 2600) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), duration);
    return () => window.clearTimeout(t);
  }, [message, duration]);
  const show = useCallback((text: string) => setMessage(text), []);
  const node = (
    <div className="toast" role="status" aria-live="polite" data-visible={message ? true : undefined}>
      {message}
    </div>
  );
  return { show, node };
}
