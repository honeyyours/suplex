import { useEffect, useState } from 'react';
import { useEscape } from '../hooks/useEscape';
import { scheduleChangesApi } from '../api/schedules';
import { relativeTime, formatDateDisplay } from '../utils/date';

const ACTION_LABEL = {
  ADD: { label: '추가', color: 'bg-emerald-100 text-emerald-700' },
  UPDATE: { label: '수정', color: 'bg-sky-100 text-sky-700' },
  DELETE: { label: '삭제', color: 'bg-rose-100 text-rose-700' },
  CONFIRM: { label: '확정', color: 'bg-amber-100 text-amber-700' },
  UNCONFIRM: { label: '확정해제', color: 'bg-gray-100 text-gray-700' },
};

export default function ChangesModal({ projectId, onClose }) {
  useEscape(true, onClose);
  const [days, setDays] = useState(3);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const { changes } = await scheduleChangesApi.list(projectId, { days });
      setChanges(changes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [projectId, days]);

  function copyAll() {
    if (!changes.length) return;
    const lines = changes.map((c) => {
      const when = relativeTime(c.createdAt);
      const date = c.date.slice(0, 10);
      const a = ACTION_LABEL[c.action]?.label || c.action;
      let detail = '';
      if (c.action === 'ADD') detail = `+ ${c.newContent}`;
      else if (c.action === 'DELETE') detail = `- ${c.oldContent}`;
      else if (c.action === 'UPDATE') detail = `${c.oldContent} → ${c.newContent}`;
      else detail = c.oldContent || c.newContent || '';
      return `[${a}] ${date} · ${detail} (${c.changedByName}, ${when})`;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    alert(`${lines.length}건 복사됨`);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-navy-800">변동 로그</h2>
            <p className="text-xs text-gray-500 mt-0.5">공정 일정 추가·수정·삭제·확정 이력</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >×</button>
        </div>

        <div className="px-6 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">최근</span>
            {[1, 3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`text-xs px-2.5 py-1 rounded ${
                  days === d ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
          <button
            onClick={copyAll}
            disabled={changes.length === 0}
            className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
          >
            📋 전체 복사
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
          {!loading && changes.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-12">
              최근 {days}일간 변동 내역이 없습니다
            </div>
          )}

          <div className="divide-y">
            {changes.map((c) => {
              const meta = ACTION_LABEL[c.action] || { label: c.action, color: 'bg-gray-100' };
              return (
                <div key={c.id} className="py-3 flex gap-3 items-start">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="text-gray-500 text-xs mb-1">
                      {formatDateDisplay(c.date.slice(0, 10))} · {c.changedByName} · {relativeTime(c.createdAt)}
                    </div>
                    {c.action === 'UPDATE' ? (
                      <div className="space-y-0.5">
                        <div className="text-gray-400 line-through">{c.oldContent}</div>
                        <div className="text-navy-800">→ {c.newContent}</div>
                      </div>
                    ) : c.action === 'DELETE' ? (
                      <div className="text-gray-500 line-through">{c.oldContent}</div>
                    ) : (
                      <div className="text-navy-800">{c.newContent || c.oldContent}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
