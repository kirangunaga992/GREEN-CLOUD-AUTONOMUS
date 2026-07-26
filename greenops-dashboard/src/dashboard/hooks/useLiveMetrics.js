import { useState, useEffect } from "react";
export default function useLiveMetrics(initial, variance = 5, interval = 3000) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(v => {
        const change = (Math.random() - 0.5) * variance;
        return Math.max(0, +(v + change).toFixed(2));
      });
    }, interval);
    return () => clearInterval(id);
  }, []);
  return value;
}
