// 프로젝트 메모 — 현장보고 탭 패턴 (흰 카드 + 태그 chip + 모달 작성)
// 카드: 인라인 편집 + 자동 저장 (Google Keep 사용성 유지)
// 새 메모 작성: 모달 (태그 선택 시 placeholder/hint 동적)
// 필터: 태그 칩 + 검색
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectMemosApi } from '../api/projectMemos';

const SAVE_DELAY = 800;

// 태그 정의 — 6개. AI 어드바이스 입력 신호로 사용. 사용 예시는 모달 placeholder/hint로 노출.
// 자재발주는 본질이 다름(행동 트리거) → wide=true로 한 줄 폭, mono=true로 모노스페이스.
const TAGS = [
  {
    value: '일반',
    chipBg: 'bg-gray-100',
    chipText: 'text-gray-700',
    hint: '자유 메모 — 회의 일정, 아이디어, TODO, 그 외 모든 것',
    examples: [
      '내일 10시 견적서 작성 회의',
      '신축 현장 측정 일정 잡기',
      '박부장님 다음 주 회사 방문',
    ],
  },
  {
    value: '거래처',
    chipBg: 'bg-sky-100',
    chipText: 'text-sky-800',
    hint: '협력업체·시공팀 메모 — 단가, 일정 준수, 품질, 재계약 여부 등',
    examples: [
      '가구 코리아싱크 사장님네 상판 고정 잘 안함. 다음부터 강조 필요',
      '도배사장님한테 장판까지 맡겼더니 장판 퀄리티 떨어짐. 다음부터 다른 시공팀',
      '전기 이사장님 야간 작업 가능. 다급할 때 의뢰',
    ],
  },
  {
    value: 'A/S',
    chipBg: 'bg-rose-100',
    chipText: 'text-rose-800',
    hint: 'A/S·하자·재시공 이력 — 발생 원인, 조치 결과, 책임 소재 기록',
    examples: [
      '문 와꾸가 안맞아서 재발주, 재설치 조치',
      '도배지 이염, 화장대 옆벽 재시공 조치',
      '타일 메지 깨짐, 3월 12일 재시공 조치',
    ],
  },
  {
    value: '피드백',
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-800',
    hint: '자체 회고 — 자재 모델 평가, 디자인 인사이트, 다음에 더 나아지기 위한 메모',
    examples: [
      '가구 상판 모델 너무 예쁨. 주로 많이 사용해보자',
      '영림 *** 필름 모델 생각보다 밝음',
      '마루 *** 모델 생각보다 예쁨, 화이트우드에 적격',
    ],
  },
  {
    value: '자재발주',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-800',
    hint: '발주 정리·복사용 — 카톡으로 복사해 거래처 전송, 정리해두면 다음 발주 시 재활용',
    wide: true,   // 한 줄 폭으로 강조 (col-span)
    examples: [
      '목공 자재 발주 정리',
      '타일 자재 발주 정리',
      '도배 자재 발주 정리',
    ],
  },
  {
    value: '현장 환경',
    chipBg: 'bg-indigo-100',
    chipText: 'text-indigo-800',
    hint: '동일 현장 재진입 시 시행착오 방지 — 이 아파트·건물에 다시 들어왔을 때 알아야 할 것',
    examples: [
      '화장실 벽배수 X, 기존 바닥배수로 되어있음',
      '콘센트 치수가 일반적이지 않음. *** 모델만 호환됨',
      '천장 여유 치수가 거의 없어서 매립등 사용 불가',
    ],
  },
];

function tagStyle(tag) {
  return TAGS.find((t) => t.value === tag) || TAGS[0];
}

