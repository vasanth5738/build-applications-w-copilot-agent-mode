import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      load={async () => {
        const payload = await getJson<{ activities: Activity[] }>('/api/activities');
        return payload.activities ?? [];
      }}
      emptyMessage="No activities available."
      renderItem={(activity) => (
        <>
          <span>{activity.type ?? 'Activity'}</span>
          <span className="ms-2 text-muted">{activity.minutes ?? 0} min</span>
          <span className="ms-2 text-muted">{activity.points ?? 0} pts</span>
        </>
      )}
    />
  );
}
