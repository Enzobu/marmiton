import { useEffect, useState } from 'react';
import { privateImageUrl } from './api';

export function useAuthenticatedImage(source: string | null | undefined, isPrivate: boolean | undefined, token: string | null) {
  const [resolved, setResolved] = useState<{ source: string; url: string }>();
  useEffect(() => {
    if (!source || !isPrivate || !token) return;
    const controller = new AbortController();
    let blobUrl: string | undefined;
    privateImageUrl(source, token, controller.signal).then(url => {
      if (controller.signal.aborted) URL.revokeObjectURL(url);
      else { blobUrl = url; setResolved({ source, url }); }
    }).catch(() => {});
    return () => { controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [source, isPrivate, token]);
  return isPrivate ? resolved?.source === source ? resolved?.url ?? '' : '' : source ?? '';
}
