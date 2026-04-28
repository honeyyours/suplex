// 공정 현황 — 25개 표준 공정 × 4축(견적·마감재·일정·발주) 통합 뷰
// 메모리 핵심결정 "공정=척추" 시각적 구현. 베타 7-A.
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { formatWon } from '../api/simpleQuotes';
import WorkContextDrawer from '../components/WorkContextDrawer';

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function ProjectProcessOverview() {
  const { id: projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [drawerPhase, setDrawerPhase] = useState(null); // 행 클릭 시 활성 phase

  useEffect(() => {
    setLoading(true);
    projectsApi.processOverview(projectId)
      .then(setData)
      .catch((e) => alert('로드 실패: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, [projectId]);

  const rows = useMemo(() => {
    if (!data) return [];
    if (showAll) {
      // 25개 표준 + 사용 중 비표준(=기타)
      const map = new Map(data.phases.map((r) => [r.phase, r]));
      const list = data.standardPhases.map((p) =>
        map.get(p.label) || {
          phase: p.label,
          quote: { lineCount: 0, total: 0 },
          material: { total: 0, confirmed: 0, undecided: 0 },
          schedule: { firstDate: null, lastDate: null, count: 0 },
          order: { pending: 0, ordered: 0, received: 0, cancelled: 0, changedFlag: 0 },
          risks: [],
          empty: true,
        }
      );
      // 기타가 사용되는 경우 끝에 추가
      const other = data.phases.find((r) => r.phase === '기타');
      if (other && !list.find((x) => x.phase === '기타')) list.push(other);
      return list;
    }
    return data.phases;
  }, [data, showAll]);

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">로딩...</div>;
  if (!data) return null;

  const totalRisks = data.phases.reduce((sum, r) => sum + r.risks.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-800">🦴 공정 현황</h2>
          <div className="text-xs text-gray-500 mt-1">
            25개 표준 공정 척추 기준으로 견적·마감재·일정·발주 4축을 한눈에.
            {data.quote && (
              <> 견적 기준: <b>{data.quote.title}</b> {data.quote.status === 'ACCEPTED' && <span className="text-emerald-700">(수주 확정)</span>}</>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {totalRisks > 0 && (
            <span className="text-rose-600 font-medium">⚠️ 총 {totalRisks}건의 리스크</span>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            25개 전체 표시 (빈 공정 포함)
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-3 text-left">공정</th>
              <th className="px-3 py-3 text-right">견적</th>
              <th className="px-3 py-3 text-left">마감재</th>
              <th className="px-3 py-3 text-left">일정</th>
              <th className="px-3 py-3 text-left">발주</th>
              <th className="px-3 py-3 text-left">리스크</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다</td></tr>
            ) : rows.map((r) => (
              <PhaseRow key={r.phase} row={r} onClick={() => setDrawerPhase(r.phase)} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-gray-400 leading-relaxed">
        💡 행을 클릭하면 그 공정의 4축 상세를 우측 드로어에서 볼 수 있습니다.<br />
        💡 견적 라인 합계는 라인 합산 (디자인비·부가세 별도). 일정 "기타"는 자유 메모로 처리.<br />
        💡 사용 중인 공정만 기본 표시. 매칭 누락을 발견하려면 "25개 전체 표시"를 켜세요.
      </div>

      <WorkContextDrawer
        projectId={projectId}
        phase={drawerPhase}
        open={!!drawerPhase}
        onClose={() => setDrawerPhase(null)}
      />
    </div>
  );
}

function PhaseRow({ row, onClick }) {
  const empty = row.empty;
  const matRate = pct(row.material.confirmed, row.material.total);
  return (
    <tr
      onClick={onClick}
      className={`border-t cursor-pointer ${empty ? 'opacity-50 hover:opacity-100' : 'hover:bg-navy-50/40'}`}>
      {/* 공정 */}
      <td className="px-3 py-3 align-top">
        <span className={`font-semibold ${row.phase === '기타' ? 'text-amber-700' : 'text-navy-800'}`}>
          {row.phase}
        </span>
      </td>
      {/* 견적 */}
      <td className="px-3 py-3 align-top text-right">
        {row.quote.lineCount > 0 ? (
          <>
            <div className="font-semibold text-gray-800 tabular-nums">{formatWon(row.quote.total)}</div>
            <div className="text-[11px] text-gray-500">{row.quote.lineCount}라인</div>
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      {/* 마감재 */}
      <td className="px-3 py-3 align-top">
        {row.material.total > 0 ? (
          <>
            <div className="text-gray-800 tabular-nums text-xs">{row.material.confirmed} / {row.material.total} 확정</div>
            <div className="w-24 h-1 bg-gray-200 rounded mt-1 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${matRate}%` }} />
            </div>
            {row.material.undecided > 0 && (
              <div className="text-[10px] text-amber-700 mt-0.5">미정 {row.material.undecided}</div>
            )}
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      {/* 일정 */}
      <td className="px-3 py-3 align-top">
        {row.schedule.count > 0 ? (
          <>
            <div className="text-gray-800 text-xs">
              {fmtDate(row.schedule.firstDate)}
              {row.schedule.lastDate && row.schedule.lastDate !== row.schedule.firstDate &&
                ` ~ ${fmtDate(row.schedule.lastDate)}`}
            </div>
            <div className="text-[11px] text-gray-500">{row.schedule.count}건</div>
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      {/* 발주 */}
      <td className="px-3 py-3 align-top">
        {(row.order.pending + row.order.ordered + row.order.received + row.order.cancelled) > 0 ? (
          <div className="text-xs space-y-0.5 leading-tight">
            {row.order.pending > 0 && <div className="text-amber-700">대기 {row.order.pending}</div>}
            {row.order.ordered > 0 && <div className="text-sky-700">발주 {row.order.ordered}</div>}
            {row.order.received > 0 && <div className="text-emerald-700">수령 {row.order.received}</div>}
            {row.order.cancelled > 0 && <div className="text-gray-400">취소 {row.order.cancelled}</div>}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      {/* 리스크 */}
      <td className="px-3 py-3 align-top">
        {row.risks.length > 0 ? (
          <div className="space-y-0.5">
            {row.risks.map((rk, i) => (
              <div
                key={i}
                className={`text-[11px] px-1.5 py-0.5 rounded inline-block mr-1 ${
                  rk.level === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  rk.level === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-sky-50 text-sky-700 border border-sky-200'
                }`}
              >{rk.text}</div>
            ))}
          </div>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
