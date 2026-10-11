export type StickyKind = 'note' | 'todo';
export type StickyColor = 'blue' | 'white' | 'sand' | 'rose';
export type StickyItem = {
  id: string;
  text: string;
  completed_at: string | null;
  linked_note_id: string | null;
};
export type StickyNote = {
  id: string;
  user_id: string;
  kind: StickyKind;
  title: string;
  content: string;
  items: StickyItem[];
  image_paths: string[];
  color: StickyColor;
  pinned: boolean;
  collapsed: boolean;
  sort_order: number;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  mutation_id: string;
};
export type StickyDraft = {
  note: StickyNote;
  baseVersion: number | null;
  token: string;
  sentToken?: string;
};
export type StickyDrafts = Record<string, StickyDraft>;
export const STICKY_BUCKET = 'sticky-images';
export const STICKY_IMAGE_LIMIT = 8;
export const STICKY_IMAGE_BYTES = 5 * 1024 * 1024;

export function newStickyNote(
  userId: string,
  kind: StickyKind,
  order = Date.now(),
): StickyNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    kind,
    title: '',
    content: '',
    items: [],
    image_paths: [],
    color: 'blue',
    pinned: false,
    collapsed: false,
    sort_order: order,
    archived_at: null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    version: 0,
    mutation_id: crypto.randomUUID(),
  };
}

export function splitStickyItems(text: string): StickyItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      id: crypto.randomUUID(),
      text: line.slice(0, 2000),
      completed_at: null,
      linked_note_id: null,
    }));
}

export function moveStickyItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length ||
    from === to
  )
    return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function sortStickyNotes(notes: StickyNote[]): StickyNote[] {
  return [...notes].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      a.sort_order - b.sort_order ||
      a.id.localeCompare(b.id),
  );
}

export function stickyTime(value: string | null): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

// The server owns timestamps/version. Every update is a compare-and-swap of one paper.
export function stickyPayload(note: StickyNote, token: string) {
  return {
    kind: note.kind,
    title: note.title,
    content: note.content,
    items: note.items,
    image_paths: note.image_paths,
    color: note.color,
    pinned: note.pinned,
    collapsed: note.collapsed,
    sort_order: note.sort_order,
    archived_at: note.archived_at,
    deleted_at: note.deleted_at,
    mutation_id: token,
  };
}

export function reconcileStickyDraft(
  draft: StickyDraft,
  remote: StickyNote,
): { draft: StickyDraft | null; conflict: boolean } {
  if (remote.mutation_id === draft.token)
    return { draft: null, conflict: false };
  // A response may be lost after the server commits, while newer typing is still queued.
  if (draft.sentToken && remote.mutation_id === draft.sentToken)
    return {
      draft: { ...draft, baseVersion: remote.version, sentToken: undefined },
      conflict: false,
    };
  return { draft, conflict: draft.baseVersion !== remote.version };
}

export function safeStickyUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
