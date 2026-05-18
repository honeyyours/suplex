// 견적 가이드 — 활성 라인의 공정을 자동 추적해 회사 가이드 + 견적상담 메모를 띄움.
//
// 레이아웃 (2026-05-18 봉기님 요청으로 floating panel로 변경):
//   - 화면 어디든 드래그해서 위치 이동 가능, 본문은 줄어들지 않음
//   - 헤더 드래그 → 패널 이동, 좌측·하단 가장자리·우하단 코너 → 리사이즈
//   - 위치(x,y) + 크기(w,h)를 localStorage에 저장, 다시 열 때 복원
//   - 모바일 미표시 (xl 이상에서만)
import { useEffect, useRef, useState } from 'react';
import { phaseNotesApi, GENERAL_PHASE as GENERAL_NOTE, ROLE_LABEL } from '../api/phaseNotes';
import { companyPhaseTipsApi, GENERAL_PHASE as GENERAL_TIP } from '../api/companyPhaseTips';
import { settlementApi } from '../api/settlement';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, F } from '../utils/features';

const POS_KEY = 'quoteGuideDrawerPos';   // {x, y}
const SIZE_KEY = 'quoteGuideDrawerSize'; // {w, h}
const LEGACY_WIDTH_KEY = 'quoteGuideDrawerWidth'; // 이전 폭 키 — size 복원 시 fallback
const MIN_W = 280;
const MAX_W = 900;
const MIN_H = 240;
const DEFAULT_W = 320;

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function loadPos() {
  try {
    const raw = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
    if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) return raw;
  } catch { /* ignore */ }
  return null;
}

function loadSize() {
  try {
    const raw = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
    if (raw && Number.isFinite(raw.w) && Number.isFinite(raw.h)) return raw;
  } catch { /* ignore */ }
  // legacy width fallback
  const legacy = parseInt(localStorage.getItem(LEGACY_WIDTH_KEY) || '', 10);
  if (Number.isFinite(legacy)) return { w: legacy, h: null };
  return null;
}

