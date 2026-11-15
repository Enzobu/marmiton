import { useEffect, useState } from 'react';
import { apiRequest, authHeaders } from './api';

export type ShoppingItem = { id: string; name: string; amount: number | null; unit: string | null; checked: boolean };

export function planningRequest<T>(path: string, token: string, options: RequestInit = {}) {
  return apiRequest<T>(path, {
    ...options,
    headers: { ...authHeaders(token), ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
}

export function usePlanningData<T>(path: string, token: string) {
  const [result, setResult] = useState<{ path: string; data?: T; error?: boolean }>();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    planningRequest<T>(path, token, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ path, data });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ path, error: true });
    });
    return () => controller.abort();
  }, [path, token, revision]);

  return {
    data: result?.path === path ? result.data : undefined,
    error: result?.path === path && result.error,
    reload: () => { setResult(undefined); setRevision(value => value + 1); },
  };
}
