import { useState } from 'react';
import { schedulesApi } from '../api/schedules';
import { toDateKey, formatDateDisplay, categoryClass } from '../utils/date';
import { useEscape } from '../hooks/useEscape';

export default function ExtractModal({ projectId, project, onClose }) {
  useEscape(true, onClose);
  const [keyword, setKeyword] = useState('');
  const [fromToday, setFromToday] = useState(true);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!keyword.trim()) { setErr('키워드를 입력하세요'); return; }
    setErr(''); setLoading(true);
    try {
      const from = fromToday ? toDateKey(new Date()) : undefined;
      const res = projectId
        ? await schedulesApi.extract(projectId, { keyword: keyword.trim(), from })
        : await schedulesApi.extractAll({ keyword: keyword.trim(), from });
      setResults(res);
    } catch (e) {
      setErr(e.response?.data?.error || '추출 실패');
    } finally {
      setLoading(false);
    }
  }

  // 일정 결과 또는 현장정보 둘 중 하나라도 있으면 복사 가능
  const hasSchedule = results?.entries?.length > 0;
  const canCopy = hasSchedule || !!project;

  async function copy() {
    if (!canCopy) return;
    const parts = [];

    // 검색 결과 있을 때만 [일정] 섹션 노출. 단순 현장정보 복사 케이스엔 생략.
    if (hasSchedule) {
      const scheduleLines = results.entries.map((e) => {
        const date = e.date.slice(0, 10);
        const proj = !project && e.project?.name ? `${e.project.name} - ` : '';
        return `<${date}> ${proj}${e.content}`;
      });
      parts.push('[일정]');
      parts.push(...scheduleLines);
    }

    if (project) {
      if (parts.length > 0) parts.push('');
      parts.push(`[${project.name}]`);
      if (project.siteAddress) parts.push(`주소: ${project.siteAddress}`);
      if (project.customerPhone) parts.push(`연락처: ${project.customerPhone}`);
      if (project.doorPassword) parts.push(`출입번호: ${project.doorPassword}`);
      if (project.siteNotes) parts.push(`현장정보: ${project.siteNotes}`);
    }

    try {
      await navigator.clipboard.writeText(parts.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('복사 실패: ' + (e?.message || ''));
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">일정 복사</h2>
          <p className="text-xs text-gray-500 mt-0.5">공종 키워드로 일정 검색 후 현장정보와 함께 복사 (협력업체 카톡 공유용)</p>
        </div>

        <div className="px-6 py-4 space-y-3 border-b">
          <div className="flex gap-2">
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="예: 목공, 전기, 타일"
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 outline-none"
            />
            <button
              onClick={run}
              disabled={loading}
              className="px-4 bg-navy-700 text-white rounded-md text-sm hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? '검색 중...' : '추출'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={fromToday}
              onChange={(e) => setFromToday(e.target.checked)}
            />
            오늘 이후 일정만
          </label>
          {err && <div className="text-sm text-rose-600">{err}</div>}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!results && (
            <div className="text-sm text-gray-400 text-center py-8">
              키워드 입력 후 추출 버튼을 누르세요
            </div>
          )}
          {results && results.entries.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              검색 결과가 없습니다
            </div>
          )}
          {results && results.entries.length > 0 && (
            <div className="space-y-2">
              {results.entries.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-2 border rounded-md">
                  <div className="text-xs font-mono text-gray-500 w-20 flex-shrink-0">
                    {formatDateDisplay(e.date.slice(0, 10))}
                  </div>
                  <div className="flex-1 min-w-0">
                    {e.category && (
                      <span className={`inline-block text-xs sm:text-[10px] px-1.5 py-0.5 rounded mr-1 ${categoryClass(e.category)}`}>
                        {e.category}
                      </span>
                    )}
                    {e.project?.name && (
                      <span className="inline-block text-xs sm:text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded mr-1">
                        {e.project.name}
                      </span>
                    )}
                    <span className="text-sm">{e.content}</span>
                  </div>
                  {e.confirmed && <span className="text-emerald-500 text-sm">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {results && `${results.entries.length}건`}
          </div>
          <div className="flex gap-2">
            {canCopy && (
              <button
                onClick={copy}
                className={`px-3 py-1.5 text-sm rounded transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {copied
                  ? '✓ 복사됨'
                  : (hasSchedule ? '📋 일정 + 현장정보 복사' : '📋 현장정보만 복사')}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
