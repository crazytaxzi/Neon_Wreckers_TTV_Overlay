import { useCallback, useEffect, useRef, useState } from 'react';
import { BoundedIdCache } from './bounded-id-cache.js';
import { MAX_HEADLINES, sortAndLimitHeadlines, type Headline } from './headlines.js';

export function useHeadlineQueue(rotationSeconds: number, onActivity: () => void) {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const knownIds = useRef(new BoundedIdCache({ maxEntries: 512, ttlMs: 6 * 60 * 60_000 }));

  const enqueue = useCallback((incoming: Headline | Headline[]) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    const fresh = list.filter(entry => knownIds.current.add(entry.id));
    if (!fresh.length) return;
    setHeadlines(current => sortAndLimitHeadlines([...fresh, ...current], MAX_HEADLINES));
    setActiveIndex(0);
    setTransitionKey(key => key + 1);
    onActivity();
  }, [onActivity]);

  useEffect(() => {
    if (headlines.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % headlines.length);
      setTransitionKey(key => key + 1);
    }, Math.max(3, rotationSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [headlines.length, rotationSeconds]);

  useEffect(() => {
    if (activeIndex >= headlines.length) setActiveIndex(0);
  }, [activeIndex, headlines.length]);

  return {
    headlines,
    activeIndex,
    transitionKey,
    current: headlines[activeIndex] ?? null,
    enqueue
  };
}
