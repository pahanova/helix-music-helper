// src/app/useNarrow.js — viewport breakpoint hook (App uses 1024).

import { useState, useEffect } from 'react';

export function useNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [breakpoint]);
  return narrow;
}