export default function ProjectMemo() {
  const { id: projectId } = useParams();
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 / 검색
  const [filterTag, setFilterTag] = useState('전체');
  const [searchQ, setSearchQ] = useState('');

  // 작성 모달
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { memos } = await projectMemosApi.list(projectId);
      setMemos(memos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [projectId]);

  async function handleCreate(payload) {
    try {
      const { memo } = await projectMemosApi.create(projectId, payload);
      setMemos((prev) => [...prev, memo]);
      setCreateOpen(false);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleUpdate(id, patch) {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    try {
      await projectMemosApi.update(projectId, id, patch);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemove(id) {
    if (!confirm('이 메모를 삭제할까요?')) return;
    try {
      await projectMemosApi.remove(projectId, id);
      setMemos((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 클라이언트측 필터·검색
  const filteredMemos = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return memos.filter((m) => {
      if (filterTag !== '전체') {
        const mTag = m.tag || '일반';
        if (mTag !== filterTag) return false;
      }
      if (q) {
        const hay = `${m.title || ''}\n${m.content || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [memos, filterTag, searchQ]);

  const tagCounts = useMemo(() => {
    const c = { 전체: memos.length };
    for (const t of TAGS) c[t.value] = 0;
    for (const m of memos) {
      const k = m.tag || '일반';
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [memos]);

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div>
      {/* 상단: 카운트 + [+ 새 메모] (현장보고 패턴) */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">총 {memos.length}건</div>
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-navy-700 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-md"
        >
          + 새 메모
        </button>
      </div>

      {/* 필터 바 — 태그 칩 + 검색 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterChip label="전체" count={tagCounts['전체']} active={filterTag === '전체'} onClick={() => setFilterTag('전체')} />
        {TAGS.map((t) => (
          <FilterChip
            key={t.value}
            label={t.value}
            count={tagCounts[t.value] || 0}
            active={filterTag === t.value}
            chipBg={t.chipBg}
            chipText={t.chipText}
            onClick={() => setFilterTag(t.value)}
          />
        ))}
        <div className="flex-1 min-w-[160px]">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="검색 (제목/본문)"
            className="w-full text-sm px-3 py-1.5 border rounded-md outline-none focus:border-navy-500"
          />
        </div>
      </div>

      {/* 카드 list */}
      {filteredMemos.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          {memos.length === 0 ? '아직 작성된 메모가 없습니다' : '조건에 맞는 메모가 없습니다'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMemos.map((m) => {
            const s = tagStyle(m.tag || '일반');
            const wrapClass = s.wide ? 'sm:col-span-2 lg:col-span-3' : '';
            return (
              <div key={m.id} className={wrapClass}>
                <MemoCard
                  memo={m}
                  onUpdate={(patch) => handleUpdate(m.id, patch)}
                  onRemove={() => handleRemove(m.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateMemoModal onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      )}
    </div>
  );
}

function FilterChip({ label, count, active, chipBg, chipText, onClick }) {
  const base = 'text-xs px-2.5 py-1 rounded-full border transition';
  if (active) {
    return (
      <button onClick={onClick} className={`${base} bg-navy-700 text-white border-navy-700`}>
        {label} <span className="opacity-70">({count})</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${chipBg || 'bg-white'} ${chipText || 'text-gray-700'} border-gray-200 hover:border-navy-400`}>
      {label} <span className="opacity-60">({count})</span>
    </button>
  );
}

function TagSelect({ value, onChange }) {
  const s = tagStyle(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded border ${s.chipBg} ${s.chipText} border-transparent outline-none cursor-pointer`}
    >
      {TAGS.map((t) => (
        <option key={t.value} value={t.value}>{t.value}</option>
      ))}
    </select>
  );
}

// ===========================================
// 새 메모 작성 모달 — 현장보고 패턴
// ===========================================
function CreateMemoModal({ onClose, onSave }) {
  const [tag, setTag] = useState('일반');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const s = tagStyle(tag);

  async function submit() {
    const t = title.trim();
    const c = content.trim();
    if (!t && !c) return;
    setBusy(true);
    try {
      await onSave({ title: t, content, tag });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">새 메모</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <L label="태그">
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const active = tag === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTag(t.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      active
                        ? 'bg-navy-700 text-white border-navy-700'
                        : `${t.chipBg} ${t.chipText} border-transparent hover:border-navy-400`
                    }`}
                  >
                    {t.value}
                  </button>
                );
              })}
            </div>
          </L>

          {/* 태그별 예시 hint */}
          <div className={`text-xs rounded-md p-3 ${s.chipBg} ${s.chipText}`}>
            <div className="font-semibold mb-1">{s.hint}</div>
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              {s.examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>

          <L label="제목 (선택)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={s.examples[0]}
              className="input"
            />
          </L>
          <L label="내용">
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`예: ${s.examples[1] || s.examples[0]}`}
              className="input resize-y"
            />
          </L>
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button
            onClick={submit}
            disabled={busy || (!title.trim() && !content.trim())}
            className="px-5 py-2 bg-navy-700 text-white rounded-md text-sm disabled:opacity-50"
          >
            {busy ? '저장 중...' : '저장'}
          </button>
        </div>
        <style>{`
          .input { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 7px 10px; font-size: 14px; outline: none; background: white; }
          .input:focus { border-color: #1e3a66; box-shadow: 0 0 0 2px rgba(30,58,102,0.15); }
        `}</style>
      </div>
    </div>
  );
}

function L({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

// ===========================================
// 메모 카드 (현장보고 카드 패턴) — 흰 배경 + 태그 chip + 인라인 편집(자동 저장)
// ===========================================
function MemoCard({ memo, onUpdate, onRemove }) {
  const [title, setTitle] = useState(memo.title || '');
  const [content, setContent] = useState(memo.content || '');
  const [tag, setTag] = useState(memo.tag || '일반');
  const [copied, setCopied] = useState(false);
  const titleTimer = useRef(null);
  const contentTimer = useRef(null);
  const copiedTimer = useRef(null);

  useEffect(() => { setTitle(memo.title || ''); }, [memo.title]);
  useEffect(() => { setContent(memo.content || ''); }, [memo.content]);
  useEffect(() => { setTag(memo.tag || '일반'); }, [memo.tag]);
  useEffect(() => () => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  function handleTitleChange(v) {
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => onUpdate({ title: v }), SAVE_DELAY);
  }
  function handleContentChange(v) {
    setContent(v);
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => onUpdate({ content: v }), SAVE_DELAY);
  }
  function handleTagChange(v) {
    setTag(v);
    onUpdate({ tag: v });
  }

  async function copyAll() {
    const out = title ? `${title}\n${content}` : content;
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  const s = tagStyle(tag);
  // 자재발주는 강조 — 항상 복사 버튼 노출, 좌측 색상 보더
  const accentBorder = s.wide ? 'border-l-4 border-l-amber-400' : '';
  const alwaysShowCopy = !!s.wide;

  return (
    <div className={`bg-white border rounded-lg p-4 group hover:shadow-sm transition ${accentBorder}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <TagSelect value={tag} onChange={handleTagChange} />
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={copyAll}
            className={`px-2 py-1 rounded transition ${copied
              ? 'text-emerald-700 bg-emerald-50'
              : alwaysShowCopy
                ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 font-medium'
                : 'text-gray-400 hover:text-navy-700 hover:bg-gray-50 opacity-0 group-hover:opacity-100'
            }`}
          >
            {copied ? '✓ 복사됨' : alwaysShowCopy ? '📋 복사' : '복사'}
          </button>
          <button
            onClick={onRemove}
            className="px-2 py-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100"
          >
            삭제
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="제목 (선택)"
        className="w-full bg-transparent outline-none text-sm font-semibold text-navy-800 placeholder:text-gray-300 mb-1"
      />
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="메모 작성..."
        rows={Math.min(20, Math.max(3, content.split('\n').length + 1))}
        className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-gray-700 placeholder:text-gray-300"
      />
    </div>
  );
}
