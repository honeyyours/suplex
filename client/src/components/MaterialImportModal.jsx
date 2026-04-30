// 공정별 마감재 불러오기 모달
// 두 가지 소스: (1) 회사 마스터 템플릿  (2) 다른 프로젝트의 같은 phaseKey 마감재
// 매칭: 백엔드가 normalizePhase(spaceGroup).key === 클릭한 그룹의 phaseKey로 필터.
// 즉 클릭이 "방수"여도 다른 프로젝트의 "방수공사"가 같이 잡힘.
// "기타"/비표준 자유 텍스트는 OTHER 키로 통합 — 회사 전 비표준 자료가 한 데 모임.
//
// UI: 다른 프로젝트 탭은 프로젝트별 collapsible 섹션 + 헤더 체크박스로 통째 선택.
import { useEffect, useMemo, useState } from 'react';
import { materialsApi } from '../api/materials';
import { useEscape } from '../hooks/useEscape';

export default function MaterialImportModal({ projectId, spaceGroup, kind = 'FINISH', onClose, onImported }) {
  useEscape(true, onClose);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('templates'); // 'templates' | 'others'
  const [checked, setChecked] = useState(new Set()); // key set
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    materialsApi.importSuggestions(projectId, spaceGroup)
      .then((d) => setData(d))
      .catch((e) => alert('로드 실패: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, [projectId, spaceGroup]);

  const templates = data?.templates || [];
  const others = data?.otherProjectMaterials || [];
  const phaseKey = data?.phaseKey;

  // 다른 프로젝트 탭 — projectId로 group by, 프로젝트명 알파벳 정렬, 그룹 안은 updatedAt desc
  const otherGroups = useMemo(() => {
    const map = new Map();
    for (const m of others) {
      const pid = m.project?.id || '__unknown';
      const pname = m.project?.name || '(이름 없음)';
      if (!map.has(pid)) map.set(pid, { pid, pname, items: [] });
      map.get(pid).items.push(m);
    }
    return Array.from(map.values()).sort((a, b) => a.pname.localeCompare(b.pname, 'ko'));
  }, [others]);

  function keyOf(source, item) {
    return `${source}:${item.id}`;
  }
  function toggle(source, item) {
    const k = keyOf(source, item);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }
  function setMany(keys, on) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) keys.forEach((k) => next.add(k));
      else keys.forEach((k) => next.delete(k));
      return next;
    });
  }
  function toggleAll(source, list) {
    const allKeys = list.map((it) => keyOf(source, it));
    const allOn = allKeys.every((k) => checked.has(k));
    setMany(allKeys, !allOn);
  }
  function toggleProjectGroup(group) {
    const keys = group.items.map((it) => keyOf('other', it));
    const allOn = keys.every((k) => checked.has(k));
    setMany(keys, !allOn);
  }

  const selectedItems = useMemo(() => {
    const items = [];
    for (const t of templates) {
      if (checked.has(keyOf('template', t))) {
        items.push({
          itemName: t.itemName,
          formKey: t.formKey || null,
          subgroup: t.subgroup || null,
          siteNotes: t.defaultSiteNotes || null,
        });
      }
    }
    for (const m of others) {
      if (checked.has(keyOf('other', m))) {
        items.push({
          itemName: m.itemName,
          brand: m.brand || null,
          productName: m.productName || null,
          modelCode: m.modelCode || null,
          spec: m.spec || null,
          siteNotes: m.siteNotes || null,
          sourceUrl: m.sourceUrl || null,
        });
      }
    }
    return items;
  }, [checked, templates, others]);

  async function submit() {
    if (selectedItems.length === 0) return;
    setBusy(true);
    try {
      const r = await materialsApi.importItems(projectId, {
        spaceGroup,
        kind,
        items: selectedItems,
      });
      onImported?.(r);
      onClose?.();
    } catch (e) {
      alert('불러오기 실패: ' + (e.response?.data?.error || e.message));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <header className="px-5 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold text-navy-800">📋 불러오기 — {spaceGroup}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              회사 템플릿 또는 다른 프로젝트의 마감재에서 필요한 항목만 체크해서 가져옵니다
              {phaseKey === 'OTHER' && (
                <span className="ml-1 text-amber-700">(표준 외 자유 분류 — 회사 전체 비표준 자료 통합)</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </header>

        <div className="flex border-b">
          <TabBtn active={tab === 'templates'} onClick={() => setTab('templates')}>
            🏢 회사 템플릿 <span className="text-gray-400">({templates.length})</span>
          </TabBtn>
          <TabBtn active={tab === 'others'} onClick={() => setTab('others')}>
            📦 다른 프로젝트 <span className="text-gray-400">({others.length})</span>
          </TabBtn>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-sm text-gray-400 py-8 text-center">로딩...</div>}
          {!loading && tab === 'templates' && (
            <ItemList
              source="template"
              list={templates}
              checked={checked}
              keyOf={keyOf}
              onToggle={toggle}
              onToggleAll={() => toggleAll('template', templates)}
              renderRow={(t) => (
                <>
                  <div className="font-medium text-gray-800">{t.itemName}</div>
                  <div className="text-xs text-gray-500">
                    {t.spaceGroup && t.spaceGroup !== spaceGroup && (
                      <span className="mr-2 text-amber-700">[{t.spaceGroup}]</span>
                    )}
                    {t.subgroup && <span className="mr-2">{t.subgroup}</span>}
                    {t.formKey && <span className="text-[10px] text-gray-400">[{t.formKey}]</span>}
                  </div>
                  {t.defaultSiteNotes && (
                    <div className="text-xs text-gray-500 mt-0.5 italic">💡 {t.defaultSiteNotes}</div>
                  )}
                </>
              )}
              emptyMsg={`회사 템플릿에 "${spaceGroup}" 공정이 없습니다. Settings에서 등록하면 여기 노출됩니다.`}
            />
          )}
          {!loading && tab === 'others' && (
            <OtherProjectsList
              groups={otherGroups}
              checked={checked}
              keyOf={keyOf}
              onToggle={toggle}
              onToggleProjectGroup={toggleProjectGroup}
              currentSpaceGroup={spaceGroup}
              emptyMsg={`다른 프로젝트의 "${spaceGroup}" 마감재가 없습니다.`}
            />
          )}
        </div>

        <footer className="px-5 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            ☑ <b>{selectedItems.length}</b>개 선택됨
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 border rounded">취소</button>
            <button
              onClick={submit}
              disabled={busy || selectedItems.length === 0}
              className="text-sm px-4 py-2 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
            >{busy ? '불러오는 중...' : `${selectedItems.length}개 불러오기`}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >{children}</button>
  );
}

function ItemList({ source, list, checked, keyOf, onToggle, onToggleAll, renderRow, emptyMsg }) {
  if (list.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center leading-relaxed">{emptyMsg}</div>;
  }
  const allKeys = list.map((it) => keyOf(source, it));
  const allOn = allKeys.every((k) => checked.has(k));
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2 py-1 border-b sticky top-0 bg-white z-10">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={allOn} onChange={onToggleAll} />
          전체 선택/해제
        </label>
      </div>
      {list.map((item) => {
        const k = keyOf(source, item);
        const on = checked.has(k);
        return (
          <label
            key={k}
            className={`flex items-start gap-2 px-2 py-2 rounded cursor-pointer text-sm border ${
              on ? 'bg-emerald-50 border-emerald-200' : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(source, item)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">{renderRow(item)}</div>
          </label>
        );
      })}
    </div>
  );
}

function OtherProjectsList({ groups, checked, keyOf, onToggle, onToggleProjectGroup, currentSpaceGroup, emptyMsg }) {
  if (groups.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center leading-relaxed">{emptyMsg}</div>;
  }
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <ProjectGroupSection
          key={g.pid}
          group={g}
          checked={checked}
          keyOf={keyOf}
          onToggle={onToggle}
          onToggleProjectGroup={() => onToggleProjectGroup(g)}
          currentSpaceGroup={currentSpaceGroup}
        />
      ))}
    </div>
  );
}

function ProjectGroupSection({ group, checked, keyOf, onToggle, onToggleProjectGroup, currentSpaceGroup }) {
  const [collapsed, setCollapsed] = useState(true); // 디폴트 접힘 — 프로젝트가 많을 때 가독성
  const allKeys = group.items.map((it) => keyOf('other', it));
  const allOn = allKeys.every((k) => checked.has(k));
  const someOn = !allOn && allKeys.some((k) => checked.has(k));
  const selectedCount = allKeys.filter((k) => checked.has(k)).length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-navy-50/50 px-3 py-2 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={allOn}
            ref={(el) => { if (el) el.indeterminate = someOn; }}
            onChange={onToggleProjectGroup}
            title="이 프로젝트 통째 선택/해제"
            className="cursor-pointer"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="font-semibold text-navy-800 truncate hover:underline text-left text-sm"
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? '▸' : '▾'} {group.pname}
          </button>
          <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
            {selectedCount > 0 ? `${selectedCount}/` : ''}{group.items.length}개
          </span>
        </div>
        <button
          onClick={onToggleProjectGroup}
          className="text-[11px] px-2 py-0.5 border border-navy-300 text-navy-700 rounded hover:bg-white"
        >{allOn ? '해제' : '전체'}</button>
      </div>
      {!collapsed && (
        <div className="divide-y">
          {group.items.map((m) => {
            const k = keyOf('other', m);
            const on = checked.has(k);
            const groupMismatch = m.spaceGroup && m.spaceGroup !== currentSpaceGroup;
            return (
              <label
                key={k}
                className={`flex items-start gap-2 px-3 py-2 cursor-pointer text-sm ${
                  on ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle('other', m)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div className="font-medium text-gray-800 truncate">{m.itemName}</div>
                    {groupMismatch && (
                      <span className="text-[10px] text-amber-700 whitespace-nowrap">[{m.spaceGroup}]</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {[m.brand, m.productName, m.modelCode, m.spec].filter(Boolean).join(' · ') || <span className="text-gray-300">(상세 없음)</span>}
                  </div>
                  {m.siteNotes && (
                    <div className="text-xs text-gray-500 mt-0.5 italic truncate">📝 {m.siteNotes}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