export default function QuoteGuideDrawer({ projectId, activePhase, open, onClose }) {
  const { auth } = useAuth();
  const canEditTips = hasFeature(auth, F.SETTINGS_QUOTE_GUIDE);

  const [notes, setNotes] = useState([]);
  const [tips, setTips] = useState([]);
  // 회사 누적 정산 노트 (활성 공정에 대해서만 lazy 로드)
  const [settlementNotes, setSettlementNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Floating panel: 위치 + 크기 (localStorage 저장) =====
  const [size, setSize] = useState(() => {
    const saved = loadSize();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const w = clamp(saved?.w || DEFAULT_W, MIN_W, Math.min(MAX_W, vw - 32));
    const h = Math.max(MIN_H, saved?.h || Math.round(vh * 0.8));
    return { w, h };
  });
  const [pos, setPos] = useState(() => {
    const saved = loadPos();
    if (saved) return saved;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1600;
    return { x: vw - DEFAULT_W - 16, y: 80 };
  });

  const posRef = useRef(pos);
  posRef.current = pos;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  // 창 리사이즈 → 패널이 화면 밖으로 나갔으면 클램프
  useEffect(() => {
    function onResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(sizeRef.current.w, vw - 16);
      const h = Math.min(sizeRef.current.h, vh - 16);
      const x = clamp(posRef.current.x, 0, vw - w);
      const y = clamp(posRef.current.y, 0, vh - 40);
      if (w !== sizeRef.current.w || h !== sizeRef.current.h) setSize({ w, h });
      if (x !== posRef.current.x || y !== posRef.current.y) setPos({ x, y });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function startDrag(e) {
    // 헤더 내 버튼/input은 드래그 트리거 X
    if (e.target.closest('button, input, textarea, [data-no-drag]')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...posRef.current };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    function onMove(ev) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const x = clamp(start.x + (ev.clientX - startX), 0, vw - sizeRef.current.w);
      const y = clamp(start.y + (ev.clientY - startY), 0, vh - 40);
      setPos({ x, y });
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // edge: 'left' | 'right' | 'bottom' | 'corner' (우하단 = 폭+높이)
  function startResize(edge) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startSize = { ...sizeRef.current };
      const startPos = { ...posRef.current };
      document.body.style.userSelect = 'none';
      document.body.style.cursor =
        edge === 'left' || edge === 'right' ? 'col-resize' :
        edge === 'bottom' ? 'row-resize' : 'se-resize';
      function onMove(ev) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let { w, h } = startSize;
        let { x, y } = startPos;
        if (edge === 'right' || edge === 'corner') {
          w = clamp(startSize.w + (ev.clientX - startX), MIN_W, Math.min(MAX_W, vw - startPos.x));
        }
        if (edge === 'left') {
          const dx = ev.clientX - startX;
          const newW = clamp(startSize.w - dx, MIN_W, Math.min(MAX_W, startPos.x + startSize.w));
          x = startPos.x + (startSize.w - newW);
          w = newW;
        }
        if (edge === 'bottom' || edge === 'corner') {
          h = clamp(startSize.h + (ev.clientY - startY), MIN_H, vh - startPos.y - 8);
        }
        setSize({ w, h });
        if (x !== startPos.x || y !== startPos.y) setPos({ x, y });
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeRef.current));
        localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  }

  async function reload() {
    const [n, t] = await Promise.all([
      phaseNotesApi.list(projectId).catch(() => ({ notes: [] })),
      companyPhaseTipsApi.list().catch(() => ({ tips: [] })),
    ]);
    setNotes(n.notes || []);
    setTips(t.tips || []);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    reload().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    /* eslint-disable-next-line */
  }, [projectId, open]);

  // 활성 공정 변경 시 회사 누적 정산 노트 로드 (★ 핵심 사이클 — 다음 견적 작성 시 지난 정산 결과 보임)
  useEffect(() => {
    if (!open || !activePhase) { setSettlementNotes([]); return; }
    let cancelled = false;
    settlementApi.companyByPhase(activePhase)
      .then((r) => { if (!cancelled) setSettlementNotes(r.notes || []); })
      .catch(() => { if (!cancelled) setSettlementNotes([]); });
    return () => { cancelled = true; };
  }, [open, activePhase]);

  if (!open) return null;

  const generalNote = notes.find((n) => n.phase === GENERAL_NOTE);
  const phaseNote = activePhase ? notes.find((n) => n.phase === activePhase) : null;
  const generalTip = tips.find((t) => t.phase === GENERAL_TIP);
  const phaseTip = activePhase ? tips.find((t) => t.phase === activePhase) : null;

  return (
    <aside
      style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${size.w}px`, height: `${size.h}px` }}
      className="no-print hidden xl:flex fixed bg-white dark:bg-slate-900 shadow-2xl z-40 flex-col border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden"
    >
      {/* Resize 핸들들 */}
      <div
        onMouseDown={startResize('left')}
        title="좌측 가장자리 — 폭 조절"
        className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize hover:bg-navy-300 active:bg-navy-500 transition-colors z-10"
      />
      <div
        onMouseDown={startResize('right')}
        title="우측 가장자리 — 폭 조절"
        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-navy-300 active:bg-navy-500 transition-colors z-10"
      />
      <div
        onMouseDown={startResize('bottom')}
        title="하단 가장자리 — 높이 조절"
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-navy-300 active:bg-navy-500 transition-colors z-10"
      />
      <div
        onMouseDown={startResize('corner')}
        title="우하단 코너 — 크기 조절"
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-navy-400 active:bg-navy-600 transition-colors z-20"
      />

      {/* 헤더 — 드래그 핸들 */}
      <div
        onMouseDown={startDrag}
        className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500 text-xs" data-no-drag={false}>⋮⋮</span>
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">견적 가이드</div>
            <div className="text-sm font-semibold text-navy-800 dark:text-navy-200 truncate">
              {activePhase || <span className="text-gray-400 dark:text-gray-500 font-normal">전체 공통</span>}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-gray-400 dark:text-gray-500 hover:text-navy-700 dark:hover:text-navy-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded flex-shrink-0"
          title="가이드 닫기"
        >✕</button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading ? (
          <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
        ) : (
          <>
            {/* 🌐 전체 공통 — 상단 고정. 회사 내부 가이드만 (견적상담 메모는 공정별만 의미 있음) */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold tracking-wider text-amber-700">🌐 전체 공통</div>
              <EditableCard
                key="general-tip"
                kind="tip"
                body={generalTip?.body}
                updatedBy={generalTip?.updatedBy}
                canEdit={canEditTips}
                onSave={async (body) => {
                  await companyPhaseTipsApi.upsert(GENERAL_TIP, body);
                  await reload();
                }}
              />
            </div>

            {/* 활성 공정 — 라벨 없음(헤더에 이미 phase 표시), 회사 가이드 + 견적상담 메모 */}
            {activePhase ? (
              <div className="space-y-2 pt-3 border-t">
                <EditableCard
                  key={`phase-tip-${activePhase}`}
                  kind="tip"
                  body={phaseTip?.body}
                  updatedBy={phaseTip?.updatedBy}
                  canEdit={canEditTips}
                  onSave={async (body) => {
                    await companyPhaseTipsApi.upsert(activePhase, body);
                    await reload();
                  }}
                />
                <EditableCard
                  key={`phase-note-${activePhase}`}
                  kind="note"
                  body={phaseNote?.body}
                  updatedBy={phaseNote?.updatedBy}
                  updatedAt={phaseNote?.updatedAt}
                  canEdit={true}
                  onSave={async (body) => {
                    await phaseNotesApi.upsert(projectId, activePhase, body);
                    await reload();
                  }}
                />

                {/* 📊 지난 정산 노트 — 회사 누적, 최근순 (★ 핵심 사이클) */}
                {settlementNotes.length > 0 && (
                  <div className="border rounded-lg bg-violet-50/60 border-violet-200 p-2.5 space-y-1.5">
                    <div className="text-[10px] font-semibold tracking-wider text-violet-700 flex items-center justify-between">
                      <span>📊 지난 정산 노트 (이 회사 누적)</span>
                      <span className="text-violet-500 font-normal">{settlementNotes.length}건</span>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {settlementNotes.map((n) => (
                        <div key={n.id} className="bg-white border border-violet-100 rounded p-2 text-xs">
                          <div className="text-[10px] text-gray-500 mb-0.5">
                            {n.project?.name || '프로젝트'}{n.project?.siteCode ? ` · ${n.project.siteCode}` : ''}
                            {' · '}
                            {n.updatedAt ? String(n.updatedAt).slice(0, 10) : ''}
                          </div>
                          <div className="text-gray-800 whitespace-pre-wrap">{n.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 text-center pt-3 border-t leading-relaxed">
                견적 행을 클릭하면<br/>그 공정의 가이드가 자동으로 표시됩니다.
              </div>
            )}
          </>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
        ⚠️ 회사 가이드는 <b>화면 전용</b>입니다. 견적 PDF에는 표시되지 않습니다. · 헤더 드래그로 이동 · 가장자리/코너 드래그로 크기 조절
      </div>
    </aside>
  );
}

function EditableCard({ kind, body, updatedBy, updatedAt, canEdit, onSave }) {
  const isTip = kind === 'tip';
  const cls = isTip
    ? 'bg-amber-50 border-amber-200'
    : 'bg-sky-50 border-sky-200';
  const labelCls = isTip ? 'text-amber-800' : 'text-sky-800';
  const stampCls = isTip ? 'text-amber-700/70' : 'text-sky-700/70';
  const label = isTip ? '📌 회사 내부 가이드' : '📋 견적상담 메모';
  const placeholder = isTip
    ? (canEdit
        ? '회사 단가, 자주 빠지는 항목 등 내부 메모…'
        : '아직 작성된 회사 가이드가 없습니다 (편집 권한 필요)')
    : '클라이언트 의견, 추가 요청사항 등…';

  const [draft, setDraft] = useState(body || '');
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timerRef.current) setDraft(body || '');
    /* eslint-disable-next-line */
  }, [body]);

  function scheduleSave(value) {
    setDraft(value);
    if (!canEdit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      setSaving(true);
      try {
        await onSave(value);
      } catch (e) {
        alert('저장 실패: ' + (e.response?.data?.error || e.message));
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  return (
    <div className={`border rounded p-2.5 text-xs ${cls}`}>
      <div className={`flex items-center justify-between gap-2 mb-1 text-[10px] font-medium ${labelCls}`}>
        <span>{label}</span>
        {saving && <span className="text-gray-400 font-normal">저장 중…</span>}
      </div>
      <textarea
        value={draft}
        onChange={(e) => scheduleSave(e.target.value)}
        disabled={!canEdit}
        rows={Math.min(6, Math.max(2, (draft || '').split('\n').length))}
        placeholder={placeholder}
        className="w-full bg-transparent text-gray-800 text-xs leading-relaxed outline-none resize-none disabled:text-gray-500 placeholder:text-gray-400"
      />
      {updatedBy && (
        <div className={`text-[10px] mt-1 ${stampCls}`}>
          — {updatedBy.name}{updatedBy.role ? ` (${ROLE_LABEL[updatedBy.role] || updatedBy.role})` : ''}
          {updatedAt && ` · ${new Date(updatedAt).toLocaleDateString('ko-KR')}`}
        </div>
      )}
    </div>
  );
}
