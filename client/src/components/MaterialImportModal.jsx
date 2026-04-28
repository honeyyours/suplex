// 공정별 마감재 불러오기 모달
// 두 가지 소스: (1) 회사 마스터 템플릿  (2) 다른 프로젝트의 같은 공정 마감재
// 사용자가 체크박스로 다중 선택 → 일괄 불러오기
import { useEffect, useMemo, useState } from 'react';
import { materialsApi } from '../api/materials';

export default function MaterialImportModal({ projectId, spaceGroup, kind = 'FINISH', onClose, onImported }) {
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
  function toggleAll(source, list) {
    const allKeys = list.map((it) => keyOf(source, it));
    const allOn = allKeys.every((k) => checked.has(k));
    setChecked((prev) => {
      const next = new Set(prev);
      if (allOn) allKeys.forEach((k) => next.delete(k));
      else allKeys.forEach((k) => next.add(k));
      return next;
    });
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
            <ItemList
              source="other"
              list={others}
              checked={checked}
              keyOf={keyOf}
              onToggle={toggle}
              onToggleAll={() => toggleAll('other', others)}
              renderRow={(m) => (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-gray-800 truncate">{m.itemName}</div>
                    <div className="text-[11px] text-gray-400 whitespace-nowrap">{m.project?.name}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {[m.brand, m.productName, m.modelCode, m.spec].filter(Boolean).join(' · ')}
                  </div>
                  {m.siteNotes && (
                    <div className="text-xs text-gray-500 mt-0.5 italic truncate">📝 {m.siteNotes}</div>
                  )}
                </>
              )}
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
