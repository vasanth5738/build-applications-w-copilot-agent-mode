import { useEffect, useState } from 'react';

type Props<T> = {
  title: string;
  description: string;
  load: () => Promise<T[]>;
  emptyMessage: string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export function CapabilityCard<T>({ title, description, load, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    setStatus('loading');
    setErrorMessage('');

    load()
      .then((nextItems) => {
        if (!active) return;
        setItems(nextItems);
        setStatus(nextItems.length > 0 ? 'ready' : 'empty');
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load data.';
        setErrorMessage(message);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [load]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>

        {status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}. {errorMessage}</p>}
        {status === 'empty' && <p>{emptyMessage}</p>}
        {status === 'ready' && (
          <ul className="mb-0 list-unstyled">
            {items.map((item, index) => (
              <li key={index}>{renderItem(item, index)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
