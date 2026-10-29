// src/hooks/useNow.js
// React hook providing a live Date instance updating every 30 seconds.

import { useState, useEffect } from "react";

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export default useNow;

