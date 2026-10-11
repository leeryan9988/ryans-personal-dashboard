'use client';
// Private signed image URLs are rendered directly; this static Vite build has no Next image server.
/* eslint-disable next/no-img-element */
// Portal modal and drag targets include explicit keyboard alternatives and focus management.
/* eslint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Clock3,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  Pin,
  Plus,
  StickyNote as NoteIcon,
  X,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import {
  moveStickyItem,
  splitStickyItems,
  stickyBeijingDeadline,
  stickyBeijingInput,
  stickyRemaining,
  stickyTime,
  STICKY_BUCKET,
  STICKY_IMAGE_BYTES,
  STICKY_IMAGE_LIMIT,
  type StickyItem,
  type StickyNote,
} from '@/lib/sticky-notes';
import { useStickyNotes } from '@/lib/use-sticky-notes';
import { StickyMarkdown } from './sticky-markdown';
import './sticky-notes.css';
type SignedImage = {
  path?: string | null;
  signedUrl: string;
  error?: string | null;
};

function Dialog({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useLayoutEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeRef.current();
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,[tabindex="0"]',
        ) ?? [],
      ).filter((n) => n.getClientRects().length);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', key, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key, true);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="sticky-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sticky-dialog ${wide ? 'sticky-viewer' : ''}`}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="关闭窗口" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function StickyNotesBoard({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const state = useStickyNotes(userId);
  const { notes, edit } = state;
  const [filter, setFilter] = useState('待办清单');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    id: string;
    offset: number;
    targetId: string | null;
    after: boolean;
  } | null>(null);
  const [quickText, setQuickText] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [linkItem, setLinkItem] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState('');
  const [viewer, setViewer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);
  const createLock = useRef(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const dragGesture = useRef<{
    id: string;
    pointerId: number;
    startY: number;
    moved: boolean;
    targetId: string | null;
    after: boolean;
  } | null>(null);
  const draggedItem = useRef<number | null>(null);
  const latestNotes = useRef(notes);
  useLayoutEffect(() => {
    latestNotes.current = notes;
  }, [notes]);
  const note = notes.find((n) => n.id === editing);
  const readOnly = !!(
    note?.deleted_at ||
    note?.archived_at ||
    (note && note.id in state.conflicts)
  );
  const pending = Object.keys(state.drafts).length;
  const status = !state.online
    ? '离线 · 编辑暂存本机'
    : Object.keys(state.conflicts).length
      ? '有同步冲突，请处理'
      : Object.keys(state.errors).length
        ? '保存失败 · 草稿已保留'
        : pending
          ? '正在保存…'
          : state.loadError
            ? '云端连接失败'
            : !state.loaded
              ? '正在加载云端便签…'
              : '已同步到云端';
  const pathsKey = JSON.stringify(
    [...new Set(notes.flatMap((n) => n.image_paths))].sort(),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!active) {
      // Navigation is external to this mounted editor; preserve drafts but close its portal.
      // eslint-disable-next-line react/react-compiler
      setEditing(null);
      setViewer(null);
    }
  }, [active]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const paths = JSON.parse(pathsKey) as string[];
      const client = getSupabase();
      if (!client || !paths.length) return;
      const next: Record<string, string> = {};
      try {
        for (let offset = 0; offset < paths.length; offset += 100) {
          const { data, error } = await client.storage
            .from(STICKY_BUCKET)
            .createSignedUrls(paths.slice(offset, offset + 100), 3600);
          if (error) throw error;
          data?.forEach((row: SignedImage) => {
            if (row.path && row.signedUrl && !row.error)
              next[row.path] = row.signedUrl;
          });
        }
        if (!cancelled) {
          setUrls(next);
          setImageError(
            Object.keys(next).length < paths.length
              ? '部分图片暂时无法读取，可稍后重试。'
              : '',
          );
        }
      } catch (error) {
        if (!cancelled)
          setImageError(`图片读取失败：${(error as Error).message}`);
      }
    };
    void load();
    const timer = setInterval(load, 45 * 60 * 1000);
    window.addEventListener('online', load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('online', load);
    };
  }, [pathsKey]);

  const open = (id: string) => {
    setEditing(id);
    setPreview(false);
    setNewItem('');
    setLinkItem(null);
  };
  const create = (kind: 'note' | 'todo') => {
    if (createLock.current || !state.ready) return;
    createLock.current = true;
    setFilter(kind === 'todo' ? '待办清单' : '文字便签');
    open(state.create(kind));
    setTimeout(() => {
      createLock.current = false;
    }, 600);
  };
  const visible = notes.filter(
    (n) =>
      (filter === '回收站'
        ? !!n.deleted_at
        : filter === '已归档'
          ? !n.deleted_at && !!n.archived_at
          : !n.deleted_at &&
            !n.archived_at &&
            (filter === '全部' ||
              n.kind === (filter === '文字便签' ? 'note' : 'todo'))) &&
      `${n.title}\n${n.content}\n${n.items.map((i) => i.text).join('\n')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const move = (id: string, targetId: string, after: boolean) => {
    const current = notes.find((n) => n.id === id),
      target = notes.find((n) => n.id === targetId);
    if (
      !current ||
      !target ||
      id === targetId ||
      current.pinned !== target.pinned
    )
      return;
    const group = notes.filter(
      (n) =>
        n.id !== id &&
        !n.deleted_at &&
        !n.archived_at &&
        n.pinned === target.pinned,
    );
    const index = group.findIndex((n) => n.id === targetId);
    const before = after
      ? group[index].sort_order
      : (group[index - 1]?.sort_order ?? target.sort_order - 2048);
    const behind = after
      ? (group[index + 1]?.sort_order ?? target.sort_order + 2048)
      : group[index].sort_order;
    edit(id, { sort_order: (before + behind) / 2 });
  };
  const dragMove = (clientY: number) => {
    const gesture = dragGesture.current;
    if (!gesture) return;
    const offset = clientY - gesture.startY;
    if (!gesture.moved && Math.abs(offset) < 7) return;
    gesture.moved = true;
    const source = visible.find((n) => n.id === gesture.id);
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('.sticky-list .sticky-card[data-sticky-id]'),
    ).filter((element) => {
      const note = visible.find((n) => n.id === element.dataset.stickyId);
      return note && note.id !== gesture.id && note.pinned === source?.pinned;
    });
    const target = candidates.find((element) => clientY < element.getBoundingClientRect().bottom)
      ?? candidates.at(-1);
    const targetId = target?.dataset.stickyId ?? null;
    const after = !!target && clientY > (target.getBoundingClientRect().top + target.getBoundingClientRect().bottom) / 2;
    gesture.targetId = targetId;
    gesture.after = after;
    setDragPosition({ id: gesture.id, offset, targetId, after });
    if (clientY < 70) window.scrollBy(0, -12);
    else if (clientY > window.innerHeight - 70) window.scrollBy(0, 12);
  };
  const finishDrag = (cancelled = false) => {
    const gesture = dragGesture.current;
    if (!gesture) return;
    dragGesture.current = null;
    if (cancelled || !gesture.moved || !gesture.targetId) {
      setDragPosition(null);
      return;
    }
    const sourceIndex = visible.findIndex((n) => n.id === gesture.id);
    const targetIndex = visible.findIndex((n) => n.id === gesture.targetId);
    if (
      (targetIndex === sourceIndex + 1 && !gesture.after) ||
      (targetIndex === sourceIndex - 1 && gesture.after)
    ) {
      setDragPosition(null);
      return;
    }
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.sticky-list .sticky-card[data-sticky-id]'));
    const before = new Map(cards.map((card) => [card.dataset.stickyId, card.getBoundingClientRect().top]));
    flushSync(() => {
      setDragPosition(null);
      move(gesture.id, gesture.targetId!, gesture.after);
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cards.forEach((card) => {
      const start = before.get(card.dataset.stickyId);
      if (start === undefined) return;
      const delta = start - card.getBoundingClientRect().top;
      if (Math.abs(delta) < 2) return;
      card.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
        { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    });
  };
  const toggle = (n: StickyNote, item: StickyItem) =>
    edit(n.id, {
      items: n.items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              completed_at: i.completed_at ? null : new Date().toISOString(),
            }
          : i,
      ),
    });
  const addItems = () => {
    if (!note || readOnly || !newItem.trim()) return;
    const added = splitStickyItems(newItem);
    if (note.items.length + added.length > 500) {
      window.alert('每张便签最多 500 项，请新建另一张清单。');
      return;
    }
    edit(note.id, { items: [...note.items, ...added] });
    setNewItem('');
  };
  const addQuickItem = (n: StickyNote) => {
    if (
      !quickText.trim() ||
      n.deleted_at ||
      n.archived_at ||
      n.id in state.conflicts
    )
      return;
    const added = splitStickyItems(quickText);
    if (n.items.length + added.length > 500) {
      window.alert('每张清单最多 500 项，请新建另一张清单。');
      return;
    }
    edit(n.id, { items: [...n.items, ...added] });
    setQuickText('');
  };
  const upload = async (files: File[]) => {
    if (!note || readOnly || uploadLock.current || !files.length) return;
    const targetId = note.id;
    const types: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    if (files.some((f) => !types[f.type] || f.size > STICKY_IMAGE_BYTES)) {
      setImageError('只支持 JPG、PNG、WebP、GIF 图片，单张不超过 5MB。');
      return;
    }
    if (note.image_paths.length + files.length > STICKY_IMAGE_LIMIT) {
      setImageError('每张便签最多 8 张图片。');
      return;
    }
    if (!navigator.onLine) {
      setImageError('图片需要联网上传；文字和待办可继续离线编辑。');
      return;
    }
    const client = getSupabase();
    if (!client) return;
    uploadLock.current = true;
    setUploading(true);
    setImageError('');
    try {
      for (const file of files) {
        const path = `${userId}/${crypto.randomUUID()}.${types[file.type]}`;
        const { error } = await client.storage
          .from(STICKY_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const current = latestNotes.current.find((n) => n.id === targetId);
        if (!current) throw new Error('便签已关闭，请刷新后检查');
        const next = {
          ...current,
          image_paths: [...current.image_paths, path],
        };
        latestNotes.current = latestNotes.current.map((n) =>
          n.id === targetId ? next : n,
        );
        edit(targetId, { image_paths: next.image_paths });
      }
    } catch (error) {
      setImageError(
        `上传未全部完成：${(error as Error).message}。已成功的图片会保留，请重试失败的图片。`,
      );
    } finally {
      uploadLock.current = false;
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = '';
    }
  };
  const trash = (n: StickyNote) => {
    if (
      window.confirm(
        `将“${n.title || '未命名便签'}”移入回收站？以后可以恢复，不会永久删除。`,
      )
    ) {
      edit(n.id, { deleted_at: new Date().toISOString() });
      setEditing(null);
    }
  };
  const image = (path: string) =>
    urls[path] ? (
      <button
        type="button"
        className="sticky-image"
        key={path}
        onClick={() => setViewer(path)}
        aria-label="查看图片原图"
      >
        <img
          src={urls[path]}
          alt="便签图片，点击查看原图"
          loading="lazy"
          onError={() => setImageError('图片加载失败，请点击重试图片。')}
        />
      </button>
    ) : (
      <span key={path} className="sticky-image-placeholder">
        图片加载中
      </span>
    );

  return (
    <section hidden={!active} className="sticky-board">
      <div className="sticky-hero">
        <div>
          <span className="sticky-eyebrow">待办清单</span>
          <h1>一件一件，按时完成</h1>
          <p>逐条记录 · 截止倒计时 · 自动保存与跨设备同步</p>
        </div>
        <div className="sticky-actions">
          <button
            className="sticky-primary"
            onClick={() => create('todo')}
            disabled={!state.ready}
          >
            <CheckSquare size={17} />
            待办清单
          </button>
          <button onClick={() => create('note')} disabled={!state.ready}>
            <Plus size={17} />
            文字便签
          </button>
        </div>
      </div>
      <div className="sticky-toolbar">
        <div className="sticky-filters">
          {['全部', '文字便签', '待办清单', '已归档', '回收站'].map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          aria-label="搜索便签"
          placeholder="搜索标题、内容或待办…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span role="status" className="sticky-status">
          {status}
        </span>
      </div>
      {(state.loadError ||
        state.storageError ||
        Object.keys(state.errors).length > 0) && (
        <div className="sticky-notice" role="alert">
          {state.loadError ||
            state.storageError ||
            Object.values(state.errors)[0]}{' '}
          <button onClick={state.retry}>重试同步</button>
        </div>
      )}
      {imageError && (
        <div className="sticky-notice" role="alert">
          {imageError}
          <button
            onClick={async () => {
              const client = getSupabase();
              const paths = JSON.parse(pathsKey) as string[];
              if (client && paths.length) {
                const result = await client.storage
                  .from(STICKY_BUCKET)
                  .createSignedUrls(paths, 3600);
                if (!result.error) {
                  setUrls(
                    Object.fromEntries(
                      (result.data ?? [])
                        .filter((r: SignedImage) => r.path && r.signedUrl)
                        .map((r: SignedImage) => [r.path!, r.signedUrl]),
                    ),
                  );
                  setImageError('');
                }
              }
            }}
          >
            重试图片
          </button>
          <button aria-label="关闭图片提示" onClick={() => setImageError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {Object.keys(state.conflicts).map((id) => (
        <div className="sticky-notice" key={id}>
          <strong>
            “{notes.find((n) => n.id === id)?.title || '未命名便签'}
            ”已在另一台设备修改。
          </strong>{' '}
          本机内容未覆盖云端。
          <button onClick={() => open(id)}>查看并处理</button>
        </div>
      ))}
      {!visible.length && (
        <div className="sticky-empty">
          <NoteIcon size={38} />
          <h2>
            {search
              ? '没有找到匹配的便签'
              : filter === '回收站'
                ? '回收站是空的'
                : filter === '已归档'
                  ? '还没有归档的便签'
                  : filter === '待办清单'
                    ? '还没有待办，先添加一张清单'
                    : '给想法留一张便签'}
          </h2>
          <p>
            {filter === '全部' && !search
              ? '写下一句话，或把一件事拆成几步。内容会自动保存。'
              : '切换分类或调整搜索试试。'}
          </p>
        </div>
      )}
      <div className={`sticky-list ${dragPosition ? 'is-sorting' : ''}`}>
        {visible.map((n) => (
          <article
            key={n.id}
            data-sticky-id={n.id}
            className={`sticky-card sticky-${n.color} ${n.collapsed ? 'is-collapsed' : ''} ${dragPosition?.id === n.id ? 'is-dragging' : ''} ${dragPosition?.targetId === n.id ? (dragPosition.after ? 'is-drop-after' : 'is-drop-before') : ''}`}
            style={dragPosition?.id === n.id ? { transform: `translateY(${dragPosition.offset}px)` } : undefined}
          >
            <div className="sticky-card-top">
              <span>
                {n.kind === 'todo' ? (
                  <CheckSquare size={16} />
                ) : (
                  <NoteIcon size={16} />
                )}
                {n.kind === 'todo' ? '待办清单' : '文字便签'}
                {n.pinned && <Pin size={14} />}
              </span>
              <div className="sticky-actions">
                {!n.deleted_at && !n.archived_at && (
                  <button
                    type="button"
                    className="sticky-drag-handle"
                    aria-label={`调整“${n.title || '未命名清单'}”的顺序`}
                    title="按住并上下拖动排序"
                    onPointerDown={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      dragGesture.current = {
                        id: n.id,
                        pointerId: e.pointerId,
                        startY: e.clientY,
                        moved: false,
                        targetId: null,
                        after: false,
                      };
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (dragGesture.current?.pointerId === e.pointerId)
                        dragMove(e.clientY);
                    }}
                    onPointerUp={(e) => {
                      if (dragGesture.current?.pointerId === e.pointerId)
                        finishDrag();
                    }}
                    onPointerCancel={() => finishDrag(true)}
                    onClick={(e) => e.preventDefault()}
                  >
                    <GripVertical size={16} />
                  </button>
                )}
                <button onClick={() => open(n.id)}>管理</button>
                <button
                  aria-label={n.collapsed ? '展开便签' : '折叠便签'}
                  onClick={() => edit(n.id, { collapsed: !n.collapsed })}
                >
                  {n.collapsed ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )}
                </button>
              </div>
            </div>
            <button className="sticky-title" onClick={() => open(n.id)}>
              {n.title || '未命名便签'}
            </button>
            {!n.collapsed && (
              <>
                <div className="sticky-card-body">
                  {n.kind === 'note' ? (
                    <StickyMarkdown text={n.content || '点击管理，开始记录…'} />
                  ) : (
                    <>
                      <div className="sticky-progress">
                        <span>
                          已完成 {n.items.filter((i) => i.completed_at).length}{' '}
                          / {n.items.length}
                        </span>
                        <progress
                          value={n.items.filter((i) => i.completed_at).length}
                          max={n.items.length || 1}
                        />
                      </div>
                      {n.items.map((item) => (
                        <div className="sticky-list-row" key={item.id}>
                          <input
                            type="checkbox"
                            checked={!!item.completed_at}
                            disabled={
                              !!n.deleted_at ||
                              !!n.archived_at ||
                              n.id in state.conflicts
                            }
                            onChange={() => toggle(n, item)}
                            aria-label={item.text}
                          />
                          <span className={item.completed_at ? 'done' : ''}>
                            {item.text}
                            {item.due_at && (
                              <small
                                className={`sticky-countdown ${!item.completed_at && Date.parse(item.due_at) <= now ? 'is-overdue' : ''}`}
                              >
                                <Clock3 size={13} />
                                {stickyRemaining(
                                  item.due_at,
                                  item.completed_at,
                                  now,
                                )}
                              </small>
                            )}
                          </span>
                          {item.linked_note_id && (
                            <button onClick={() => open(item.linked_note_id!)}>
                              便签 ↗
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`管理待办 ${item.text}`}
                            onClick={() => open(n.id)}
                          >
                            <GripVertical size={15} />
                          </button>
                        </div>
                      ))}
                      {!n.deleted_at && !n.archived_at && (
                        <div className="sticky-quick-add">
                          {quickAddId === n.id ? (
                            <>
                              <input
                                aria-label={`在${n.title || '未命名清单'}新增待办`}
                                value={quickText}
                                placeholder="写一条待办，回车添加"
                                onChange={(e) => setQuickText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === 'Enter' &&
                                    !e.nativeEvent.isComposing
                                  ) {
                                    e.preventDefault();
                                    addQuickItem(n);
                                  }
                                }}
                              />
                              <button
                                disabled={!quickText.trim()}
                                onClick={() => addQuickItem(n)}
                              >
                                添加
                              </button>
                              <button
                                aria-label="关闭快捷添加"
                                onClick={() => {
                                  setQuickAddId(null);
                                  setQuickText('');
                                }}
                              >
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setQuickAddId(n.id);
                                setQuickText('');
                              }}
                            >
                              <Plus size={15} /> 添加一条
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {n.image_paths.length > 0 && (
                    <div className="sticky-images">
                      {n.image_paths.slice(0, 2).map(image)}
                      {n.image_paths.length > 2 && (
                        <button onClick={() => open(n.id)}>
                          +{n.image_paths.length - 2} 张
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <footer>
                  <small>
                    更新于 {stickyTime(n.updated_at)} · 北京时间
                    <br />
                    {n.id in state.conflicts
                      ? '等待处理冲突'
                      : state.errors[n.id]
                        ? '保存失败'
                        : state.drafts[n.id]
                          ? '待同步'
                          : '已同步'}
                  </small>
                  <div className="sticky-actions">
                    {n.deleted_at && (
                      <button onClick={() => edit(n.id, { deleted_at: null })}>
                        恢复
                      </button>
                    )}
                  </div>
                </footer>
              </>
            )}
          </article>
        ))}
      </div>

      {active && note && !viewer && (
        <Dialog
          title={note.kind === 'todo' ? '编辑待办清单' : '编辑文字便签'}
          close={() => {
            if (!uploading) {
              if (
                newItem.trim() &&
                !window.confirm('输入框中的待办尚未添加，仍要关闭吗？')
              )
                return;
              setEditing(null);
            }
          }}
        >
          <div
            className="sticky-editor"
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files).filter((f) =>
                f.type.startsWith('image/'),
              );
              if (files.length) {
                e.preventDefault();
                void upload(files);
              }
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('Files')) e.preventDefault();
            }}
            onDrop={(e) => {
              if (e.dataTransfer.files.length) {
                e.preventDefault();
                void upload(Array.from(e.dataTransfer.files));
              }
            }}
          >
            {note.id in state.conflicts && (
              <div className="sticky-notice">
                <strong>同步冲突：两边的内容都已保留</strong>
                <p>
                  云端版本：
                  {stickyTime(state.conflicts[note.id]?.updated_at ?? null)}
                  ；以下显示的是本机版本。
                </p>
                <p>
                  {state.conflicts[note.id]?.title || '云端便签已不存在'}：
                  {state.conflicts[note.id]?.content.slice(0, 180)}
                </p>
                <button
                  onClick={() => {
                    const id = state.resolve(note.id, true);
                    if (id) open(id);
                  }}
                >
                  保留两份（推荐）
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('放弃本机未同步修改，使用云端版本？')) {
                      state.resolve(note.id, false);
                      setEditing(null);
                    }
                  }}
                >
                  使用云端版本
                </button>
              </div>
            )}
            <label>
              标题
              <input
                value={note.title}
                maxLength={200}
                readOnly={readOnly}
                placeholder="给这张便签起个名字"
                onChange={(e) => edit(note.id, { title: e.target.value })}
              />
            </label>
            {note.kind === 'note' ? (
              <>
                <div className="sticky-actions">
                  <button
                    aria-pressed={!preview}
                    onClick={() => setPreview(false)}
                  >
                    编辑
                  </button>
                  <button
                    aria-pressed={preview}
                    onClick={() => setPreview(true)}
                  >
                    预览
                  </button>
                  <small>支持标题、列表、**粗体**、链接和代码</small>
                </div>
                {preview ? (
                  <div className="sticky-preview">
                    <StickyMarkdown text={note.content} />
                  </div>
                ) : (
                  <textarea
                    aria-label="便签正文"
                    value={note.content}
                    maxLength={100000}
                    readOnly={readOnly}
                    rows={10}
                    placeholder="写下想法…也可以直接粘贴或拖入图片"
                    onChange={(e) => edit(note.id, { content: e.target.value })}
                  />
                )}
              </>
            ) : (
              <>
                <div className="sticky-progress">
                  <span>
                    已完成 {note.items.filter((i) => i.completed_at).length} /{' '}
                    {note.items.length}
                  </span>
                  <progress
                    value={note.items.filter((i) => i.completed_at).length}
                    max={note.items.length || 1}
                  />
                </div>
                {note.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="sticky-item-editor"
                    onDragOver={(e) => {
                      if (draggedItem.current !== null) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (draggedItem.current !== null && !readOnly) {
                        e.preventDefault();
                        edit(note.id, {
                          items: moveStickyItem(
                            note.items,
                            draggedItem.current,
                            index,
                          ),
                        });
                        draggedItem.current = null;
                      }
                    }}
                  >
                    <div className="sticky-check">
                      <button
                        disabled={readOnly}
                        draggable={!readOnly}
                        aria-label="拖动待办"
                        onDragStart={(e) => {
                          draggedItem.current = index;
                          e.dataTransfer.setData('text/plain', item.id);
                        }}
                        onDragEnd={() => {
                          draggedItem.current = null;
                        }}
                      >
                        <GripVertical size={16} />
                      </button>
                      <input
                        type="checkbox"
                        aria-label={`完成 ${item.text}`}
                        checked={!!item.completed_at}
                        disabled={readOnly}
                        onChange={() => toggle(note, item)}
                      />
                      <input
                        aria-label={`待办 ${index + 1}`}
                        className={item.completed_at ? 'done' : ''}
                        value={item.text}
                        maxLength={2000}
                        readOnly={readOnly}
                        onChange={(e) =>
                          edit(note.id, {
                            items: note.items.map((i) =>
                              i.id === item.id
                                ? { ...i, text: e.target.value }
                                : i,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="sticky-item-tools">
                      <label className="sticky-deadline-field">
                        截止时间（北京时间）
                        <input
                          type="datetime-local"
                          aria-label={`待办 ${index + 1} 截止时间（北京时间）`}
                          value={stickyBeijingInput(item.due_at)}
                          disabled={readOnly}
                          onChange={(e) =>
                            edit(note.id, {
                              items: note.items.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      due_at: stickyBeijingDeadline(
                                        e.target.value,
                                      ),
                                    }
                                  : i,
                              ),
                            })
                          }
                        />
                      </label>
                      <small>
                        {item.completed_at
                          ? `完成于 ${stickyTime(item.completed_at)}`
                          : stickyRemaining(
                              item.due_at,
                              item.completed_at,
                              now,
                            ) || '未完成'}
                      </small>
                      {item.linked_note_id && (
                        <button onClick={() => open(item.linked_note_id!)}>
                          打开关联便签
                        </button>
                      )}
                      <button
                        disabled={readOnly}
                        onClick={() =>
                          setLinkItem(linkItem === item.id ? null : item.id)
                        }
                      >
                        关联
                      </button>
                      <button
                        disabled={readOnly || index === 0}
                        aria-label="上移待办"
                        onClick={() =>
                          edit(note.id, {
                            items: moveStickyItem(note.items, index, index - 1),
                          })
                        }
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={readOnly || index === note.items.length - 1}
                        aria-label="下移待办"
                        onClick={() =>
                          edit(note.id, {
                            items: moveStickyItem(note.items, index, index + 1),
                          })
                        }
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        disabled={readOnly}
                        aria-label="删除待办"
                        onClick={() => {
                          if (window.confirm(`删除待办“${item.text}”？`))
                            edit(note.id, {
                              items: note.items.filter((i) => i.id !== item.id),
                            });
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {linkItem === item.id && (
                      <div className="sticky-link-picker">
                        {[
                          { id: '', title: '取消关联' },
                          ...notes.filter(
                            (n) => n.id !== note.id && !n.deleted_at,
                          ),
                        ].map((n) => (
                          <button
                            key={n.id}
                            aria-pressed={item.linked_note_id === n.id}
                            onClick={() => {
                              edit(note.id, {
                                items: note.items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, linked_note_id: n.id || null }
                                    : i,
                                ),
                              });
                              setLinkItem(null);
                            }}
                          >
                            {n.title || '未命名便签'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <div className="sticky-add-item">
                    <textarea
                      aria-label="新增待办"
                      rows={2}
                      value={newItem}
                      placeholder="输入待办；粘贴多行文字可批量添加（每行一项）"
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          addItems();
                        }
                      }}
                    />
                    <button onClick={addItems} disabled={!newItem.trim()}>
                      添加待办
                    </button>
                  </div>
                )}
                <label>
                  补充说明
                  <textarea
                    value={note.content}
                    maxLength={100000}
                    readOnly={readOnly}
                    rows={3}
                    onChange={(e) => edit(note.id, { content: e.target.value })}
                  />
                </label>
              </>
            )}
            <div className="sticky-images editor-images">
              {note.image_paths.map((path) => (
                <div key={path}>
                  {image(path)}
                  {!readOnly && (
                    <button
                      disabled={uploading}
                      onClick={() => {
                        if (window.confirm('从此便签移除这张图片？'))
                          edit(note.id, {
                            image_paths: note.image_paths.filter(
                              (p) => p !== path,
                            ),
                          });
                      }}
                    >
                      移除图片
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="sticky-upload">
                <ImagePlus size={22} />
                <span>
                  {uploading
                    ? '正在上传，请稍候…'
                    : '拖入图片，或按 Ctrl+V 粘贴图片'}
                  <small>最多 8 张 · 单张 5MB · 私有云端存储</small>
                </span>
                <button
                  disabled={uploading}
                  onClick={() => uploadInput.current?.click()}
                >
                  选择图片
                </button>
                <input
                  ref={uploadInput}
                  type="file"
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) =>
                    void upload(Array.from(e.target.files ?? []))
                  }
                />
              </div>
            )}
            {imageError && (
              <p role="alert" className="sticky-notice">
                {imageError}
              </p>
            )}
            <div className="sticky-editor-tools">
              {!readOnly && (
                <>
                  <span>便签颜色</span>
                  {(['blue', 'white', 'sand', 'rose'] as const).map(
                    (color, i) => (
                      <button
                        key={color}
                        className={`sticky-${color}`}
                        aria-pressed={note.color === color}
                        onClick={() => edit(note.id, { color })}
                      >
                        {['浅蓝', '白色', '米黄', '淡粉'][i]}
                      </button>
                    ),
                  )}
                  <button
                    aria-pressed={note.pinned}
                    onClick={() => edit(note.id, { pinned: !note.pinned })}
                  >
                    {note.pinned ? '取消置顶' : '置顶'}
                  </button>
                </>
              )}
              {note.deleted_at ? (
                <button onClick={() => edit(note.id, { deleted_at: null })}>
                  从回收站恢复
                </button>
              ) : (
                <>
                  <button
                    disabled={uploading || note.id in state.conflicts}
                    onClick={() =>
                      edit(note.id, {
                        archived_at: note.archived_at
                          ? null
                          : new Date().toISOString(),
                      })
                    }
                  >
                    {note.archived_at ? '取消归档' : '归档'}
                  </button>
                  <button
                    className="sticky-danger"
                    disabled={uploading || note.id in state.conflicts}
                    onClick={() => trash(note)}
                  >
                    移入回收站
                  </button>
                </>
              )}
            </div>
            <div className="sticky-editor-footer">
              <small>
                创建于 {stickyTime(note.created_at)}
                <br />
                更新于 {stickyTime(note.updated_at)} · 北京时间
              </small>
              <span role="status">
                {state.errors[note.id] ||
                  (note.id in state.conflicts
                    ? '等待处理冲突'
                    : state.drafts[note.id]
                      ? '修改已暂存，等待同步'
                      : '已同步到云端')}
              </span>
              <button
                disabled={uploading}
                className="sticky-primary"
                onClick={() => {
                  if (
                    newItem.trim() &&
                    !window.confirm('输入框中的待办尚未添加，仍要关闭吗？')
                  )
                    return;
                  setEditing(null);
                }}
              >
                完成
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {active && viewer && (
        <Dialog wide title="查看原图" close={() => setViewer(null)}>
          <div className="sticky-full-image">
            <img src={urls[viewer]} alt="便签原图" />
          </div>
          <a
            className="sticky-original"
            href={urls[viewer]}
            target="_blank"
            rel="noopener noreferrer"
          >
            在新窗口打开原图 ↗
          </a>
        </Dialog>
      )}
    </section>
  );
}
