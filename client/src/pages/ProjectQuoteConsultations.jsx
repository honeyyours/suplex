// 견적상담 — 프로젝트 안의 통화·미팅·카톡 기록 카드 타임라인
// 카드 1개 = 1번의 접촉. 시간 역순 (최신 위). 새 상담 모달 + 인라인 편집 + 삭제.
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  quoteConsultationsApi,
  CHANNELS,
  REACTIONS,
  TOPIC_SUGGESTIONS,
  channelMeta,
  reactionMeta,
} from '../api/quoteConsultations';

export default function ProjectQuoteConsultations() {
  const { project } = useOutletContext();
  const projectId = project?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterChannel, setFilterChannel] = useState('');
  const [search, setSearch] = useState('');

  async function reload() {
    setLoading(true);
    try {
      const { items } = await quoteConsultationsApi.list(projectId);
      setItems(items);
    } catch (e) {
      console.warn('견적상담 로드 실패', e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (projectId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleRemove(item) {
    if (!confirm(`${formatDateTime(item.occurredAt)} 상담 기록을 삭제할까요?`)) return;
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    try {
      await quoteConsultationsApi.remove(projectId, item.id);
    } catch (e) {
      setItems(snapshot);
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 필터링
  const filtered = useMemo(() => {
    let list = items;
    if (filterChannel) list = list.filter((x) => x.channel === filterChannel);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((x) =>
        (x.body || '').toLowerCase().includes(q) ||
        (x.topic || '').toLowerCase().includes(q) ||
        (x.nextAction || '').toLowerCase().includes(q) ||
        (x.attendee || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, filterChannel, search]);

  return (
    <div className="space-y-4">
      {/* 헤더: 추가 버튼 + 검색·필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800"
        >
          + 새 상담
        </button>
        <div className="text-sm text-gray-500 ml-2">총 {items.length}건</div>
        <div className="flex-1" />
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="text-sm px-2 py-1.5 border rounded"
        >
          <option value="">전체 채널</option>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="본문·주제·다음액션 검색"
          className="text-sm px-3 py-1.5 border rounded w-56 max-w-full"
        />
      </div>

      {/* 카드 타임라인 */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-8 text-center text-sm text-gray-500">
          {items.length === 0
            ? '아직 견적상담 기록이 없습니다. 통화·미팅 후 [+ 새 상담]으로 빠르게 기록하세요.'
            : '조건에 맞는 기록이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ConsultationCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <ConsultationModal
          projectId={projectId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); reload(); }}
        />
      )}
      {editing && (
        <ConsultationModal
          projectId={projectId}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

// ============================================
// 카드
// ============================================
function ConsultationCard({ item, onEdit, onRemove }) {
  const ch = channelMeta(item.channel);
  const re = reactionMeta(item.reaction);
  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
      {/* 메타 헤더 */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2 flex-wrap">
        <span className="font-medium">{ch.icon} {formatDateTime(item.occurredAt)}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">{item.author?.name || '—'}</span>
        {item.topic && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-navy-700 font-medium">{item.topic}</span>
          </>
        )}
        {re && (
          <span className={`text-xs px-1.5 py-0.5 rounded border ${re.color}`}>{re.label}</span>
        )}
        {item.quoteRound != null && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
            {item.quoteRound}차 견적
          </span>
        )}
        {item.attendee && (
          <span className="text-xs text-gray-500">응대: {item.attendee}</span>
        )}
        <div className="flex-1" />
        <button onClick={onEdit} className="text-xs text-gray-500 hover:text-navy-700">수정</button>
        <button onClick={onRemove} className="text-xs text-rose-500 hover:underline">삭제</button>
      </div>

      {/* 본문 */}
      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{item.body}</div>

      {/* 다음 액션 */}
      {item.nextAction && (
        <div className="mt-3 pt-3 border-t border-dashed text-sm">
          <span className="text-gray-500 mr-1">👉 다음:</span>
          <span className="text-navy-800">{item.nextAction}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// 새/수정 모달
// ============================================
function ConsultationModal({ projectId, existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    occurredAt: existing?.occurredAt ? toLocalDateTimeInput(existing.occurredAt) : toLocalDateTimeInput(new Date()),
    channel: existing?.channel || 'PHONE',
    topic: existing?.topic || '',
    body: existing?.body || '',
    nextAction: existing?.nextAction || '',
    attendee: existing?.attendee || '',
    reaction: existing?.reaction || '',
    quoteRound: existing?.quoteRound != null ? String(existing.quoteRound) : '',
  });
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(existing?.attendee || existing?.reaction || existing?.quoteRound != null)
  );
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    if (!form.body.trim()) {
      setErr('본문을 입력해주세요');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        occurredAt: new Date(form.occurredAt).toISOString(),
        channel: form.channel,
        topic: form.topic.trim() || null,
        body: form.body.trim(),
        nextAction: form.nextAction.trim() || null,
        attendee: form.attendee.trim() || null,
        reaction: form.reaction || null,
        quoteRound: form.quoteRound ? Number(form.quoteRound) : null,
      };
      if (isEdit) {
        await quoteConsultationsApi.update(projectId, existing.id, payload);
      } else {
        await quoteConsultationsApi.create(projectId, payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || '저장 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-navy-800">{isEdit ? '견적상담 수정' : '+ 새 견적상담'}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="일시 *">
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </Field>
            <Field label="채널 *">
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="주제">
              <input
                list="topic-suggestions"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="자유 입력 또는 선택"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <datalist id="topic-suggestions">
                {TOPIC_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </Field>
          </div>

          <Field label="본문 *">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              autoFocus
              placeholder={'예: "총 견적 6,800만원 부담스럽다고 함. 거실 마루는 예전 거 그대로 쓰겠다고 3,500 줄여달라고 하심"'}
              className="w-full px-3 py-2 border rounded text-sm leading-relaxed"
            />
          </Field>

          <Field label="다음 액션">
            <input
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              placeholder="예: 재견적 4/30까지 / 답방 5/2 14:00"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </Field>

          {/* 펼치기 — 추가 정보 */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-500 hover:text-navy-700"
          >
            {showAdvanced ? '▼' : '▶'} 추가 정보 (응대 고객·반응·연관 견적)
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Field label="응대 고객">
                <input
                  value={form.attendee}
                  onChange={(e) => setForm({ ...form, attendee: e.target.value })}
                  placeholder="예: 부인 / 남편"
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </Field>
              <Field label="고객 반응">
                <select
                  value={form.reaction}
                  onChange={(e) => setForm({ ...form, reaction: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">—</option>
                  {REACTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="견적 라운드">
                <input
                  type="number"
                  min="1"
                  value={form.quoteRound}
                  onChange={(e) => setForm({ ...form, quoteRound: e.target.value })}
                  placeholder="1, 2, 3..."
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </Field>
            </div>
          )}

          {err && <p className="text-sm text-rose-600">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
          >
            {busy ? '저장중...' : (isEdit ? '저장' : '추가')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}

function toLocalDateTimeInput(value) {
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
