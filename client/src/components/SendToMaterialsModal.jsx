import { useEffect, useMemo, useState } from 'react';
import { useEscape } from '../hooks/useEscape';
import { normalizePhase, isOther } from '../utils/phases';

// 견적 → 마감재 내보내기 선택 모달
// 그룹 헤더(isGroup=true) 기준으로 그룹화 → 체크박스 (디폴트 모두 체크).
// 항목(isGroup=false)은 그룹 하위에 보기용으로 노출 (개별 체크 X).
// 그룹 헤더가 하나도 없는 평탄 견적은 각 라인을 단일 그룹으로 fallback.
export default function SendToMaterialsModal({ quoteTitle, lines = [], onSend, onCancel, sending }) {
  useEscape(!sending, onCancel);

  const groups = useMemo(() => buildGroupsFromLines(lines), [lines]);

  // 디폴트: 모든 그룹 체크
  const [checked, setChecked] = useState(() => new Set(groups.map((g) => g.rawName)));

  // lines 변경 시 (드물지만) 체크 상태 재초기화
  useEffect(() => {
    setChecked(new Set(groups.map((g) => g.rawName)));
  }, [groups]);

  const toggleAll = () => {
    if (checked.size === groups.length) setChecked(new Set());
    else setChecked(new Set(groups.map((g) => g.rawName)));
  };

  const toggleOne = (name) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const allChecked = checked.size === groups.length && groups.length > 0;
  const noneChecked = checked.size === 0;

  function submit() {
    if (sending) return;
    if (noneChecked) return;
    onSend(Array.from(checked));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={sending ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:ring-1 dark:ring-white/10 w-full max-w-lg flex flex-col max-h-[85vh]"
      >
        <div className="px-5 pt-5 pb-3 border-b dark:border-white/10">
          <h3 className="text-base font-semibold text-navy-800 dark:text-navy-200">📦 마감재로 보내기</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            견적 "{quoteTitle || '제목 없음'}"의 그룹을 선택해 마감재 탭으로 보냅니다.<br />
            그룹은 <b>공간/공정</b>으로, 그 하위 항목은 마감재 행으로 추가됩니다.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
            견적에 공정 라인이 없습니다.
          </div>
        ) : (
          <>
            <div className="px-5 py-2 border-b dark:border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleAll}
                className="text-navy-700 dark:text-navy-300 hover:underline"
              >
                {allChecked ? '전체 해제' : '전체 선택'}
              </button>
              <span className="text-gray-500 dark:text-gray-400">
                {checked.size} / {groups.length} 그룹 선택
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {groups.map((g) => {
                const isChecked = checked.has(g.rawName);
                const phase = normalizePhase(g.rawName);
                const showBadge = !isOther(phase.label) && phase.label !== g.rawName;
                return (
                  <label
                    key={g.rawName}
                    className={`block px-2 py-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${
                      isChecked ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(g.rawName)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-navy-800 dark:text-navy-200">
                        {g.rawName}
                      </span>
                      {showBadge && (
                        <span
                          title={`마감재 그룹명: "${phase.label}"`}
                          className="text-[10px] px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          → {phase.label}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">
                        {g.items.length > 0 ? `${g.items.length}개 항목` : '빈 그룹'}
                      </span>
                    </div>
                    {g.items.length > 0 && (
                      <ul className="mt-1 pl-7 space-y-0.5">
                        {g.items.map((it, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-600 dark:text-gray-400 truncate"
                            title={it.itemName}
                          >
                            • {it.itemName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </label>
                );
              })}
            </div>
          </>
        )}

        <div className="px-5 py-3 border-t dark:border-white/10 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={sending || noneChecked || groups.length === 0}
            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
          >
            {sending ? '보내는 중…' : `마감재로 보내기${checked.size > 0 ? ` (${checked.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// 견적 라인 → 그룹 트리.
// 헤더(isGroup=true && !isGroupEnd) → 새 그룹 시작.
// 항목(isGroup=false) → 현재 그룹의 자식. 그룹 외부 항목은 무시.
// 헤더가 하나도 없는 평탄 견적은 각 라인을 단일(빈) 그룹으로 표시.
function buildGroupsFromLines(lines) {
  const map = new Map();
  let currentRaw = null;
  let hasHeader = false;
  for (const l of lines) {
    const raw = String(l.itemName || '').trim();
    if (l.isGroup) {
      if (l.isGroupEnd) {
        currentRaw = null;
        continue;
      }
      if (!raw) continue;
      hasHeader = true;
      currentRaw = raw;
      if (!map.has(raw)) map.set(raw, { rawName: raw, items: [] });
    } else {
      if (!raw) continue;
      if (!currentRaw) continue;
      map.get(currentRaw).items.push({ itemName: raw });
    }
  }
  if (!hasHeader) {
    for (const l of lines) {
      const raw = String(l.itemName || '').trim();
      if (!raw) continue;
      if (!map.has(raw)) map.set(raw, { rawName: raw, items: [] });
    }
  }
  return Array.from(map.values());
}
