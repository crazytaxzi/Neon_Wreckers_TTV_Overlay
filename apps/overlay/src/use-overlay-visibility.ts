import { useCallback, useEffect, useRef, useState } from 'react';

export type OverlayVisibilityOptions = {
  tickerHoldSeconds: number;
  statusHoldSeconds: number;
  forceVisible?: boolean;
};

export function useOverlayVisibility(options: OverlayVisibilityOptions) {
  const [tickerAwake, setTickerAwake] = useState(true);
  const [statusAwake, setStatusAwake] = useState(true);
  const tickerTimer = useRef<number | undefined>(undefined);
  const statusTimer = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    if (tickerTimer.current !== undefined) window.clearTimeout(tickerTimer.current);
    if (statusTimer.current !== undefined) window.clearTimeout(statusTimer.current);
    tickerTimer.current = undefined;
    statusTimer.current = undefined;
  }, []);

  const wake = useCallback(() => {
    clearTimers();
    setTickerAwake(true);
    setStatusAwake(true);
    tickerTimer.current = window.setTimeout(() => setTickerAwake(false), Math.max(2, options.tickerHoldSeconds) * 1000);
    statusTimer.current = window.setTimeout(() => setStatusAwake(false), Math.max(2, options.statusHoldSeconds) * 1000);
  }, [clearTimers, options.statusHoldSeconds, options.tickerHoldSeconds]);

  useEffect(() => {
    wake();
    return clearTimers;
  }, [clearTimers, wake]);

  return {
    tickerAwake: Boolean(options.forceVisible || tickerAwake),
    statusAwake: Boolean(options.forceVisible || statusAwake),
    wake
  };
}
