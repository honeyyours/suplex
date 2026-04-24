import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  materialsApi, materialTemplatesApi,
  STATUS_META, KIND_META,
} from '../api/materials';
import MaterialModal from '../components/MaterialModal';

const ALL_KEY = '__ALL__';

export default function ProjectMaterials() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeGroup, setActiveGroup] = useState(ALL_KEY);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [importing, setImporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialsApi.list(id),
  });
  const materials = data?.materials || [];
  const loading = isLoading;

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['materials', id] });
  }

  // spaceGroup별 집계 (사이드바용)
  const groups = useMemo(() => {
    const m = new Map();
    materials.forEach((x) => {
      const key = x.spaceGroup || '기타';
      if (!m.has(key)) m.set(key, { name: key, items: [], firstOrder: x.orderIndex ?? 0 });
      m.get(key).items.push(x);
    });
    const arr = Array.from(m.values());
    arr.sort((a, b) => a.firstOrder - b.firstOrder);
    return arr.map((g) => ({
      ...g,
      total: g.items.length,
      confirmed: g.items.filter((m) => m.status === 'CONFIRMED').length,
    }));
  }, [materials]);

  // 활성 그룹이 사라지면 전체로 폴백
  useEffect(() => {
    if (activeGroup !== ALL_KEY && !groups.find((g) => g.name === activeGroup)) {
      setActiveGroup(ALL_KEY);
    }
  }, [groups, activeGroup]);

  // 메인에 표시할 항목들
  const displayed = useMemo(() => {
    if (activeGroup === ALL_KEY) return materials;
    return materials.filter((m) => (m.spaceGroup || '기타') === activeGroup);
  }, [materials, activeGroup]);

  const total = displayed.length;
  const confirmed = displayed.filter((m) => m.status === 'CONFIRMED').length;
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const headerLabel = activeGroup === ALL_KEY ? '전체' : activeGroup;

  // 메인에서 spaceGroup별로 다시 그룹핑 (전체 보기 시에만 의미있음)
  const displayGroups = useMemo(() => {
    if (activeGroup !== ALL_KEY) {
      return [{ name: activeGroup, items: displayed }];
    }
    const m = new Map();
    displayed.forEach((x) => {
      const key = x.spaceGroup || '기타';
      if (!m.has(key)) m.set(key, { name: key, items: [], firstOrder: x.orderIndex ?? 0 });
      m.get(key).items.push(x);
    });
    return Array.from(m.values()).sort((a, b) => a.firstOrder - b.firstOrder);
  }, [displayed, activeGroup]);

  async function handleImport() {
    if (!confirm('이 프로젝트에 기본 마감재 템플릿을 일괄 추가할까요?\n(기존 항목은 유지됨, 중복되어도 추가됩니다)')) return;
    setImporting(true);
    try {
      let { templates } = await materialTemplatesApi.list();
      if (templates.length === 0) {
        const ok = confirm('회사 템플릿이 비어있습니다. 기본 템플릿(PDF 기반 약 90개)을 먼저 시드할까요?');
        if (!ok) return;
        await materialTemplatesApi.seed();
        ({ templates } = await materialTemplatesApi.list());
      }
      const items = templates.map((t, i) => ({
        kind: t.kind,
        spaceGroup: t.spaceGroup,
        itemName: t.itemName,
        siteNotes: t.defaultSiteNotes,
        orderIndex: i,
      }));
      const { created } = await materialsApi.bulkCreate(id, items);
      alert(`✅ ${created}개 항목이 추가되었습니다`);
      reload();
    } catch (e) {
      alert('가져오기 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* 모바일 그룹 칩 (sm 이하) */}
      <div className="sm:hidden border-b overflow-x-auto px-3 py-2 flex gap-1.5 whitespace-nowrap">
        <GroupChip
          label="전체"
          count={materials.length}
          confirmed={materials.filter((m) => m.status === 'CONFIRMED').length}
          active={activeGroup === ALL_KEY}
          onClick={() => setActiveGroup(ALL_KEY)}
        />
        {groups.map((g) => (
          <GroupChip
            key={g.name}
            label={g.name}
            count={g.total}
            confirmed={g.confirmed}
            active={activeGroup === g.name}
            onClick={() => setActiveGroup(g.name)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] min-h-[480px]">
        {/* 사이드바 (sm 이상) */}
        <aside className="hidden sm:block border-r bg-gray-50/60 py-3">
          <SidebarItem
            name="전체"
            confirmed={materials.filter((m) => m.status === 'CONFIRMED').length}
            total={materials.length}
            active={activeGroup === ALL_KEY}
            onClick={() => setActiveGroup(ALL_KEY)}
          />
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1.5">
            공간/공정
          </div>
          {groups.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-400">항목이 없습니다</div>
          )}
          {groups.map((g) => (
            <SidebarItem
              key={g.name}
              name={g.name}
              confirmed={g.confirmed}
              total={g.total}
              active={activeGroup === g.name}
              onClick={() => setActiveGroup(g.name)}
            />
          ))}
        </aside>

        {/* 메인 */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          {/* 헤더 */}
          <div className="flex items-end justify-between gap-3 flex-wrap pb-3 border-b mb-4">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {activeGroup === ALL_KEY ? '전체 보기' : '공간/공정'}
              </div>
              <h3 className="text-lg font-semibold text-navy-800">{headerLabel}</h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                <span>확정 {confirmed} / {total}</span>
                <div className="w-32 h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="tabular-nums">{pct}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {importing ? '가져오는 중...' : '📋 템플릿'}
              </button>
              <button
                onClick={() => setAdding({
                  spaceGroup: activeGroup === ALL_KEY ? '' : activeGroup,
                  kind: 'FINISH',
                })}
                className="bg-navy-700 hover:bg-navy-800 text-white text-xs px-3 py-1.5 rounded-md"
              >
                + 항목 추가
              </button>
            </div>
          </div>

          {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

          {!loading && materials.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">
              등록된 마감재 항목이 없습니다.
              <br />
              <span className="text-xs">"📋 템플릿"으로 기본 목록을 채울 수 있습니다</span>
            </div>
          )}

          {!loading && materials.length > 0 && displayed.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">
              이 공간/공정에 등록된 항목이 없습니다.
            </div>
          )}

          <div className="space-y-5">
            {displayGroups.map((g) => (
              <div key={g.name}>
                {activeGroup === ALL_KEY && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-1.5 mb-2 border-b border-dashed">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>{g.name}</span>
                    <span className="ml-auto text-[10px] font-normal normal-case text-gray-400">
                      {g.items.length}개
                    </span>
                  </div>
                )}
                <div className="divide-y">
                  {g.items.map((m) => (
                    <Row key={m.id} material={m} onClick={() => setEditing(m)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <MaterialModal
          projectId={id}
          material={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
          onDeleted={reload}
        />
      )}
      {adding && (
        <MaterialModal
          projectId={id}
          material={null}
          defaults={adding}
          onClose={() => setAdding(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function SidebarItem({ name, confirmed, total, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2 px-4 py-1.5 text-[13px] transition relative ${
        active
          ? 'bg-white text-navy-800 font-semibold'
          : 'text-gray-600 hover:bg-white/70'
      }`}
    >
      {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-navy-700" />}
      <span className="flex-1 truncate">{name}</span>
      <span className={`text-[10px] tabular-nums ${active ? 'text-gray-500' : 'text-gray-400'}`}>
        {confirmed}/{total}
      </span>
    </button>
  );
}

function GroupChip({ label, count, confirmed, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
        active ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-gray-700 border-gray-200'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] tabular-nums ${active ? 'text-white/80' : 'text-gray-400'}`}>
        {confirmed}/{count}
      </span>
    </button>
  );
}

function Row({ material, onClick }) {
  const status = STATUS_META[material.status] || STATUS_META.UNDECIDED;
  const kind = KIND_META[material.kind] || KIND_META.FINISH;
  const isAppliance = material.kind === 'APPLIANCE';

  // 자재명 영역 표시
  const hasMaterial = material.brand || material.productName;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-2.5 hover:bg-gray-50 grid grid-cols-[20px_1fr_auto] sm:grid-cols-[20px_minmax(140px,180px)_1fr_auto] items-center gap-3 text-sm group"
    >
      {/* 체크 / 설치 표시 */}
      <span className="flex items-center justify-center">
        {isAppliance ? (
          <span
            className={`text-xs font-semibold ${
              material.installed === true ? 'text-emerald-600' :
              material.installed === false ? 'text-gray-400' : 'text-gray-300'
            }`}
          >
            {material.installed === true ? 'O' : material.installed === false ? 'X' : '—'}
          </span>
        ) : material.checked ? (
          <span className="w-4 h-4 bg-emerald-500 text-white rounded-sm flex items-center justify-center text-[10px]">✓</span>
        ) : (
          <span className="w-4 h-4 border border-gray-300 rounded-sm" />
        )}
      </span>

      {/* 항목명 + 태그 + 시공 노트 */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-gray-800 truncate">{material.itemName}</span>
          <span className={`text-[9px] font-semibold px-1.5 py-px rounded ${kind.color}`}>
            {kind.label}
          </span>
        </div>
        {material.siteNotes && (
          <div className="text-[11px] text-gray-500 truncate mt-0.5">{material.siteNotes}</div>
        )}
      </div>

      {/* 자재명 셀 (sm+에서만 별도 컬럼, mobile은 숨김) */}
      <div className="hidden sm:block min-w-0">
        {hasMaterial ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border rounded text-xs text-gray-700 max-w-full">
            {material.brand && (
              <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1 py-px rounded flex-shrink-0">
                {material.brand}
              </span>
            )}
            <span className="truncate">
              {material.productName || <span className="text-gray-400">자재명 없음</span>}
            </span>
            {(material.spec || material.size) && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-px rounded flex-shrink-0">
                {material.spec || material.size}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">🔍 자재명 입력...</span>
        )}
      </div>

      {/* 상태 */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>
        {status.label}
      </span>
    </button>
  );
}
