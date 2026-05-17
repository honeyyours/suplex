// 체크리스트 즐겨찾기 모달 — "이거 잊지 않으셨나요?" (2026-05-17)
// 회사 즐겨찾기 목록을 보여주고 다중 선택 → 일괄 추가. 새 프로젝트 진입점 + 체크리스트 탭 진입점.
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistFavoritesApi } from '../api/checklistFavorites';
import { useEscape } from '../hooks/useEscape';

const CATEGORY_LABEL = {
  GENERAL: '일반',
  CLIENT_REQUEST: '고객요청',
  DESIGN_TO_FIELD: '디자인→현장',
  TOUCH_UP: '잔손',
  URGENT: '긴급',
};

export default function ChecklistFavoritesModal({ projectId, projectName, onClose, onApplied }) {
  useEscape(true, onClose);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['checklist-favorites'],
    queryFn: () => checklistFavoritesApi.list(),
  });
  const favorites = data?.items || [];

  // 기본은 모두 선택 — "잊지 않으셨나요?" 톤
  useEffect(() => {
    if (favorites.length > 0 && selected.size === 0) {
      setSelected(new Set(favorites.map((f) => f.id)));
    }
  }, [favorites.length]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === favorites.length) setSelected(new Set());
    else setSelected(new Set(favorites.map((f) => f.id)));
  }

  async function apply() {
    if (selected.size === 0) return onClose();
    setBusy(true);
    setErr('');
    try {
      const res = await checklistFavoritesApi.applyToProject(projectId, [...selected]);
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      onApplied?.(res.created);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || '추가 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-bold text-navy-800 dark:text-navy-200">
            이거 잊지 않으셨나요?
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {projectName ? `${projectName} 프로젝트` : '이 프로젝트'}에 회사 즐겨찾기 항목을 일괄 추가합니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="text-sm text-gray-400 text-center py-8">불러오는 중...</div>
          ) : favorites.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8 leading-relaxed">
              등록된 즐겨찾기가 없습니다.<br/>
              체크리스트 항목 옆 ⭐ 버튼으로 즐겨찾기를 등록해보세요.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleAll}
                className="w-full text-xs text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-slate-700 rounded px-2 py-1.5 text-left mb-1"
              >
                {selected.size === favorites.length ? '전체 해제' : '전체 선택'} ({selected.size}/{favorites.length})
              </button>
              <div className="space-y-1">
                {favorites.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(f.id)}
                      onChange={() => toggle(f.id)}
                      className="mt-0.5 w-4 h-4 accent-navy-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-800 dark:text-gray-200">{f.title}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                        {f.phase && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{f.phase}</span>
                        )}
                        {f.category !== 'GENERAL' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            {CATEGORY_LABEL[f.category] || f.category}
                          </span>
                        )}
                        {f.requiresPhoto && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">사진 필수</span>
                        )}
                        {f.daysBefore != null && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">시작 D-{f.daysBefore}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {err && <div className="px-5 py-2 text-sm text-rose-600">{err}</div>}

        <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy || selected.size === 0}
            className="px-4 py-1.5 bg-navy-700 text-white rounded text-sm font-medium hover:bg-navy-800 disabled:opacity-60"
          >
            {busy ? '추가 중...' : selected.size > 0 ? `${selected.size}개 추가` : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
