import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      load={async () => {
        const payload = await getJson<{ teams: Team[] }>('/api/teams');
        return payload.teams ?? [];
      }}
      emptyMessage="No teams available."
      renderItem={(team) => (
        <>
          <span>{team.name ?? 'Team'}</span>
          <span className="ms-2 text-muted">{team.members?.length ?? 0} members</span>
        </>
      )}
    />
  );
}
