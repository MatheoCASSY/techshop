import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Status = 'loading' | 'up' | 'down';

const LABELS: Record<Status, string> = {
  loading: 'Connexion à l’API…',
  up: 'API connectée',
  down: 'API injoignable',
};

const COLORS: Record<Status, string> = {
  loading: 'bg-gray-400',
  up: 'bg-emerald-500',
  down: 'bg-red-500',
};

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ status: string }>('/health', { signal: controller.signal })
      .then((res) => setStatus(res.status === 'ok' ? 'up' : 'down'))
      .catch(() => {
        // Un abort (démontage du composant) n'est pas une panne
        if (!controller.signal.aborted) setStatus('down');
      });
    return () => controller.abort();
  }, []);

  return (
    <p role="status" className="inline-flex items-center gap-2 text-sm text-gray-600">
      <span aria-hidden="true" className={`size-2 rounded-full ${COLORS[status]}`} />
      {LABELS[status]}
    </p>
  );
}
