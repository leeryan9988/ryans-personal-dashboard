'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from './supabase';
import {
  newStickyNote,
  reconcileStickyDraft,
  sortStickyNotes,
  stickyPayload,
  type StickyDrafts,
  type StickyKind,
  type StickyNote,
} from './sticky-notes';

export function useStickyNotes(userId: string) {
  const key = `ryan-sticky-drafts-v1:${userId}`;
  const [cloud, setCloud] = useState<Record<string, StickyNote>>({});
  const [drafts, setDrafts] = useState<StickyDrafts>({});
  const draftsRef = useRef<StickyDrafts>({});
  const cloudRef = useRef<Record<string, StickyNote>>({});
  const [conflicts, setConflicts] = useState<Record<string, StickyNote | null>>(
    {},
  );
  const conflictsRef = useRef<Record<string, StickyNote | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const alive = useRef(true);
  const locks = useRef(new Set<string>());
  const epoch = useRef(0);

  const store = useCallback(
    (next: StickyDrafts) => {
      draftsRef.current = next;
      if (alive.current) setDrafts(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
        if (alive.current) setStorageError('');
      } catch {
        if (alive.current)
          setStorageError(
            '本机草稿保存失败（浏览器存储不可用或已满）。请保持页面打开并连接网络完成同步。',
          );
      }
    },
    [key],
  );

  const putCloud = useCallback((note: StickyNote) => {
    if ((cloudRef.current[note.id]?.version ?? -1) > note.version) return;
    cloudRef.current = { ...cloudRef.current, [note.id]: note };
    if (alive.current) setCloud(cloudRef.current);
  }, []);

  const markConflict = useCallback((id: string, remote: StickyNote | null) => {
    conflictsRef.current = { ...conflictsRef.current, [id]: remote };
    if (alive.current) setConflicts(conflictsRef.current);
  }, []);

  const acceptRemote = useCallback(
    (remote: StickyNote) => {
      if ((cloudRef.current[remote.id]?.version ?? -1) > remote.version) return;
      putCloud(remote);
      const pending = draftsRef.current[remote.id];
      if (!pending || locks.current.has(remote.id)) return;
      const result = reconcileStickyDraft(pending, remote);
      if (result.conflict) markConflict(remote.id, remote);
      else if (result.draft !== pending) {
        const next = { ...draftsRef.current };
        if (result.draft) next[remote.id] = result.draft;
        else delete next[remote.id];
        store(next);
        setErrors((previous) => {
          const nextErrors = { ...previous };
          delete nextErrors[remote.id];
          return nextErrors;
        });
      }
    },
    [markConflict, putCloud, store],
  );

  const refresh = useCallback(async () => {
    const client = getSupabase();
    if (!client || !navigator.onLine) return;
    const ticket = ++epoch.current;
    try {
      const rows: StickyNote[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client
          .from('sticky_notes')
          .select('*')
          .eq('user_id', userId)
          .order('id')
          .range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data as StickyNote[]));
        if (data.length < 500) break;
      }
      if (!alive.current || ticket !== epoch.current) return;
      rows.forEach(acceptRemote);
      setLoadError('');
      setLoaded(true);
    } catch (error) {
      if (alive.current)
        setLoadError(
          `便签暂未连接云端：${error instanceof Error ? error.message : ((error as { message?: string }).message ?? '请稍后重试')}。编辑中的草稿会保留。`,
        );
    }
  }, [acceptRemote, userId]);

  const flush = useCallback(
    async (id: string) => {
      const client = getSupabase();
      if (
        !client ||
        !navigator.onLine ||
        locks.current.has(id) ||
        id in conflictsRef.current
      )
        return;
      const draft = draftsRef.current[id];
      if (!draft) return;
      locks.current.add(id);
      if (alive.current) setSaving([...locks.current]);
      try {
        // Read before retries: a previous request could have committed despite a lost response.
        const { data: latest, error: readError } = await client
          .from('sticky_notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();
        if (readError) throw readError;
        let base = draft.baseVersion;
        if (latest) {
          const result = reconcileStickyDraft(draft, latest as StickyNote);
          if (!result.draft) {
            putCloud(latest as StickyNote);
            const next = { ...draftsRef.current };
            if (next[id]?.token === draft.token) delete next[id];
            else if (next[id])
              next[id] = {
                ...next[id],
                baseVersion: latest.version,
                sentToken: undefined,
              };
            store(next);
            if (alive.current)
              setErrors((previous) => {
                const nextErrors = { ...previous };
                delete nextErrors[id];
                return nextErrors;
              });
            return;
          }
          if (result.conflict) {
            markConflict(id, latest as StickyNote);
            return;
          }
          base = result.draft.baseVersion;
        } else if (base !== null) {
          markConflict(id, null);
          return;
        }

        // Persist the request token before starting the write so interrupted requests are recoverable.
        store({
          ...draftsRef.current,
          [id]: { ...draftsRef.current[id], sentToken: draft.token },
        });
        const payload = stickyPayload(draft.note, draft.token);
        const request =
          base === null
            ? client
                .from('sticky_notes')
                .insert({ id, user_id: userId, ...payload })
                .select('*')
                .maybeSingle()
            : client
                .from('sticky_notes')
                .update(payload)
                .eq('id', id)
                .eq('user_id', userId)
                .eq('version', base)
                .select('*')
                .maybeSingle();
        const { data, error } = await request;
        if (error) throw error;
        if (!data) {
          const remote = await client
            .from('sticky_notes')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
          if (remote.error) throw remote.error;
          markConflict(id, remote.data as StickyNote | null);
          return;
        }
        putCloud(data as StickyNote);
        const next = { ...draftsRef.current };
        if (next[id]?.token === draft.token) delete next[id];
        else if (next[id])
          next[id] = {
            ...next[id],
            baseVersion: data.version,
            sentToken: undefined,
          };
        store(next);
        if (alive.current)
          setErrors((previous) => {
            const result = { ...previous };
            delete result[id];
            return result;
          });
      } catch (error) {
        if (alive.current)
          setErrors((previous) => ({
            ...previous,
            [id]: (error as { message?: string }).message || '保存失败，请重试',
          }));
      } finally {
        locks.current.delete(id);
        if (alive.current) setSaving([...locks.current]);
      }
    },
    [markConflict, putCloud, store, userId],
  );

  const retry = useCallback(() => {
    void refresh();
    Object.keys(draftsRef.current).forEach((id) => void flush(id));
  }, [flush, refresh]);

  useEffect(() => {
    alive.current = true;
    try {
      const parsed = JSON.parse(
        localStorage.getItem(key) || '{}',
      ) as StickyDrafts;
      const valid = Object.fromEntries(
        Object.entries(parsed).filter(
          ([id, d]) =>
            d?.note?.id === id &&
            d.note.user_id === userId &&
            Array.isArray(d.note.items) &&
            Array.isArray(d.note.image_paths) &&
            typeof d.token === 'string',
        ),
      );
      draftsRef.current = valid;
      // Hydrate once from external browser storage after mounting (no SSR storage access).
      // eslint-disable-next-line react/react-compiler
      setDrafts(valid);
    } catch {
      setStorageError('无法读取本机草稿，请不要清除浏览器数据。');
    }
    setReady(true);
    void refresh();
    const connected = () => {
      setOnline(true);
      retry();
    };
    const disconnected = () => setOnline(false);
    const focus = () => {
      if (document.visibilityState === 'visible') retry();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (Object.keys(draftsRef.current).length) {
        event.preventDefault();
        // Older browser versions require returnValue to show the unsaved-draft warning.
        // eslint-disable-next-line typescript/no-deprecated
        event.returnValue = '';
      }
    };
    window.addEventListener('online', connected);
    window.addEventListener('offline', disconnected);
    document.addEventListener('visibilitychange', focus);
    window.addEventListener('beforeunload', unload);
    const client = getSupabase();
    const channel = client
      ?.channel(`sticky-${userId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sticky_notes',
          filter: `user_id=eq.${userId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    const interval = window.setInterval(retry, 60000);
    return () => {
      alive.current = false;
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', disconnected);
      document.removeEventListener('visibilitychange', focus);
      window.removeEventListener('beforeunload', unload);
      clearInterval(interval);
      if (channel) void client?.removeChannel(channel);
    };
  }, [key, refresh, retry, userId]);

  useEffect(() => {
    if (!ready || !online) return;
    const timer = setTimeout(
      () =>
        Object.keys(draftsRef.current)
          .filter((id) => !errors[id])
          .forEach((id) => void flush(id)),
      700,
    );
    return () => clearTimeout(timer);
  }, [drafts, ready, online, errors, saving.length, flush]);

  const edit = useCallback(
    (id: string, patch: Partial<StickyNote>) => {
      const old = draftsRef.current[id];
      const note = old?.note ?? cloudRef.current[id];
      if (!note) return;
      const updated = {
        ...note,
        ...patch,
        id: note.id,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };
      store({
        ...draftsRef.current,
        [id]: {
          note: updated,
          baseVersion: old ? old.baseVersion : note.version,
          token: crypto.randomUUID(),
          sentToken: old?.sentToken,
        },
      });
      setErrors((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
    },
    [store, userId],
  );

  const create = useCallback(
    (kind: StickyKind, source?: StickyNote) => {
      const note = {
        ...newStickyNote(userId, kind),
        ...(source
          ? {
              title: `${source.title || '未命名便签'}（本地副本）`,
              content: source.content,
              items: source.items,
              image_paths: source.image_paths,
              color: source.color,
            }
          : {}),
      };
      store({
        ...draftsRef.current,
        [note.id]: { note, baseVersion: null, token: note.mutation_id },
      });
      return note.id;
    },
    [store, userId],
  );

  const resolve = useCallback(
    (id: string, keepCopy: boolean) => {
      const pending = draftsRef.current[id];
      const remote = conflictsRef.current[id];
      let copyId: string | undefined;
      if (keepCopy && pending) copyId = create(pending.note.kind, pending.note);
      if (remote) putCloud(remote);
      else {
        const next = { ...cloudRef.current };
        delete next[id];
        cloudRef.current = next;
        setCloud(next);
      }
      const next = { ...draftsRef.current };
      delete next[id];
      store(next);
      const remaining = { ...conflictsRef.current };
      delete remaining[id];
      conflictsRef.current = remaining;
      setConflicts(remaining);
      return copyId;
    },
    [create, putCloud, store],
  );

  const notes = sortStickyNotes(
    Object.values({
      ...cloud,
      ...Object.fromEntries(
        Object.entries(drafts).map(([id, d]) => [id, d.note]),
      ),
    }),
  );
  return {
    notes,
    ready,
    loaded,
    online,
    drafts,
    conflicts,
    errors,
    saving,
    loadError,
    storageError,
    edit,
    create,
    resolve,
    retry,
  };
}
