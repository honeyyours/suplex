// 견적 컨텍스트 드로어 — 마감재 작업 중 그 공정의 견적 정보를 우측에 펼침
// 활성 spaceGroup이 바뀌면 자동으로 그 그룹의 견적 라인·비고 표시
// 사용처: ProjectMaterials 페이지
import { useEffect, useMemo, useState } from 'react';
import { simpleQuotesApi, formatWon, SIMPLE_QUOTE_STATUS_META } from '../api/simpleQuotes';

// 가장 우선순위 높은 견적 1개 선택 — ACCEPTED > 가장 최근 updatedAt
function pickPrimaryQuote(quotes) {
  if (!quotes || quotes.length === 0) return null;
  const accepted = quotes.find((q) => q.status === 'ACCEPTED');
  if (accepted) return accepted;
  return [...quotes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
}

// 견적 라인을 매칭 가능한 그룹들로 변환
// 두 패턴 모두 지원:
//   (A) isGroup=true 헤더 + 그 아래 라인들  →  헤더 itemName이 그룹명
//   (B) 평면 라인 (그룹 헤더 없음)         →  각 라인의 itemName 자체가 그룹명
//                                            (sendToMaterials 변환과 동일 키)
// 반환: [{ groupName, lines, subtotal, notes }]
function groupLinesBySection(lines) {
  if (!lines || lines.length === 0) return [];
  const sorted = [...lines].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  const map = new Map(); // groupName → { groupName, lines, subtotal, notes }
  const order = []; // 입력 순서 보존

  function ensureGroup(name) {
    if (!map.has(name)) {
      const g = { groupName: name, lines: [], subtotal: 0, notes: [] };
      map.set(name, g);
      order.push(name);
    }
    return map.get(name);
  }

  // 1) isGroup=true 헤더 기반 그룹화
  let currentHeader = null;
  for (const l of sorted) {
    if (l.isGroup && l.isGroupEnd) { currentHeader = null; continue; }
    if (l.isGroup) {
      currentHeader = (l.itemName || '').trim() || '(이름 없음)';
      ensureGroup(currentHeader);
      continue;
    }
    if (currentHeader) {
      const g = ensureGroup(currentHeader);
      g.lines.push(l);
      g.subtotal += Number(l.amount) || 0;
      if (l.notes) g.notes.push(l.notes);
    }
  }

  // 2) 그룹 헤더 외부의 평면 라인 → 각자 itemName으로 그룹화
  //    (sendToMaterials가 spaceGroup으로 변환하는 것과 동일 키)
  let inHeader = false;
  for (const l of sorted) {
    if (l.isGroup && l.isGroupEnd) { inHeader = false; continue; }
    if (l.isGroup) { inHeader = true; continue; }
    if (inHeader) continue; // 위에서 처리됨
    const name = (l.itemName || '').trim() || '(이름 없음)';
    const g = ensureGroup(name);
    g.lines.push(l);
    g.subtotal += Number(l.amount) || 0;
    if (l.notes) g.notes.push(l.notes);
  }

  return order.map((n) => map.get(n));
}

export default function QuoteContextDrawer({ projectId, activeSpaceGroup, open, onClose }) {
  const [quotes, setQuotes] = useState([]);
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [activeQuote, setActiveQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); // 사용자가 직접 변경 시

  // 처음 펼칠 때 견적 목록 로드
  useEffect(() => {
    if (!open || quotes.length > 0) return;
    let alive = true;
    setLoading(true);
    simpleQuotesApi.list(projectId)
      .then((data) => {
        if (!alive) return;
        const list = data.quotes || data; // backend 응답 호환
        setQuotes(list);
        const primary = pickPrimaryQuote(list);
        if (primary) setActiveQuoteId(primary.id);
      })
      .catch(() => { /* noop */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, projectId]);

  // 활성 견적 상세 로드
  useEffect(() => {
    if (!activeQuoteId) { setActiveQuote(null); return; }
    let alive = true;
    setLoading(true);
    simpleQuotesApi.get(projectId, activeQuoteId)
      .then((data) => { if (alive) setActiveQuote(data.quote || data); })
      .catch(() => { /* noop */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [activeQuoteId, projectId]);

  // 활성 견적의 그룹화된 라인들
  const groups = useMemo(() => groupLinesBySection(activeQuote?.lines), [activeQuote]);

  // 활성 그룹 자동 결정 — 사용자가 직접 선택했으면 그것, 아니면 마감재 사이드바의 활성 spaceGroup과 매칭
  const targetGroup = useMemo(() => {
    if (selectedGroup) return groups.find((g) => g.groupName === selectedGroup) || null;
    if (!activeSpaceGroup) return null;
    // 정확 일치 → 부분 일치(견적 그룹명이 마감재 그룹명을 포함)
    const exact = groups.find((g) => g.groupName === activeSpaceGroup);
    if (exact) return exact;
    return groups.find((g) =>
      g.groupName?.includes(activeSpaceGroup) || activeSpaceGroup.includes(g.groupName)
    ) || null;
  }, [groups, activeSpaceGroup, selectedGroup]);

  // 사이드바에서 그룹이 바뀌면 사용자 직접 선택은 초기화 (자동 매칭 다시)
  useEffect(() => { setSelectedGroup(null); }, [activeSpaceGroup]);

  if (!open) return null;

  return (
    <>
      {/* 오버레이 — 모바일에선 탭 외부 클릭으로 닫기 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l">
        {/* 헤더 */}
        <header className="px-4 py-3 border-b bg-navy-800 text-white flex items-center justify-between">
          <div>
            <div className="text-xs text-navy-100">🪙 견적 컨텍스트</div>
            <div className="font-semibold">
              {targetGroup ? targetGroup.groupName : (activeSpaceGroup || '그룹 선택')}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-navy-100 hover:text-white text-xl leading-none px-2"
            title="닫기"
          >×</button>
        </header>

        {/* 견적 차수 + 그룹 선택 */}
        <div className="px-4 py-2 border-b bg-gray-50 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 w-12">견적</span>
            <select
              value={activeQuoteId || ''}
              onChange={(e) => setActiveQuoteId(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
            >
              {quotes.length === 0 && <option value="">— 견적 없음 —</option>}
              {quotes.map((q) => {
                const meta = SIMPLE_QUOTE_STATUS_META[q.status] || { label: q.status };
                return (
                  <option key={q.id} value={q.id}>
                    {q.title || '(제목없음)'} — {meta.label}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 w-12">공정</span>
            <select
              value={selectedGroup ?? (targetGroup?.groupName || '')}
              onChange={(e) => setSelectedGroup(e.target.value || null)}
              className="flex-1 px-2 py-1 border rounded"
              disabled={groups.length === 0}
            >
              <option value="">— 자동 매칭 ({activeSpaceGroup || '없음'}) —</option>
              {groups.map((g) => (
                <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
          {!loading && quotes.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              이 프로젝트에는 아직 견적이 없습니다.
            </div>
          )}
          {!loading && quotes.length > 0 && !targetGroup && (
            <div className="text-sm text-gray-500 leading-relaxed py-4 px-2 bg-amber-50 border border-amber-200 rounded">
              <b>{activeSpaceGroup || '선택된 그룹'}</b>은 견적에서 매칭되지 않습니다.
              <br />
              상단 "공정" 드롭다운으로 다른 그룹을 직접 선택해보세요.
            </div>
          )}
          {targetGroup && (
            <div className="space-y-3">
              {/* 합계 카드 */}
              <div className="bg-navy-50 border border-navy-200 rounded p-3">
                <div className="text-xs text-navy-700">{targetGroup.groupName} 견적 합계</div>
                <div className="text-2xl font-bold text-navy-800 tabular-nums mt-0.5">
                  {formatWon(targetGroup.subtotal)}원
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  라인 {targetGroup.lines.length}개
                </div>
              </div>

              {/* 라인 목록 */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1.5">견적 라인</div>
                <div className="space-y-1.5">
                  {targetGroup.lines.map((l) => (
                    <div key={l.id} className="text-xs border rounded p-2 hover:bg-gray-50">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-medium text-gray-800 truncate">{l.itemName || '(이름 없음)'}</div>
                        <div className="text-navy-700 font-semibold tabular-nums whitespace-nowrap">
                          {formatWon(Number(l.amount) || 0)}
                        </div>
                      </div>
                      {l.spec && <div className="text-gray-500 mt-0.5">{l.spec}</div>}
                      <div className="text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        {l.quantity != null && <span>수량 {Number(l.quantity)}{l.unit ? ` ${l.unit}` : ''}</span>}
                        {Number(l.unitPrice) > 0 && <span>· 단가 {formatWon(l.unitPrice)}</span>}
                      </div>
                      {l.notes && (
                        <div className="mt-1 text-gray-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 whitespace-pre-line">
                          📝 {l.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  {targetGroup.lines.length === 0 && (
                    <div className="text-xs text-gray-400 italic">라인이 없습니다</div>
                  )}
                </div>
              </div>

              {/* 비고 모음 (그룹 내 모든 비고를 한 곳에) */}
              {targetGroup.notes.length > 1 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1.5">📋 비고 모음</div>
                  <div className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
                    {targetGroup.notes.map((n, i) => (
                      <div key={i} className="whitespace-pre-line">· {n}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 안내 */}
        <footer className="px-4 py-2 border-t bg-gray-50 text-[10px] text-gray-400 leading-relaxed">
          💡 견적이 변경되면 다시 펼쳐 새로고침. 마감재 사이드바에서 다른 그룹 클릭 시 자동 갱신.
        </footer>
      </aside>
    </>
  );
}
