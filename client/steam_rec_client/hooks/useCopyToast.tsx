import { useState, useCallback } from 'react';

export function useCopyToast(duration = 2000) {
  const [visible, setVisible] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setVisible(true);
      setTimeout(() => setVisible(false), duration);
    } catch {
      // fallback if clipboard fails
      console.error('Copy failed');
    }
  }, [duration]);

  return { copy, visible };
}