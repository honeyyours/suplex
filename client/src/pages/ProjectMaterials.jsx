import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  materialsApi, materialTemplatesApi,
  STATUS_META, STATUS_OPTIONS, KIND_META,
} from '../api/materials';
import MaterialModal from '../components/MaterialModal';
import InlineMaterialRow from '../components/InlineMaterialRow';
import StatusPickerPopover from '../components/StatusPickerPopover';

// activeKey 형태: 'ALL' | 'FINISH:전체' | 'APPLIANCE:전체' | 'FINISH:거실' | 'APPLIANCE:주방' ...
const ALL_KEY = 'ALL';

// FINISH 사이드바에서 "공통·설비" 그룹으로 묶일 spaceGroup들 (시드 기준 하드코딩)
const COMMON_SPACE_GROUPS = ['전체 공통', '창호', '설비·스마트홈'];

function buildKey(kind, group) {
  return `${kind}:${group}`;
}

// 진행률 = (CONFIRMED + CHANGED + REUSED) / (전체 - NOT_APPLICABLE)
const DONE_STATUSES = new Set(['CONFIRMED', 'CHANGED', 'REUSED']);
function isDone(m) { return DONE_STATUSES.has(m.status); }
function isNA(m) { return m.status === 'NOT_APPLICABLE'; }
function countProgress(items) {
  const total = items.length;
  const na = items.filter(isNA).length;
  const done = items.filter(isDone).length;
  const denom = total - na;
  const pct = denom > 0 ? Math.round((done / denom) * 100) : 0;
  return { total, na, done, denom, pct };
}

