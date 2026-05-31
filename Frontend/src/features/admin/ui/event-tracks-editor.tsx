import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { slugifyTitle } from "@/shared/lib/keywords.ts";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { PlusIcon, Trash2Icon } from "lucide-react";

export type TrackDraft = {
  key: string;
  id?: number;
  title: string;
  slug: string;
  keywords: string;
  description: string;
  team_limit: number;
  teams_registered?: number;
};

export function createEmptyTrack(): TrackDraft {
  return {
    key: crypto.randomUUID(),
    title: "",
    slug: "",
    keywords: "",
    description: "",
    team_limit: 10,
    teams_registered: 0,
  };
}

export function tracksFromApi(tracks: ApiSchemas["TrackPublic"][]): TrackDraft[] {
  return tracks.map((track) => ({
    key: String(track.id),
    id: track.id,
    title: track.title,
    slug: track.slug,
    keywords: track.keywords ?? "",
    description: track.description,
    team_limit: track.team_limit,
    teams_registered: track.teams_registered,
  }));
}

function resolveTrackSlug(track: TrackDraft, index: number, usedSlugs: Set<string>): string {
  const existing = track.slug.trim();
  if (existing) {
    usedSlugs.add(existing);
    return existing;
  }

  let base = slugifyTitle(track.title.trim()) || `case-${index + 1}`;
  let candidate = base;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  usedSlugs.add(candidate);
  return candidate;
}

function buildTrackPayloads(tracks: TrackDraft[]) {
  const usedSlugs = new Set<string>();
  return tracks
    .filter((track) => track.title.trim())
    .map((track, index) => ({
      ...(track.id != null ? { id: track.id } : {}),
      title: track.title.trim(),
      slug: resolveTrackSlug(track, index, usedSlugs),
      keywords: track.keywords.trim(),
      description: track.description.trim(),
      team_limit: track.team_limit,
    }));
}

export function tracksToCreatePayload(
  tracks: TrackDraft[],
): ApiSchemas["TrackCreate"][] {
  return buildTrackPayloads(tracks);
}

export function tracksToUpsertPayload(
  tracks: TrackDraft[],
): ApiSchemas["TrackUpsert"][] {
  return buildTrackPayloads(tracks);
}

type EventTracksEditorProps = {
  tracks: TrackDraft[];
  onChange: (tracks: TrackDraft[]) => void;
};

export function EventTracksEditor({ tracks, onChange }: EventTracksEditorProps) {
  const updateTrack = (key: string, patch: Partial<TrackDraft>) => {
    onChange(tracks.map((track) => (track.key === key ? { ...track, ...patch } : track)));
  };

  const removeTrack = (key: string) => {
    onChange(tracks.filter((track) => track.key !== key));
  };

  const canRemoveTrack = (track: TrackDraft) =>
    tracks.length > 1 && (track.teams_registered ?? 0) === 0;

  return (
    <div className="border-border space-y-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">Кейсы / направления</p>
          <p className="text-muted-foreground text-xs">
            Можно добавлять и редактировать кейсы. Удалить можно только кейс без
            зарегистрированных команд.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...tracks, createEmptyTrack()])}
        >
          <PlusIcon className="size-4" />
          Добавить кейс
        </Button>
      </div>

      {tracks.length === 0 ? (
        <p className="text-muted-foreground text-sm">Кейсов пока нет</p>
      ) : (
        tracks.map((track, index) => {
          const registered = track.teams_registered ?? 0;
          const minLimit = Math.max(1, registered);

          return (
            <div key={track.key} className="space-y-3 rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Кейс {index + 1}</p>
                  {registered > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      Зарегистрировано команд: {registered}
                    </p>
                  ) : null}
                </div>
                {canRemoveTrack(track) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTrack(track.key)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label>Название</Label>
                <Input
                  value={track.title}
                  onChange={(e) => updateTrack(track.key, { title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ключевые слова</Label>
                <Input
                  value={track.keywords}
                  placeholder="React, TypeScript, Python"
                  onChange={(e) => updateTrack(track.key, { keywords: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">Через запятую</p>
              </div>
              <div className="space-y-1">
                <Label>Описание</Label>
                <textarea
                  value={track.description}
                  rows={2}
                  onChange={(e) => updateTrack(track.key, { description: e.target.value })}
                  className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Лимит команд</Label>
                <Input
                  type="number"
                  min={minLimit}
                  value={track.team_limit}
                  onChange={(e) =>
                    updateTrack(track.key, {
                      team_limit: Math.max(minLimit, Number(e.target.value) || minLimit),
                    })
                  }
                />
                {registered > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Минимум: {registered} (по числу зарегистрированных команд)
                  </p>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
