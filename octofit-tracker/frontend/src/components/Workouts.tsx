import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      load={async () => {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        return payload.suggestions ?? [];
      }}
      emptyMessage="No workout suggestions available."
      renderItem={(suggestion) => (
        <>
          <span>{suggestion.title ?? 'Workout'}</span>
          {suggestion.reason ? <span className="ms-2 text-muted">{suggestion.reason}</span> : null}
        </>
      )}
    />
  );
}