export default function ProjectMaterials() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState(ALL_KEY);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialsApi.list(id),
  });
  const materials = data?.materials || [];
  const loading = isLoading;

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['materials', id] });
  }

  // kind → spaceGroup별 집계
  const sections = useMemo(() => {
    const out = { FINISH: [], APPLIANCE: [] };
    for (const kind of ['FINISH', 'APPLIANCE']) {
      const m = new Map();
      materials.filter((x) => x.kind === kind).forEach((x) => {
        const key = x.spaceGroup || '기타';
        if (!m.has(key)) m.set(key, { name: key, items: [], firstOrder: x.orderIndex ?? 0 });
        m.get(key).items.push(x);
      });
      out[kind] = Array.from(m.values())
        .sort((a, b) => a.firstOrder - b.firstOrder)
        .map((g) => ({
          ...g,
          total: g.items.length,
          confirmed: g.items.filter(isDone).length,
        }));
    }
    return out;
  }, [materials]);

  // FINISH를 공통·설비 / 공간별로 분할
  const finishSplit = useMemo(() => {
    const common = sections.FINISH.filter((g) => COMMON_SPACE_GROUPS.includes(g.name));
    const space = sections.FINISH.filter((g) => !COMMON_SPACE_GROUPS.includes(g.name));
    return { common, space };
  }, [sections.FINISH]);

  const kindTotals = useMemo(() => {
    const out = {};
    for (const kind of ['FINISH', 'APPLIANCE']) {
      const ks = materials.filter((x) => x.kind === kind);
      out[kind] = {
        total: ks.length,
        confirmed: ks.filter(isDone).length,
      };
    }
    return out;
  }, [materials]);

  // 활성 그룹이 사라지면 전체로 폴백
  useEffect(() => {
    if (activeKey === ALL_KEY) return;
    const [kind, group] = activeKey.split(':');
    if (group === '전체') return; // kind 전체 보기는 항상 유효
    if (!sections[kind]?.find((g) => g.name === group)) {
      setActiveKey(ALL_KEY);
    }
  }, [sections, activeKey]);

  // 메인에 표시할 항목들
  const displayed = useMemo(() => {
    if (activeKey === ALL_KEY) return materials;
    const [kind, group] = activeKey.split(':');
    if (group === '전체') return materials.filter((m) => m.kind === kind);
    return materials.filter((m) => m.kind === kind && (m.spaceGroup || '기타') === group);
  }, [materials, activeKey]);

  const { total, na: naCount, done: confirmed, denom, pct } = countProgress(displayed);

  // 평면 리스트 (키보드 네비용). displayed가 이미 정렬된 단일 배열.
  const flatList = useMemo(() => displayed, [displayed]);

  // 화면에서 선택된 항목 ID — 키보드 네비용. flatList 변경 시 유효성 체크
  useEffect(() => {
    if (!selectedId) return;
    if (!flatList.find((m) => m.id === selectedId)) {
      setSelectedId(flatList[0]?.id || null);
      setExpandedId(null);
    }
  }, [flatList, selectedId]);

  // 단일 항목 PATCH (debounce는 InlineRow에서)
  const saveMaterial = useCallback(async (materialId, patch) => {
    try {
      await materialsApi.update(id, materialId, patch);
      queryClient.invalidateQueries({ queryKey: ['materials', id] });
    } catch (e) {
      console.error('save failed:', e);
    }
  }, [id, queryClient]);

  const changeStatus = useCallback(async (materialId, newStatus) => {
    try {
      await materialsApi.update(id, materialId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['materials', id] });
    } catch (e) {
      alert('상태 변경 실패: ' + (e.response?.data?.error || e.message));
    }
  }, [id, queryClient]);

  const deleteMaterial = useCallback(async (materialId) => {
    if (!confirm('이 항목을 삭제할까요?')) return;
    try {
      await materialsApi.remove(id, materialId);
      if (expandedId === materialId) setExpandedId(null);
      if (selectedId === materialId) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['materials', id] });
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }, [id, queryClient, expandedId, selectedId]);

  // 글로벌 키보드 단축키
  useEffect(() => {
    function isInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function handler(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // 펼침 안 input에 focus 중이면 글로벌 단축키 무시 (펼침 안에서 자체 처리)
      if (expandedId && isInputFocused()) return;
      // 모달 열려있으면 무시
      if (editing || adding) return;
      if (flatList.length === 0) return;

      const idx = selectedId ? flatList.findIndex((m) => m.id === selectedId) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = flatList[Math.min(flatList.length - 1, Math.max(0, idx + 1))] || flatList[0];
        setSelectedId(next.id);
        setExpandedId(null);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = flatList[Math.max(0, idx - 1)] || flatList[0];
        setSelectedId(next.id);
        setExpandedId(null);
      } else if ((e.key === 'Enter' || e.key === 'F2') && selectedId) {
        e.preventDefault();
        setExpandedId(selectedId);
      } else if (e.key === 'Escape') {
        if (expandedId) { e.preventDefault(); setExpandedId(null); }
      } else if (selectedId && ['1','2','3','4'].includes(e.key)) {
        e.preventDefault();
        const opt = STATUS_OPTIONS[Number(e.key) - 1];
        if (opt) changeStatus(selectedId, opt.key);
      } else if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteMaterial(selectedId);
      } else if (selectedId && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        const m = flatList.find((x) => x.id === selectedId);
        if (m) setEditing(m);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatList, selectedId, expandedId, editing, adding, changeStatus, deleteMaterial]);

  // 펼침 시 그 행이 선택 상태로
  useEffect(() => { if (expandedId) setSelectedId(expandedId); }, [expandedId]);

  // 펼침 외부 클릭 시 자동 닫기 (저장은 ExpandedEditor의 unmount cleanup에서 flush)
  useEffect(() => {
    if (!expandedId) return;
    function onMouseDown(e) {
      // 어떤 행 또는 그 펼침 영역 안의 클릭은 무시
      if (e.target.closest('[data-material-id]')) return;
      // 모달 안 클릭 무시
      if (e.target.closest('[role="dialog"]')) return;
      setExpandedId(null);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [expandedId]);

  // Tab 흐름: 마지막 필드 → 다음 행 펼침 / Shift+Tab → 이전 행 펼침
  function gotoNextRow() {
    const idx = flatList.findIndex((m) => m.id === selectedId);
    const next = flatList[idx + 1];
    if (next) { setSelectedId(next.id); setExpandedId(next.id); }
  }
  function gotoPrevRow() {
    const idx = flatList.findIndex((m) => m.id === selectedId);
    const prev = flatList[idx - 1];
    if (prev) { setSelectedId(prev.id); setExpandedId(prev.id); }
  }

  const { headerLabel, headerCrumb } = useMemo(() => {
    if (activeKey === ALL_KEY) return { headerLabel: '전체', headerCrumb: '전체 보기' };
    const [kind, group] = activeKey.split(':');
    const kindLabel = KIND_META[kind].label;
    if (group === '전체') return { headerLabel: kindLabel, headerCrumb: '구분' };
    return { headerLabel: group, headerCrumb: kindLabel };
  }, [activeKey]);

  // 메인에서 spaceGroup별로 그룹핑 (전체/kind전체 보기 시 분리)
  const displayGroups = useMemo(() => {
    if (activeKey !== ALL_KEY && !activeKey.endsWith(':전체')) {
      const [, group] = activeKey.split(':');
      return [{ name: group, kind: null, items: displayed }];
    }
    if (activeKey !== ALL_KEY) {
      // kind 전체
      const [kind] = activeKey.split(':');
      return sections[kind].map((g) => ({ ...g, kind }));
    }
    // 전체 보기: FINISH 먼저 그룹핑, 그 다음 APPLIANCE
    return [
      ...sections.FINISH.map((g) => ({ ...g, kind: 'FINISH' })),
      ...sections.APPLIANCE.map((g) => ({ ...g, kind: 'APPLIANCE' })),
    ];
  }, [displayed, activeKey, sections]);

  async function handleImport() {
    if (!confirm('이 프로젝트에 기본 마감재 템플릿을 일괄 추가할까요?\n(기존 항목은 유지됨, 중복되어도 추가됩니다)')) return;
    setImporting(true);
    try {
      let { templates } = await materialTemplatesApi.list();
      if (templates.length === 0) {
        const ok = confirm('회사 템플릿이 비어있습니다. 기본 템플릿(약 130개)을 먼저 시드할까요?');
        if (!ok) return;
        await materialTemplatesApi.seed();
        ({ templates } = await materialTemplatesApi.list());
      }
      const items = templates.map((t, i) => ({
        kind: t.kind,
        spaceGroup: t.spaceGroup,
        subgroup: t.subgroup,
        itemName: t.itemName,
        formKey: t.formKey,
        essential: t.essential,
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

  async function handleClearAll() {
    if (materials.length === 0) {
      alert('삭제할 항목이 없습니다');
      return;
    }
    const confirmText = prompt(
      `⚠️ 이 프로젝트의 마감재 ${materials.length}개를 모두 삭제합니다.\n\n` +
      `복구 불가. 진행하려면 "삭제" 라고 입력하세요.`
    );
    if (confirmText !== '삭제') {
      if (confirmText !== null) alert('취소되었습니다 ("삭제" 정확히 입력해야 진행)');
      return;
    }
    setImporting(true);
    try {
      const { deleted } = await materialsApi.clear(id);
      alert(`✅ ${deleted}개 항목이 삭제되었습니다`);
      reload();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setImporting(false);
    }
  }

  async function handleReseed() {
    const ok = confirm(
      '⚠️ 회사 마감재 템플릿을 최신 기본값(약 130개)으로 덮어씁니다.\n\n' +
      '회사 마스터만 갈아엎고 기존 프로젝트들의 마감재 데이터는 영향 X.\n' +
      '재시드 후 기존 항목들의 폼 매핑(formKey)도 자동으로 새 템플릿 기준 backfill 됩니다.\n\n' +
      '계속할까요?'
    );
    if (!ok) return;
    setImporting(true);
    try {
      const { created } = await materialTemplatesApi.seed(true);
      const { updated } = await materialTemplatesApi.backfillFormKey();
      alert(`✅ 회사 템플릿 ${created}개로 재시드, 기존 항목 ${updated}개 폼 매핑 자동 갱신 완료.`);
      reload();
    } catch (e) {
      alert('재시드 실패: ' + (e.response?.data?.error || e.message));
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
          confirmed={materials.filter(isDone).length}
          active={activeKey === ALL_KEY}
          onClick={() => setActiveKey(ALL_KEY)}
        />
        {sections.FINISH.length > 0 && (
          <span className="text-[10px] text-gray-400 self-center px-1">·마감재</span>
        )}
        {sections.FINISH.map((g) => (
          <GroupChip
            key={`F:${g.name}`}
            label={g.name}
            count={g.total}
            confirmed={g.confirmed}
            active={activeKey === buildKey('FINISH', g.name)}
            onClick={() => setActiveKey(buildKey('FINISH', g.name))}
          />
        ))}
        {sections.APPLIANCE.length > 0 && (
          <span className="text-[10px] text-violet-400 self-center px-1">·가전</span>
        )}
        {sections.APPLIANCE.map((g) => (
          <GroupChip
            key={`A:${g.name}`}
            label={g.name}
            count={g.total}
            confirmed={g.confirmed}
            active={activeKey === buildKey('APPLIANCE', g.name)}
            onClick={() => setActiveKey(buildKey('APPLIANCE', g.name))}
            tone="violet"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] min-h-[480px]">
        {/* 사이드바 (sm 이상) */}
        <aside className="hidden sm:block border-r bg-gray-50/60 py-3">
          <SidebarItem
            name="전체"
            confirmed={materials.filter(isDone).length}
            total={materials.length}
            active={activeKey === ALL_KEY}
            onClick={() => setActiveKey(ALL_KEY)}
          />

          <SidebarSection
            label="🛠 마감재"
            tone="navy"
            kindAllActive={activeKey === buildKey('FINISH', '전체')}
            kindAllCount={kindTotals.FINISH}
            onKindAll={() => setActiveKey(buildKey('FINISH', '전체'))}
            superGroups={[
              { label: '⚙️ 공통·설비', groups: finishSplit.common },
              { label: '🏠 공간별',    groups: finishSplit.space },
            ]}
            activeKey={activeKey}
            kind="FINISH"
            onSelect={(g) => setActiveKey(buildKey('FINISH', g.name))}
          />

          <SidebarSection
            label="🪑 가전·가구"
            tone="violet"
            kindAllActive={activeKey === buildKey('APPLIANCE', '전체')}
            kindAllCount={kindTotals.APPLIANCE}
            onKindAll={() => setActiveKey(buildKey('APPLIANCE', '전체'))}
            superGroups={[
              { label: null, groups: sections.APPLIANCE },
            ]}
            activeKey={activeKey}
            kind="APPLIANCE"
            onSelect={(g) => setActiveKey(buildKey('APPLIANCE', g.name))}
          />
        </aside>

        {/* 메인 */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          {/* 헤더 */}
          <div className="flex items-end justify-between gap-3 flex-wrap pb-3 border-b mb-4">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {headerCrumb}
              </div>
              <h3 className="text-lg font-semibold text-navy-800">{headerLabel}</h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                <span>확정 {confirmed} / {denom}</span>
                {naCount > 0 && <span className="text-gray-400">(해당없음 {naCount})</span>}
                <div className="w-32 h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className="hidden md:block text-[10px] text-gray-400 mt-1">
                ↑↓ 이동 · Enter 펼침 · Tab 다음 칸 · Esc 닫음 · 1/2/3/4 상태 · H 이력 · Del 삭제
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                disabled={importing || materials.length === 0}
                className="text-xs px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                title="이 프로젝트의 마감재 항목 전부 삭제"
              >
                🗑 모두 삭제
              </button>
              <button
                onClick={handleReseed}
                disabled={importing}
                className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50 disabled:opacity-50"
                title="회사 마감재 템플릿(마스터)을 최신 기본값으로 덮어쓰기"
              >
                🔄 마스터 재시드
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {importing ? '가져오는 중...' : '📋 템플릿'}
              </button>
              <button
                onClick={() => {
                  const [kind, group] = activeKey === ALL_KEY ? ['FINISH', ''] : activeKey.split(':');
                  setAdding({
                    spaceGroup: group === '전체' ? '' : group,
                    kind,
                  });
                }}
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
            {displayGroups.map((g, idx) => {
              const showSpaceHeader = activeKey === ALL_KEY || activeKey.endsWith(':전체');
              const dotColor = g.kind === 'APPLIANCE' ? 'bg-violet-400' : 'bg-navy-400';
              // subgroup별로 다시 그룹핑
              const bySubgroup = groupBySubgroup(g.items);
              return (
                <div key={`${g.kind || 'sel'}:${g.name}:${idx}`}>
                  {showSpaceHeader && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-1.5 mb-2 border-b border-dashed">
                      <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                      <span>{g.name}</span>
                      {g.kind && (
                        <span className={`text-[9px] font-normal normal-case px-1.5 py-px rounded ${
                          g.kind === 'APPLIANCE' ? 'bg-violet-100 text-violet-700' : 'bg-navy-100 text-navy-700'
                        }`}>
                          {KIND_META[g.kind].label}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] font-normal normal-case text-gray-400">
                        {g.items.length}개
                      </span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {bySubgroup.map((sub) => (
                      <div key={sub.name || '_'}>
                        {sub.name && (
                          <div className="text-[11px] font-medium text-gray-600 mb-1 px-1 flex items-center gap-1.5">
                            <span>{sub.name}</span>
                            <span className="text-[10px] text-gray-400">· {sub.items.length}</span>
                          </div>
                        )}
                        <div>
                          {sub.items.map((m) => (
                            <InlineMaterialRow
                              key={m.id}
                              material={m}
                              isSelected={selectedId === m.id}
                              isExpanded={expandedId === m.id}
                              onSelect={() => setSelectedId(m.id)}
                              onToggleExpand={() => setExpandedId((cur) => cur === m.id ? null : m.id)}
                              onSave={(patch) => saveMaterial(m.id, patch)}
                              onStatusChange={(s) => changeStatus(m.id, s)}
                              onTabExitForward={gotoNextRow}
                              onTabExitBackward={gotoPrevRow}
                              onDelete={() => deleteMaterial(m.id)}
                              onShowHistory={() => setEditing(m)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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

function SidebarItem({ name, confirmed, total, active, indent = false, tone = 'navy', onClick }) {
  const barColor = tone === 'violet' ? 'bg-violet-600' : 'bg-navy-700';
  const activeText = tone === 'violet' ? 'text-violet-800' : 'text-navy-800';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2 py-1.5 text-[13px] transition relative ${
        indent ? 'pl-7 pr-4' : 'px-4'
      } ${
        active
          ? `bg-white ${activeText} font-semibold`
          : 'text-gray-600 hover:bg-white/70'
      }`}
    >
      {active && <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${barColor}`} />}
      <span className="flex-1 truncate">{name}</span>
      <span className={`text-[10px] tabular-nums ${active ? 'text-gray-500' : 'text-gray-400'}`}>
        {confirmed}/{total}
      </span>
    </button>
  );
}

function SidebarSection({ label, tone, kindAllActive, kindAllCount, onKindAll, superGroups, activeKey, kind, onSelect }) {
  const totalGroups = superGroups.reduce((sum, sg) => sum + sg.groups.length, 0);
  if (totalGroups === 0 && kindAllCount.total === 0) return null;
  return (
    <>
      <div className={`text-[10px] font-semibold uppercase tracking-wider px-4 pt-3 pb-1 ${
        tone === 'violet' ? 'text-violet-500' : 'text-navy-500'
      }`}>
        {label}
      </div>
      <SidebarItem
        name="구분 전체"
        confirmed={kindAllCount.confirmed}
        total={kindAllCount.total}
        active={kindAllActive}
        indent
        tone={tone}
        onClick={onKindAll}
      />
      {superGroups.map((sg, i) => (
        <div key={i}>
          {sg.label && sg.groups.length > 0 && (
            <div className="text-[10px] text-gray-400 font-semibold px-7 pt-2 pb-0.5">
              {sg.label}
            </div>
          )}
          {sg.groups.map((g) => (
            <SidebarItem
              key={g.name}
              name={g.name}
              confirmed={g.confirmed}
              total={g.total}
              active={activeKey === buildKey(kind, g.name)}
              indent
              tone={tone}
              onClick={() => onSelect(g)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function GroupChip({ label, count, confirmed, active, onClick, tone = 'navy' }) {
  const activeBg = tone === 'violet' ? 'bg-violet-700 border-violet-700' : 'bg-navy-700 border-navy-700';
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
        active ? `${activeBg} text-white` : 'bg-white text-gray-700 border-gray-200'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] tabular-nums ${active ? 'text-white/80' : 'text-gray-400'}`}>
        {confirmed}/{count}
      </span>
    </button>
  );
}

function groupBySubgroup(items) {
  const m = new Map();
  for (const it of items) {
    const k = it.subgroup || '';
    if (!m.has(k)) m.set(k, { name: k, items: [], firstOrder: it.orderIndex ?? 0 });
    m.get(k).items.push(it);
  }
  return Array.from(m.values()).sort((a, b) => a.firstOrder - b.firstOrder);
}

function Row({ material, onClick, onStatusChange }) {
  const status = STATUS_META[material.status] || STATUS_META.UNDECIDED;
  const kind = KIND_META[material.kind] || KIND_META.FINISH;
  const isNA = material.status === 'NOT_APPLICABLE';
  const isReused = material.status === 'REUSED';
  const isInheriting = !!material.inheritFromMaterialId && !!material.inheritFrom;
  const muted = isNA;
  const [picker, setPicker] = useState(null); // {x, y} or null

  // 자재명 영역
  const src = isInheriting ? material.inheritFrom : material;
  const hasMaterial = src.brand || src.productName ||
                      (src.customSpec && Object.keys(src.customSpec).length > 0);
  const customSummary = src.customSpec
    ? Object.values(src.customSpec).filter(Boolean).slice(0, 2).join(' · ')
    : '';

  function openPicker(e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPicker({ x: rect.right, y: rect.bottom + 4 });
  }

  return (
    <>
      <div
        role="button"
        onClick={onClick}
        className={`w-full text-left px-2 py-2.5 hover:bg-gray-50 grid grid-cols-[20px_1fr_auto] sm:grid-cols-[20px_minmax(140px,180px)_1fr_auto] items-center gap-3 text-sm cursor-pointer ${muted ? 'opacity-50' : ''}`}
      >
        {/* 체크(V) */}
        <span className="flex items-center justify-center">
          {material.checked ? (
            <span className="w-4 h-4 bg-emerald-500 text-white rounded-sm flex items-center justify-center text-[10px]">✓</span>
          ) : (
            <span className="w-4 h-4 border border-gray-300 rounded-sm" />
          )}
        </span>

        {/* 항목명 + kind 태그 + 시공 노트 */}
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

        {/* 자재명 셀 */}
        <div className="hidden sm:block min-w-0">
          {isReused || isNA ? (
            <span className="text-xs text-gray-400 italic">{isReused ? '♻️ 재사용' : '⊘ 해당 없음'}</span>
          ) : hasMaterial ? (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs max-w-full ${
              isInheriting ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-gray-50 text-gray-700'
            }`}>
              {isInheriting && <span className="text-[10px] flex-shrink-0">🔗</span>}
              {src.brand && (
                <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1 py-px rounded flex-shrink-0">
                  {src.brand}
                </span>
              )}
              <span className="truncate">
                {src.productName || customSummary || <span className="text-gray-400">미입력</span>}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">🔍 자재명 입력...</span>
          )}
        </div>

        {/* 상태 pill — 클릭 시 빠른 변경 팝오버 (모달 안 열림) */}
        <button
          type="button"
          onClick={openPicker}
          title="클릭해서 빠른 변경"
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap hover:ring-2 hover:ring-navy-300 transition ${status.color}`}
        >
          {status.short || status.label}
        </button>
      </div>

      {picker && (
        <StatusPickerPopover
          x={picker.x}
          y={picker.y}
          current={material.status}
          onPick={(s) => { setPicker(null); onStatusChange(s); }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}

