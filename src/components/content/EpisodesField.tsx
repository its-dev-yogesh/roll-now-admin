import { Button, Input, TrashIcon } from "@/components/ui";
import type { Episode } from "@/types/catalog";

/** Editable episode list for shows (label, title, duration). */
export function EpisodesField({ episodes, onChange }: { episodes: Episode[]; onChange: (episodes: Episode[]) => void }) {
  const update = (index: number, patch: Partial<Episode>) => onChange(episodes.map((episode, i) => (i === index ? { ...episode, ...patch } : episode)));

  return (
    <div className="list">
      {episodes.map((episode, index) => (
        <div key={episode.id} className="list-row">
          <Input required aria-label="Episode label" value={episode.number} onChange={(event) => update(index, { number: event.target.value })} />
          <Input required aria-label="Episode title" placeholder="Title" value={episode.title} onChange={(event) => update(index, { title: event.target.value })} />
          <Input required aria-label="Duration" placeholder="41 min" value={episode.duration} onChange={(event) => update(index, { duration: event.target.value })} />
          <Button variant="ghost" small iconOnly aria-label="Remove episode" onClick={() => onChange(episodes.filter((_, i) => i !== index))}>
            <TrashIcon size={16} />
          </Button>
        </div>
      ))}
      <div>
        <Button
          small
          onClick={() =>
            onChange([...episodes, { id: `ep-${Date.now().toString(36)}`, number: `EPISODE ${episodes.length + 1}`, title: "", duration: "", progressPct: 0 }])
          }
        >
          Add episode
        </Button>
      </div>
    </div>
  );
}
