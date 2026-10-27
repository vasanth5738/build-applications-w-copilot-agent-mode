import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      load={async () => {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        return payload.leaderboard ?? [];
      }}
      emptyMessage="No leaderboard available."
      renderItem={(entry) => (
        <>
          <span>#{entry.rank ?? 0}</span>
          <span className="ms-2">{entry.teamName ?? 'Team'}</span>
          <span className="ms-2 text-muted">{entry.totalPoints ?? 0} pts</span>
        </>
      )}
    />
  );
}
