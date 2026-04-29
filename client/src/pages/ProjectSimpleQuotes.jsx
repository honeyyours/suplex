import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { simpleQuotesApi, SIMPLE_QUOTE_STATUS_META, formatWon, parseWon } from '../api/simpleQuotes';
import { formatDateDot } from '../utils/date';
import { normalizePhase, isOther } from '../utils/phases';
import NewQuoteWithPhasesModal from '../components/NewQuoteWithPhasesModal';
import QuoteGuideDrawer from '../components/QuoteGuideDrawer';

// 그룹 헤더 옆에 표시되는 정규화 미리보기 배지
// 표준 매핑된 경우만 표시 (예: "벽지" → "도배"). OTHER는 자유 텍스트로 처리되니 표시 X.
function PhasePreviewBadge({ text }) {
  if (!text || !text.trim()) return null;
  const phase = normalizePhase(text);
  if (phase.label === text.trim()) return null; // 입력 = 표준 라벨이면 표시 X
  if (isOther(phase.label)) return null; // 자유 텍스트 그대로 — 미리보기 표시 X
  return (
    <span
      title={`견적-마감재 매칭 키: "${phase.label}"`}
      className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200"
    >
      → {phase.label}
    </span>
  );
}

const SAVE_DELAY = 1000;

export default function ProjectSimpleQuotes() {
  const { id: projectId } = useParams();
  const ctx = useOutletContext() || {};
  const reloadActiveQuote = ctx.reloadActiveQuote;
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  async function reload(selectId) {
    setLoading(true);
    try {
      const { quotes } = await simpleQuotesApi.list(projectId);
      setQuotes(quotes);
      if (selectId) setActiveId(selectId);
      else if (!activeId && quotes[0]) setActiveId(quotes[0].id);
      else if (activeId && !quotes.find((q) => q.id === activeId)) {
        setActiveId(quotes[0]?.id || null);
      }
      // 부모(ProjectDetail) 헤더의 활성 견적 요약도 새로고침
      reloadActiveQuote?.();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    /* eslint-disable-next-line */
  }, [projectId]);

  async function handleCreateWithPhases(phaseLabels) {
    try {
      const { quote } = await simpleQuotesApi.create(projectId);
      // 선택된 공종이 있으면 [그룹 헤더 + 빈 라인 1개]씩 일괄 생성
      if (phaseLabels && phaseLabels.length > 0) {
        const lines = [];
        for (const label of phaseLabels) {
          lines.push({
            isGroup: true, isGroupEnd: false,
            itemName: label, spec: '', quantity: 0, unit: '', unitPrice: 0, notes: '',
          });
          lines.push({
            isGroup: false, isGroupEnd: false,
            itemName: '', spec: '', quantity: 1, unit: '식', unitPrice: 0, notes: '',
          });
        }
        await simpleQuotesApi.putLines(projectId, quote.id, lines);
      }
      setShowNewModal(false);
      await reload(quote.id);
    } catch (e) {
      alert('견적 생성 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleDelete(id) {
    if (!confirm('이 견적을 삭제할까요? (되돌릴 수 없음)')) return;
    try {
      await simpleQuotesApi.remove(projectId, id);
      await reload();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleDuplicate(id) {
    try {
      const { quote } = await simpleQuotesApi.duplicate(projectId, id);
      await reload(quote.id);
    } catch (e) {
      alert('복제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  if (loading && quotes.length === 0) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }

  if (quotes.length === 0) {
    return (
      <>
        <div className="text-center py-16">
          <div className="text-sm text-gray-500 mb-4">아직 작성된 간편 견적이 없습니다.</div>
          <button
            onClick={() => setShowNewModal(true)}
            className="text-sm px-5 py-2.5 bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            + 새 간편 견적 작성
          </button>
          <div className="mt-3 text-xs text-gray-400">
            회사 설정의 정보가 자동으로 채워집니다.
          </div>
          <div className="mt-6 pt-4 border-t text-xs text-gray-400">
            <Link to={`/projects/${projectId}/quotes-detail`} className="hover:text-navy-700 hover:underline">
              기존 상세 견적 시스템 보기 →
            </Link>
          </div>
        </div>
        {showNewModal && (
          <NewQuoteWithPhasesModal
            onClose={() => setShowNewModal(false)}
            onCreate={handleCreateWithPhases}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
      <aside>
        <button
          onClick={() => setShowNewModal(true)}
          className="w-full text-sm px-3 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 mb-2"
        >
          + 새 견적
        </button>
        <div className="space-y-1 mb-3">
          {quotes.map((q) => {
            const meta = SIMPLE_QUOTE_STATUS_META[q.status] || SIMPLE_QUOTE_STATUS_META.DRAFT;
            const active = q.id === activeId;
            return (
              <div
                key={q.id}
                className={`group rounded border text-sm ${
                  active ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => setActiveId(q.id)}
                  className="w-full text-left px-3 pt-2 pb-1"
                >
                  <div className="font-medium truncate">{q.title}</div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                    <span className="text-gray-400 tabular-nums">
                      {formatWon(q.total)}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {formatDateDot(q.quoteDate)} · {q._count?.lines || 0}개 항목
                  </div>
                </button>
                <div className="px-2 pb-1.5 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(q.id); }}
                    className="text-xs sm:text-[10px] px-1.5 py-0.5 text-gray-500 hover:text-navy-700 hover:bg-navy-50 rounded opacity-0 group-hover:opacity-100 transition"
                    title="이 견적을 복제해 다음 차수 만들기"
                  >
                    📑 복제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t text-[11px] text-gray-400">
          <Link to={`/projects/${projectId}/quotes-detail`} className="hover:text-navy-700 hover:underline">
            상세 견적 (구버전) →
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {activeId && (
          <QuoteEditor
            projectId={projectId}
            quoteId={activeId}
            previousQuoteId={getPreviousQuoteId(quotes, activeId)}
            onChange={() => reload(activeId)}
            onDelete={() => handleDelete(activeId)}
          />
        )}
      </div>
      </div>
      {showNewModal && (
        <NewQuoteWithPhasesModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateWithPhases}
        />
      )}
    </>
  );
}

// 직전 견적(현재보다 createdAt이 오래된 가장 최근) ID
function getPreviousQuoteId(quotes, currentId) {
  if (!currentId || quotes.length < 2) return null;
  const current = quotes.find((q) => q.id === currentId);
  if (!current) return null;
  const prev = quotes
    .filter((q) => q.id !== currentId && new Date(q.createdAt) < new Date(current.createdAt))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  return prev?.id || null;
}

// ============================================
// QuoteEditor
// ============================================
function QuoteEditor({ projectId, quoteId, previousQuoteId, onChange, onDelete }) {
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingLines, setSavingLines] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [sending, setSending] = useState(false);
  // 우측 견적 가이드 드로어 — 큰 화면에선 기본 열림, 사용자가 닫으면 세션 동안 유지
  const [showGuide, setShowGuide] = useState(true);
  // 활성 라인 인덱스 — 드로어가 그 라인의 그룹 헤더 공정을 자동 추적
  const [activeLineIdx, setActiveLineIdx] = useState(null);

  // 디바운스 타이머 ref
  const linesTimer = useRef(null);
  const headerTimer = useRef(null);
  const linesPending = useRef(null);
  const headerPending = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const { quote } = await simpleQuotesApi.get(projectId, quoteId);
      setQuote(quote);
      setLines(
        (quote.lines || []).map((l) => ({
          _key: l.id,
          isGroup: !!l.isGroup,
          isGroupEnd: !!l.isGroupEnd,
          itemName: l.itemName || '',
          spec: l.spec || '',
          quantity: Number(l.quantity) || 0,
          unit: l.unit || '식',
          unitPrice: Number(l.unitPrice) || 0,
          notes: l.notes || '',
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [quoteId]);

  // ========== 라인 자동 저장 ==========
  function scheduleLineSave(nextLines) {
    linesPending.current = nextLines;
    if (linesTimer.current) clearTimeout(linesTimer.current);
    linesTimer.current = setTimeout(flushLineSave, SAVE_DELAY);
  }

  async function flushLineSave() {
    const pending = linesPending.current;
    if (!pending) return;
    linesPending.current = null;
    setSavingLines(true);
    try {
      const payload = pending.map((l) => ({
        isGroup: !!l.isGroup,
        isGroupEnd: !!l.isGroupEnd,
        itemName: l.itemName || '',
        spec: l.spec || null,
        quantity: Number(l.quantity) || 0,
        unit: l.unit || null,
        unitPrice: Number(l.unitPrice) || 0,
        notes: l.notes || null,
      }));
      const { quote: updated } = await simpleQuotesApi.putLines(projectId, quoteId, payload);
      setQuote(updated);
      onChange?.();
    } catch (e) {
      console.error(e);
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setSavingLines(false);
    }
  }

  // 컴포넌트 언마운트 시 잔여 저장 플러시
  useEffect(() => () => {
    if (linesTimer.current) clearTimeout(linesTimer.current);
    if (headerTimer.current) clearTimeout(headerTimer.current);
    if (linesPending.current) flushLineSave();
    if (headerPending.current) flushHeaderSave();
    /* eslint-disable-next-line */
  }, []);

  // ========== 헤더 자동 저장 ==========
  function scheduleHeaderSave(patch) {
    headerPending.current = { ...(headerPending.current || {}), ...patch };
    if (headerTimer.current) clearTimeout(headerTimer.current);
    headerTimer.current = setTimeout(flushHeaderSave, SAVE_DELAY);
    setQuote((q) => ({ ...q, ...patch }));
  }

  async function flushHeaderSave() {
    const pending = headerPending.current;
    if (!pending) return;
    headerPending.current = null;
    setSavingHeader(true);
    try {
      const { quote: updated } = await simpleQuotesApi.update(projectId, quoteId, pending);
      setQuote(updated);
      onChange?.();
    } catch (e) {
      console.error(e);
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setSavingHeader(false);
    }
  }

  function patchLine(idx, patch) {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      scheduleLineSave(next);
      return next;
    });
  }

  function addLine(focusCol = 'itemName') {
    let newIdx = 0;
    setLines((prev) => {
      newIdx = prev.length;
      const next = [
        ...prev,
        { _key: `tmp-${Date.now()}-${Math.random()}`, isGroup: false, itemName: '', spec: '', quantity: 1, unit: '식', unitPrice: 0, notes: '' },
      ];
      scheduleLineSave(next);
      return next;
    });
    setTimeout(() => focusCell(newIdx, focusCol), 30);
  }

  function addGroup() {
    let newIdx = 0;
    setLines((prev) => {
      newIdx = prev.length;
      const next = [
        ...prev,
        { _key: `tmp-${Date.now()}-${Math.random()}`, isGroup: true, isGroupEnd: false, itemName: '', spec: '', quantity: 0, unit: '', unitPrice: 0, notes: '' },
      ];
      scheduleLineSave(next);
      return next;
    });
    setTimeout(() => focusCell(newIdx, 'itemName'), 30);
  }

  function addGroupEnd() {
    setLines((prev) => {
      const next = [
        ...prev,
        { _key: `tmp-${Date.now()}-${Math.random()}`, isGroup: true, isGroupEnd: true, itemName: '', spec: '', quantity: 0, unit: '', unitPrice: 0, notes: '' },
      ];
      scheduleLineSave(next);
      return next;
    });
  }

  function removeLine(idx) {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      scheduleLineSave(next);
      return next;
    });
  }

  // ========== 키보드 네비게이션 ==========
  // Enter: 같은 컬럼 아래 행, 마지막이면 새 행 자동 추가
  // ↑/↓: 같은 컬럼 위/아래 행 (마지막에서 ↓는 무시 — 새 행 추가 X)
  // ←/→: 커서가 input 끝/처음일 때만 같은 행 좌/우 셀로
  // Tab: 네이티브 (행 내 가로 이동) — 마지막 행 비고 Tab 시 새 행 추가
  const QUOTE_COLS = ['itemName', 'spec', 'quantity', 'unit', 'unitPrice', 'notes'];

  function focusCell(rowIdx, col) {
    // 그룹 헤더 행 등은 itemName만 있을 수 있음 → fallback
    let el = document.querySelector(`[data-quote-cell="${rowIdx}-${col}"]`);
    if (!el && col !== 'itemName') {
      el = document.querySelector(`[data-quote-cell="${rowIdx}-itemName"]`);
    }
    if (el) {
      el.focus();
      if (typeof el.select === 'function') el.select();
    }
  }
  function handleCellKeyDown(e, rowIdx, col) {
    const target = e.target;
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = document.querySelector(`[data-quote-cell="${rowIdx + 1}-${col}"]`);
      if (next) {
        next.focus();
        if (typeof next.select === 'function') next.select();
      } else if (rowIdx + 1 < lines.length) {
        // 다음 행이 있긴 한데 같은 col 셀이 없음 (그룹 헤더) → 그 행의 itemName으로
        focusCell(rowIdx + 1, 'itemName');
      } else {
        addLine(col);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx + 1 < lines.length) focusCell(rowIdx + 1, col);
      // 마지막 행이면 무시 (새 행 추가 X — Enter만)
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) focusCell(rowIdx - 1, col);
      return;
    }
    if (e.key === 'ArrowRight') {
      if (target.selectionStart === target.value.length && target.selectionEnd === target.value.length) {
        const idx = QUOTE_COLS.indexOf(col);
        const nextCol = QUOTE_COLS[idx + 1];
        if (nextCol) {
          e.preventDefault();
          focusCell(rowIdx, nextCol);
        }
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        const idx = QUOTE_COLS.indexOf(col);
        const prevCol = QUOTE_COLS[idx - 1];
        if (prevCol) {
          e.preventDefault();
          focusCell(rowIdx, prevCol);
        }
      }
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && col === 'notes' && rowIdx === lines.length - 1) {
      // 마지막 행 비고에서 Tab → 새 행 추가 + 첫 셀로 포커스
      e.preventDefault();
      addLine('itemName');
    }
  }

  // ⚠ 모든 hook은 early return 위에서 호출되어야 함 (React Hooks 순서 규칙)
  // 각 라인이 어느 그룹 안에 있는지 계산 — 위에서부터 순회하며 inGroup 상태 추적
  // 동시에 각 라인이 속한 그룹 헤더의 itemName(공정명)도 같이 계산
  const linesWithMeta = useMemo(() => {
    let inGroup = false;
    let groupHeaderName = null;
    return lines.map((l) => {
      if (l.isGroup && l.isGroupEnd) {
        const meta = { ...l, _inGroup: false, _groupName: null };
        inGroup = false;
        groupHeaderName = null;
        return meta;
      }
      if (l.isGroup) {
        groupHeaderName = l.itemName || null;
        const meta = { ...l, _inGroup: false, _groupName: groupHeaderName };
        inGroup = true;
        return meta;
      }
      return { ...l, _inGroup: inGroup, _groupName: inGroup ? groupHeaderName : null };
    });
  }, [lines]);

  // 활성 라인의 그룹 헤더 → 표준 공정 라벨 정규화. OTHER면 가이드 매칭 X.
  const activePhase = useMemo(() => {
    if (activeLineIdx == null) return null;
    const meta = linesWithMeta[activeLineIdx];
    if (!meta || !meta._groupName?.trim()) return null;
    const phase = normalizePhase(meta._groupName);
    if (isOther(phase.label)) return null;
    return phase.label;
  }, [activeLineIdx, linesWithMeta]);

  if (loading || !quote) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }

  // 클라이언트 합계 미리보기 (서버 캐시는 저장 후 갱신, 그룹 헤더는 제외)
  const liveSubtotal = lines.reduce((s, l) => {
    if (l.isGroup) return s;
    return s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
  }, 0);
  const liveDesignFee = Math.round(liveSubtotal * (Number(quote.designFeeRate) / 100));
  const liveSubAfterDesign = liveSubtotal + liveDesignFee + (Number(quote.roundAdjustment) || 0);
  const liveVat = Math.round(liveSubAfterDesign * (Number(quote.vatRate) / 100));
  const liveTotal = liveSubAfterDesign + liveVat;

  return (
    <div className={`space-y-4 ${showGuide ? 'xl:pr-[340px]' : ''} transition-[padding] duration-200`}>
      {/* 헤더 액션 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input
            value={quote.title || ''}
            onChange={(e) => scheduleHeaderSave({ title: e.target.value })}
            className="text-lg font-bold text-navy-800 bg-transparent border-b border-transparent focus:border-navy-400 outline-none px-1 max-w-[120px]"
          />
          <select
            value={quote.status}
            onChange={(e) => scheduleHeaderSave({ status: e.target.value })}
            className="text-xs px-2 py-1 border rounded bg-white"
          >
            {Object.entries(SIMPLE_QUOTE_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <span className="text-[11px] text-gray-400" title="상태를 '수주 확정'으로 바꾸면 자동으로 프로젝트 계약금액에 반영됩니다">
            💡 수주 확정 시 자동 반영
          </span>
          <span className="text-xs text-gray-400">
            {savingLines || savingHeader ? '저장 중...' : '저장됨'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {previousQuoteId && (
            <button
              onClick={async () => {
                if (comparing) return;
                setComparing(true);
                try {
                  const res = await simpleQuotesApi.compare(projectId, quoteId, previousQuoteId);
                  // 푸터의 비교 요약 마커 영역만 교체 (없으면 끝에 추가)
                  const next = injectCompareSummary(quote.footerNotes || '', res.summary);
                  scheduleHeaderSave({ footerNotes: next });
                  alert(`✅ 비교 요약을 하단 안내문에 추가했습니다.\n총 차이: ${res.diff > 0 ? '+' : ''}${formatWon(res.diff)}원`);
                } catch (e) {
                  alert('비교 실패: ' + (e.response?.data?.error || e.message));
                } finally {
                  setComparing(false);
                }
              }}
              disabled={comparing}
              className="text-sm px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50 disabled:opacity-60"
              title="AI가 직전 차수와 변경사항을 요약해 하단 안내문에 추가합니다"
            >
              {comparing ? '🤖 분석 중…' : '📊 직전 차수와 비교'}
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="text-sm px-3 py-1.5 border border-navy-300 text-navy-700 rounded hover:bg-navy-50"
          >
            📋 다른 견적에서 가져오기
          </button>
          <button
            onClick={async () => {
              if (sending) return;
              if (!confirm('이 견적의 공정들을 마감재 탭의 빈 그룹으로 추가합니다. 계속할까요?\n(이미 항목이 있는 그룹은 자동 스킵)')) return;
              setSending(true);
              try {
                const res = await simpleQuotesApi.sendToMaterials(projectId, quoteId);
                const newCount = res.addedNames?.length || 0;
                const msg = newCount > 0
                  ? `✅ ${newCount}개 새 그룹 / ${res.skipped}개 중복 스킵 (총 ${res.total}개 공정).\n\n빈 그룹으로 추가되었습니다. 마감재 탭에서 직접 항목을 추가하세요.`
                  : `이미 모든 공정(${res.total}개)이 마감재 그룹으로 등록되어 있습니다.`;
                if (confirm(`${msg}\n\n지금 마감재 탭으로 이동할까요?`)) {
                  navigate(`/projects/${projectId}/materials`, {
                    state: { addedEmptyGroups: res.addedNames || [] },
                  });
                }
              } catch (e) {
                alert('마감재 추가 실패: ' + (e.response?.data?.error || e.message));
              } finally {
                setSending(false);
              }
            }}
            disabled={sending}
            className="text-sm px-3 py-1.5 border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-60"
            title="이 견적의 공정 라인들을 마감재 탭의 빈 그룹으로 자동 추가합니다"
          >
            {sending ? '추가 중…' : '📦 마감재로 보내기'}
          </button>
          {!showGuide && (
            <button
              onClick={() => setShowGuide(true)}
              className="hidden xl:inline-block text-sm px-3 py-1.5 border border-navy-300 text-navy-700 rounded hover:bg-navy-50"
              title="우측 견적 가이드 드로어 열기 (회사 내부 메모 + 견적상담)"
            >
              📖 가이드
            </button>
          )}
          <button
            onClick={() => setShowPrint(true)}
            className="text-sm px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            🖨 PDF 출력
          </button>
          <button
            onClick={onDelete}
            className="text-sm px-3 py-1.5 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
          >
            🗑 삭제
          </button>
        </div>
      </div>

      {/* 헤더 폼 */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <Field label="견적일자">
          <input
            type="date"
            value={quote.quoteDate ? String(quote.quoteDate).slice(0, 10) : ''}
            onChange={(e) => scheduleHeaderSave({ quoteDate: e.target.value })}
            className="w-full px-2 py-1.5 border rounded outline-none focus:border-navy-400"
          />
        </Field>
        <Field label="수신자">
          <input
            value={quote.clientName || ''}
            onChange={(e) => scheduleHeaderSave({ clientName: e.target.value })}
            className="w-full px-2 py-1.5 border rounded outline-none focus:border-navy-400"
            placeholder="○○○ 귀하"
          />
        </Field>
        <Field label="공사명">
          <input
            value={quote.projectName || ''}
            onChange={(e) => scheduleHeaderSave({ projectName: e.target.value })}
            className="w-full px-2 py-1.5 border rounded outline-none focus:border-navy-400"
          />
        </Field>
      </div>

      {/* 라인 테이블 */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ tableLayout: 'fixed' }}
            onFocusCapture={(e) => {
              // 우측 가이드 드로어가 활성 라인의 그룹 헤더 공정을 자동 추적하도록
              const cell = e.target.getAttribute?.('data-quote-cell');
              if (cell) {
                const idx = parseInt(cell.split('-')[0], 10);
                if (Number.isFinite(idx)) setActiveLineIdx(idx);
              }
            }}
          >
            <colgroup>
              <col style={{ width: '110px' }} />{/* 품명 */}
              <col style={{ width: '50px' }} />{/* 규격 */}
              <col style={{ width: '44px' }} />{/* 수량 */}
              <col style={{ width: '36px' }} />{/* 단위 */}
              <col style={{ width: '78px' }} />{/* 단가 */}
              <col style={{ width: '78px' }} />{/* 금액 */}
              <col />{/* 비고 — 나머지 (약 60%) */}
              <col style={{ width: '24px' }} />{/* X */}
            </colgroup>
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-2 py-2">품명 (공정)</th>
                <th className="text-left px-2 py-2">규격</th>
                <th className="text-right px-2 py-2">수량</th>
                <th className="text-center px-2 py-2">단위</th>
                <th className="text-right px-2 py-2">단가</th>
                <th className="text-right px-2 py-2">금액</th>
                <th className="text-left px-2 py-2">비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {linesWithMeta.map((l, idx) => (
                <LineRow
                  key={l._key}
                  line={l}
                  rowIdx={idx}
                  inGroup={l._inGroup}
                  onChange={(patch) => patchLine(idx, patch)}
                  onRemove={() => removeLine(idx)}
                  onCellKeyDown={handleCellKeyDown}
                />
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400 text-sm">
                    아래 [+ 항목 추가] 버튼을 눌러 공정을 추가하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t p-2 flex gap-2 flex-wrap">
          <button
            onClick={() => addLine()}
            className="text-sm px-3 py-1.5 border border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 hover:border-navy-400"
          >
            + 항목 추가
          </button>
          <button
            onClick={addGroup}
            className="text-sm px-3 py-1.5 border border-dashed border-navy-300 rounded text-navy-700 hover:bg-navy-50"
          >
            ＋ 그룹 추가 (예: 화장실)
          </button>
          <button
            onClick={addGroupEnd}
            className="text-sm px-3 py-1.5 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50"
            title="현재 그룹을 종료합니다 (다음 항목부터는 그룹 밖)"
          >
            ↩ 그룹 빠져나오기
          </button>
        </div>
      </div>

      {/* 합계 영역 */}
      <div className="bg-white border rounded-xl p-4">
        <div className="space-y-2 max-w-md ml-auto text-sm">
          <SumRow label="합계" value={liveSubtotal} />
          <SumRow
            label={
              <span className="flex items-center gap-2">
                디자인 및 감리비
                <input
                  type="number"
                  step="0.01"
                  value={quote.designFeeRate}
                  onChange={(e) => scheduleHeaderSave({ designFeeRate: Number(e.target.value) || 0 })}
                  className="w-14 px-1 py-0.5 border rounded text-right text-xs"
                />
                <span className="text-xs text-gray-400">%</span>
              </span>
            }
            value={liveDesignFee}
          />
          <SumRow
            label={
              <span className="flex items-center gap-2 text-gray-500">
                단수조정
                <input
                  type="number"
                  value={quote.roundAdjustment}
                  onChange={(e) => scheduleHeaderSave({ roundAdjustment: Number(e.target.value) || 0 })}
                  className="w-24 px-1 py-0.5 border rounded text-right text-xs"
                />
              </span>
            }
            value={Number(quote.roundAdjustment) || 0}
            neutral
          />
          <SumRow
            label={
              <span className="flex items-center gap-2">
                부가세
                <label className="flex items-center gap-1 text-xs cursor-pointer select-none ml-1">
                  <input
                    type="checkbox"
                    checked={Number(quote.vatRate) > 0}
                    onChange={(e) => {
                      const newRate = e.target.checked ? 10 : 0;
                      const oldRate = Number(quote.vatRate) || 0;
                      const patch = { vatRate: newRate };
                      const VAT_NOTE = '※ 현금영수증 및 세금계산서 발행 시 부가세(10%) 별도이며 견적 외 공사는 추가금이 발생됩니다.';
                      const footer = quote.footerNotes || '';

                      // 0 → 양수(10): 푸터에서 "부가세" 줄 자동 제거
                      if (oldRate === 0 && newRate > 0) {
                        const cleaned = footer
                          .split('\n')
                          .filter((line) => !/부가세/.test(line))
                          .join('\n')
                          .trim();
                        if (cleaned !== footer) patch.footerNotes = cleaned;
                      }
                      // 양수 → 0: 푸터에 "부가세" 줄이 없으면 표준 안내문 자동 추가
                      if (oldRate > 0 && newRate === 0) {
                        const hasVatNote = footer.split('\n').some((line) => /부가세/.test(line));
                        if (!hasVatNote) {
                          patch.footerNotes = footer.trim()
                            ? `${footer.trim()}\n${VAT_NOTE}`
                            : VAT_NOTE;
                        }
                      }
                      scheduleHeaderSave(patch);
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-gray-600">10% 포함</span>
                </label>
              </span>
            }
            value={liveVat}
          />
          <div className="border-t pt-2">
            <SumRow label={<span className="font-bold text-navy-800">총합계</span>} value={liveTotal} highlight />
          </div>
        </div>
      </div>

      {/* 푸터 비고 편집 */}
      <div className="bg-white border rounded-xl p-4">
        <div className="text-xs text-gray-500 mb-1">하단 안내문 (PDF 출력 시 표시)</div>
        <textarea
          value={quote.footerNotes || ''}
          onChange={(e) => scheduleHeaderSave({ footerNotes: e.target.value })}
          rows={3}
          className="w-full text-sm px-2 py-1.5 border rounded outline-none focus:border-navy-400 resize-none"
        />
      </div>

      {/* 다른 견적에서 가져오기 모달 */}
      {showImport && (
        <ImportLinesModal
          projectId={projectId}
          quoteId={quoteId}
          currentQuoteId={quoteId}
          onClose={() => setShowImport(false)}
          onImported={async () => {
            setShowImport(false);
            await load();
            onChange?.();
          }}
        />
      )}

      {/* PDF 미리보기 모달 */}
      {showPrint && (
        <PrintModal
          quote={quote}
          lines={lines}
          totals={{
            subtotal: liveSubtotal,
            designFeeAmount: liveDesignFee,
            vatAmount: liveVat,
            total: liveTotal,
          }}
          onClose={() => setShowPrint(false)}
        />
      )}

      {/* 우측 견적 가이드 드로어 — fixed right, xl 이상에서만 표시.
          작업영역은 위 div의 xl:pr-[340px]로 자리를 비움. */}
      <QuoteGuideDrawer
        projectId={projectId}
        activePhase={activePhase}
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}

// ============================================
// 라인 행
// ============================================
function LineRow({ line, rowIdx, inGroup, onChange, onRemove, onCellKeyDown }) {
  const amount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);

  // 0일 때 빈칸으로 보이게 — type="number" value={0} 일 때 사용자가 새 값을 치면 leading 0 문제 발생
  const displayNum = (v) => (v == null || Number(v) === 0 ? '' : v);
  const onNum = (key) => (e) => {
    const v = e.target.value;
    onChange({ [key]: v === '' ? 0 : (Number(v) || 0) });
  };
  const kd = (col) => (e) => onCellKeyDown(e, rowIdx, col);
  const cellAttrs = (col) => ({ 'data-quote-cell': `${rowIdx}-${col}`, onKeyDown: kd(col) });

  const inputCls = 'w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200';

  // ===== 그룹 종료 마커 (가는 구분선) =====
  if (line.isGroup && line.isGroupEnd) {
    return (
      <tr className="bg-gray-50">
        <td colSpan={7} className="px-2 py-1">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex-1 border-t border-dashed border-gray-300"></span>
            <span>↩ 그룹 종료</span>
            <span className="flex-1 border-t border-dashed border-gray-300"></span>
          </div>
        </td>
        <td className="px-1">
          <button
            onClick={onRemove}
            tabIndex={-1}
            className="text-gray-300 hover:text-rose-500 text-xs"
            title="이 종료 마커 삭제"
          >
            ✕
          </button>
        </td>
      </tr>
    );
  }

  // ===== 그룹 시작 헤더 =====
  if (line.isGroup) {
    return (
      <tr className="bg-navy-50/40">
        <td colSpan={7} className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <span className="text-navy-600 font-bold text-base flex-shrink-0">▸</span>
            <input
              {...cellAttrs('itemName')}
              value={line.itemName}
              onChange={(e) => onChange({ itemName: e.target.value })}
              className="flex-1 px-2 py-1 bg-transparent border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 font-bold text-navy-800"
              placeholder="그룹 이름 (예: 도배·타일·목공 — 표준 25개로 자동 흡수)"
            />
            <PhasePreviewBadge text={line.itemName} />
          </div>
        </td>
        <td className="px-1">
          <button
            onClick={onRemove}
            tabIndex={-1}
            className="text-gray-300 hover:text-rose-500 text-sm"
            title="그룹 삭제"
          >
            ✕
          </button>
        </td>
      </tr>
    );
  }

  // ===== 일반 라인 행 =====
  return (
    <tr className={`hover:bg-gray-50 ${inGroup ? 'bg-navy-50/10' : ''}`}>
      <td className="px-2 py-1.5">
        <div className={`flex items-center gap-1.5 ${inGroup ? 'pl-3 border-l-2 border-navy-300' : ''}`}>
          <input
            {...cellAttrs('itemName')}
            value={line.itemName}
            onChange={(e) => onChange({ itemName: e.target.value })}
            className={inputCls}
            placeholder={inGroup ? '항목명' : '예: 목공'}
          />
        </div>
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('spec')}
          value={line.spec}
          onChange={(e) => onChange({ spec: e.target.value })}
          className={inputCls}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('quantity')}
          type="number"
          step="any"
          value={displayNum(line.quantity)}
          onChange={onNum('quantity')}
          className={inputCls + ' text-right tabular-nums'}
          placeholder="1"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('unit')}
          value={line.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
          className={inputCls + ' text-center'}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('unitPrice')}
          type="number"
          step="any"
          value={displayNum(line.unitPrice)}
          onChange={onNum('unitPrice')}
          className={inputCls + ' text-right tabular-nums'}
          placeholder="0"
        />
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-navy-800 font-medium">
        {formatWon(amount)}
      </td>
      <td className="px-2 py-1.5 align-top">
        <textarea
          {...cellAttrs('notes')}
          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
          value={line.notes}
          onChange={(e) => {
            onChange({ notes: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          rows={1}
          className={inputCls + ' resize-none overflow-hidden leading-snug'}
          placeholder="설명/규격/색상 등 (Enter 줄바꿈)"
        />
      </td>
      <td className="px-1">
        <button
          onClick={onRemove}
          tabIndex={-1}
          className="text-gray-300 hover:text-rose-500 text-sm"
          title="삭제"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {children}
    </label>
  );
}

function SumRow({ label, value, highlight, neutral }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-700">{label}</div>
      <div className={`tabular-nums ${highlight ? 'text-lg font-bold text-navy-800' : neutral ? 'text-gray-500' : 'text-gray-800'}`}>
        {value < 0 ? '-' : ''}{formatWon(Math.abs(value))} 원
      </div>
    </div>
  );
}

// ============================================
// PDF 미리보기 / 인쇄 모달
// styles/index.css 의 body.print-quote .quote-printable 패턴을 재사용
// ============================================
function PrintModal({ quote, lines, totals, onClose }) {
  useEffect(() => {
    document.body.classList.add('print-quote');
    return () => document.body.classList.remove('print-quote');
  }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gray-100 border-b px-4 py-2 flex items-center justify-between no-print">
          <div className="text-sm font-medium">PDF 미리보기</div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
            >
              🖨 인쇄 / PDF 저장
            </button>
            <button onClick={onClose} className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">
              닫기
            </button>
          </div>
        </div>
        <div className="p-6 quote-printable">
          <SimpleQuotePrintView quote={quote} lines={lines} totals={totals} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// 인쇄용 견적서 (classic 템플릿)
// ============================================
function SimpleQuotePrintView({ quote, lines, totals }) {
  const designFeeOn = Number(quote.designFeeRate) > 0;
  const round = Number(quote.roundAdjustment) || 0;
  return (
    <div className="font-sans text-[13px] text-gray-900 quote-print">
      <h1 className="text-3xl font-bold text-center mb-6 underline tracking-widest">견 적 서</h1>

      {/* 헤더 정보 */}
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr>
            <td className="border px-3 py-2 w-1/2 align-top">
              <div className="text-xs text-gray-500">{formatDateDot(quote.quoteDate)}</div>
              <div className="mt-2 text-base font-medium">{quote.clientName || '—'} 귀하</div>
              <div className="mt-1 text-sm text-gray-700">{quote.projectName}</div>
              <div className="mt-2 text-xs text-gray-500">아래와 같이 견적합니다.</div>
            </td>
            <td className="border px-3 py-2 w-1/2 text-xs">
              <div className="font-bold text-sm mb-1">{quote.supplierName}</div>
              <Row k="등록번호" v={quote.supplierRegNo} />
              <Row k="대 표" v={quote.supplierOwner} />
              <Row k="주 소" v={quote.supplierAddress} />
              <Row k="Tel" v={quote.supplierTel} />
              <Row k="E-mail" v={quote.supplierEmail} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* 합계 강조 */}
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr>
            <td className="border bg-gray-50 px-3 py-3 w-32 text-center font-bold">합 계 금 액</td>
            <td className="border px-3 py-3 text-2xl font-bold tabular-nums">
              {formatWon(totals.total)} 원
            </td>
          </tr>
        </tbody>
      </table>

      {/* 라인 테이블 — 비고를 메인 폭(약 60%)으로 */}
      <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '14%' }} />{/* 품명 */}
          <col style={{ width: '7%' }} />{/* 규격 */}
          <col style={{ width: '5%' }} />{/* 수량 */}
          <col style={{ width: '5%' }} />{/* 단위 */}
          <col style={{ width: '10%' }} />{/* 단가 */}
          <col style={{ width: '10%' }} />{/* 금액 */}
          <col />{/* 비고 — 약 49% */}
        </colgroup>
        <thead className="bg-emerald-700 text-white">
          <tr>
            <th className="border px-2 py-2 text-left">품 명</th>
            <th className="border px-2 py-2">규 격</th>
            <th className="border px-2 py-2">수량</th>
            <th className="border px-2 py-2">단위</th>
            <th className="border px-2 py-2">단 가</th>
            <th className="border px-2 py-2">금 액</th>
            <th className="border px-2 py-2 text-left">비 고</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            // 인쇄용도 inGroup 상태 추적해서 들여쓰기 표시
            let inGroup = false;
            return lines.map((l, i) => {
              if (l.isGroup && l.isGroupEnd) {
                inGroup = false;
                // 인쇄에서는 종료 마커 자체를 라인으로 표시하지 않고 그냥 흐름만 종료
                return null;
              }
              if (l.isGroup) {
                inGroup = true;
                return (
                  <tr key={l._key || i} className="bg-emerald-50">
                    <td colSpan={7} className="border px-2 py-1.5 font-bold text-emerald-900">
                      ▸ {l.itemName}
                    </td>
                  </tr>
                );
              }
              const amt = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
              return (
                <tr key={l._key || i}>
                  <td className="border px-2 py-1.5">
                    {inGroup ? <span className="text-gray-400 mr-1">·</span> : null}
                    <span className={inGroup ? 'pl-2' : ''}>{l.itemName}</span>
                  </td>
                  <td className="border px-2 py-1.5 text-center">{l.spec}</td>
                  <td className="border px-2 py-1.5 text-center tabular-nums">{Number(l.quantity) || 0}</td>
                  <td className="border px-2 py-1.5 text-center">{l.unit}</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(l.unitPrice)}</td>
                  <td className="border px-2 py-1.5 text-right tabular-nums">{formatWon(amt)}</td>
                  <td className="border px-2 py-1.5">{l.notes}</td>
                </tr>
              );
            });
          })()}
          {/* 빈 행 채우기 (시각적 안정감) */}
          {Array.from({ length: Math.max(0, 8 - lines.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border px-2 py-1.5">&nbsp;</td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
            </tr>
          ))}

          {/* 합계 영역 */}
          <tr className="bg-yellow-100">
            <td colSpan={5} className="border px-2 py-2 text-center font-bold">합 계</td>
            <td className="border px-2 py-2 text-right tabular-nums font-bold">{formatWon(totals.subtotal)}</td>
            <td className="border"></td>
          </tr>
          {designFeeOn && (
            <tr className="bg-yellow-100">
              <td colSpan={5} className="border px-2 py-2 text-center font-bold">
                설계 및 감리비 ({Number(quote.designFeeRate)}%)
              </td>
              <td className="border px-2 py-2 text-right tabular-nums font-bold">{formatWon(totals.designFeeAmount)}</td>
              <td className="border"></td>
            </tr>
          )}
          {round !== 0 && (
            <tr className="bg-yellow-50">
              <td colSpan={5} className="border px-2 py-2 text-center text-gray-600">단수조정</td>
              <td className="border px-2 py-2 text-right tabular-nums">{round < 0 ? '-' : ''}{formatWon(Math.abs(round))}</td>
              <td className="border"></td>
            </tr>
          )}
          <tr className="bg-yellow-100">
            <td colSpan={5} className="border px-2 py-2 text-center font-bold">
              부가세 ({Number(quote.vatRate)}%)
            </td>
            <td className="border px-2 py-2 text-right tabular-nums font-bold">{formatWon(totals.vatAmount)}</td>
            <td className="border"></td>
          </tr>
          <tr className="bg-yellow-200">
            <td colSpan={5} className="border px-2 py-2 text-center font-bold">총 금 액</td>
            <td className="border px-2 py-2 text-right tabular-nums font-bold text-base">{formatWon(totals.total)}</td>
            <td className="border"></td>
          </tr>
        </tbody>
      </table>

      {/* 푸터 */}
      {quote.footerNotes && (
        <div className="mt-4 text-xs text-gray-700 whitespace-pre-line">
          {quote.footerNotes}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex py-0.5 border-b last:border-b-0">
      <span className="w-16 text-gray-500">{k}</span>
      <span className="text-gray-800">{v || '—'}</span>
    </div>
  );
}

// AI 비교 요약을 footerNotes의 전용 마커 블록에 삽입.
// 기존 마커 블록이 있으면 교체, 없으면 끝에 추가.
const COMPARE_MARK_START = '※ 직전 차수 변경 요약';
function injectCompareSummary(footer, summary) {
  const cleanSummary = String(summary || '').trim();
  if (!cleanSummary) return footer;

  const startIdx = footer.indexOf(COMPARE_MARK_START);
  if (startIdx >= 0) {
    // 기존 블록을 찾아서 교체 — 다음 빈 줄이나 다른 안내문 시작까지를 블록으로 간주
    // 단순화: 시작 마커부터 다음 두 줄 공백 또는 끝까지를 교체
    const after = footer.slice(startIdx);
    const blockEndRel = after.indexOf('\n\n');
    const blockEnd = blockEndRel >= 0 ? startIdx + blockEndRel : footer.length;
    const before = footer.slice(0, startIdx).trimEnd();
    const tail = footer.slice(blockEnd).trimStart();
    return [before, cleanSummary, tail].filter(Boolean).join('\n\n').trim();
  }
  // 끝에 추가
  return (footer.trim() ? `${footer.trim()}\n\n${cleanSummary}` : cleanSummary).trim();
}

// ============================================
// 다른 견적에서 라인 가져오기 모달
// ============================================
function ImportLinesModal({ projectId, quoteId, currentQuoteId, onClose, onImported }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('append');
  const [busy, setBusy] = useState(false);

  async function search(qStr) {
    setLoading(true);
    try {
      const { quotes } = await simpleQuotesApi.sources(projectId, qStr);
      // 현재 견적은 목록에서 제외
      setList(quotes.filter((x) => x.id !== currentQuoteId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 디바운스 검색
  useEffect(() => {
    const t = setTimeout(() => search(q), 250);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [q]);

  async function handleImport() {
    if (!selected) return;
    if (mode === 'replace' && !confirm('현재 견적의 모든 라인을 삭제하고 가져온 라인으로 교체합니다. 계속할까요?')) return;
    setBusy(true);
    try {
      const { importedCount } = await simpleQuotesApi.importLines(projectId, quoteId, selected.id, mode);
      alert(`✅ ${importedCount}개 라인을 가져왔습니다`);
      onImported?.();
    } catch (e) {
      alert('가져오기 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-navy-800">📋 다른 견적에서 라인 가져오기</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="px-4 py-3 border-b">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="프로젝트명 / 고객명 / 견적 차수 검색"
            className="w-full px-3 py-2 border rounded outline-none focus:border-navy-400 text-sm"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-auto px-2 py-2 space-y-1 min-h-[200px]">
          {loading && <div className="text-sm text-gray-400 px-3 py-4">검색 중...</div>}
          {!loading && list.length === 0 && (
            <div className="text-sm text-gray-400 px-3 py-8 text-center">
              {q ? '일치하는 견적이 없습니다' : '회사 내 다른 견적이 없습니다'}
            </div>
          )}
          {list.map((qu) => {
            const meta = SIMPLE_QUOTE_STATUS_META[qu.status] || SIMPLE_QUOTE_STATUS_META.DRAFT;
            const active = selected?.id === qu.id;
            return (
              <button
                key={qu.id}
                onClick={() => setSelected(qu)}
                className={`w-full text-left px-3 py-2 rounded border text-sm ${
                  active ? 'border-navy-700 bg-navy-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-navy-800 truncate">
                    {qu.project?.name || '—'}
                    <span className="ml-2 text-xs text-gray-500">{qu.title}</span>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5 text-xs text-gray-500">
                  <span className="truncate">
                    {qu.project?.customerName || ''} · {qu._count?.lines || 0}개 항목
                  </span>
                  <span className="tabular-nums flex-shrink-0">{formatWon(qu.total)} 원</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs flex items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} className="accent-navy-700" />
              현재 라인 뒤에 추가
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} className="accent-navy-700" />
              모두 교체
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">취소</button>
            <button
              onClick={handleImport}
              disabled={!selected || busy}
              className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-40"
            >
              {busy ? '가져오는 중...' : '가져오기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
