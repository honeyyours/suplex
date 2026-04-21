import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  materialsApi, materialTemplatesApi,
  STATUS_META, KIND_META, formatCurrency,
} from '../api/materials';
import MaterialModal from '../components/MaterialModal';

export default function ProjectMaterials() {
  const { id } = useParams();
  const [kind, setKind] = useState('FINISH');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [importing, setImporting] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const { materials } = await materialsApi.list(id);
      setMaterials(materials);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [id]);

  const filtered = useMemo(
    () => materials.filter((m) => m.kind === kind),
    [materials, kind]
  );

  const grouped = useMemo(() => {
    const m = new Map();
    filtered.forEach((x) => {
      const key = x.spaceGroup || '기타';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(x);
    });
    return Array.from(m.entries()); // [[spaceGroup, items]]
  }, [filtered]);

  const total = filtered.length;
  const confirmed = filtered.filter((m) => m.status === 'CONFIRMED').length;
  const checked = filtered.filter((m) => m.checked).length;
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

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
    <div>
      {/* 상단 요약 */}
      <div className="bg-navy-50/60 border rounded-lg p-4 mb-4">
        <div className="flex items-end justify-between mb-2 gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-600 mb-0.5">확정 완료율 ({KIND_META[kind].label})</div>
            <div className="text-xl font-bold text-navy-800">
              {confirmed} / {total}
              {total > 0 && <span className="text-gray-500 font-normal ml-2">({pct}%)</span>}
              <span className="text-sm text-emerald-600 font-normal ml-3">✓ {checked}건 체크</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="text-sm px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {importing ? '가져오는 중...' : '📋 템플릿 가져오기'}
            </button>
            <button
              onClick={() => setAdding({ kind })}
              className="bg-navy-700 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-md"
            >
              + 항목 추가
            </button>
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* FINISH/APPLIANCE 탭 */}
      <div className="flex border-b mb-3">
        {Object.entries(KIND_META).map(([k, meta]) => {
          const count = materials.filter((m) => m.kind === k).length;
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                kind === k
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-gray-500 hover:text-navy-700'
              }`}
            >
              {meta.label} <span className="text-gray-400 text-xs">({count})</span>
            </button>
          );
        })}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          등록된 {KIND_META[kind].label} 항목이 없습니다.
          <br />
          <span className="text-xs">"📋 템플릿 가져오기"로 기본 목록을 채울 수 있습니다</span>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(([spaceGroup, items]) => {
          const groupConfirmed = items.filter((m) => m.status === 'CONFIRMED').length;
          const groupChecked = items.filter((m) => m.checked).length;
          return (
            <Section
              key={spaceGroup}
              spaceGroup={spaceGroup}
              items={items}
              confirmedCount={groupConfirmed}
              checkedCount={groupChecked}
              kind={kind}
              onAdd={() => setAdding({ kind, spaceGroup })}
              onEdit={(m) => setEditing(m)}
            />
          );
        })}
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

function Section({ spaceGroup, items, confirmedCount, checkedCount, kind, onAdd, onEdit }) {
  return (
    <section className="bg-white border rounded-lg overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
        <div className="font-semibold text-navy-800 text-sm">
          {spaceGroup}
          <span className="text-xs text-gray-500 font-normal ml-2">
            {items.length}건 · 확정 {confirmedCount} · 체크 {checkedCount}
          </span>
        </div>
        <button onClick={onAdd} className="text-xs text-navy-700 hover:text-navy-800 hover:underline">
          + 추가
        </button>
      </header>
      <div className="divide-y">
        {items.map((m) =>
          kind === 'FINISH' ? (
            <FinishRow key={m.id} material={m} onClick={() => onEdit(m)} />
          ) : (
            <ApplianceRow key={m.id} material={m} onClick={() => onEdit(m)} />
          )
        )}
      </div>
    </section>
  );
}

function FinishRow({ material, onClick }) {
  const status = STATUS_META[material.status] || STATUS_META.UNDECIDED;
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3 text-sm"
    >
      {material.checked ? (
        <span className="w-4 h-4 flex-shrink-0 bg-emerald-500 text-white rounded-sm flex items-center justify-center text-[10px] mt-0.5">
          ✓
        </span>
      ) : (
        <span className="w-4 h-4 flex-shrink-0 border border-gray-300 rounded-sm mt-0.5" />
      )}
      <div className="w-28 flex-shrink-0 text-gray-700 font-medium truncate">
        {material.itemName}
      </div>
      <div className="w-20 flex-shrink-0 text-gray-500 text-xs truncate">
        {material.brand || <span className="text-gray-300">—</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-navy-800 truncate">
          {material.productName || <span className="text-gray-300">자재명 미입력</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {[material.spec, material.siteNotes].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="w-16 flex-shrink-0 text-xs text-gray-500 text-right truncate">
        {material.purchaseSource || ''}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${status.color}`}>
        {status.label}
      </span>
    </button>
  );
}

function ApplianceRow({ material, onClick }) {
  const status = STATUS_META[material.status] || STATUS_META.UNDECIDED;
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3 text-sm"
    >
      <span
        className={`w-5 flex-shrink-0 text-center text-xs font-semibold mt-0.5 ${
          material.installed === true ? 'text-emerald-600' :
          material.installed === false ? 'text-gray-400' : 'text-gray-300'
        }`}
      >
        {material.installed === true ? 'O' : material.installed === false ? 'X' : '—'}
      </span>
      <div className="w-28 flex-shrink-0 text-gray-700 font-medium truncate">
        {material.itemName}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-navy-800 truncate">
          {material.productName || <span className="text-gray-300">제품명 미입력</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {[material.size, material.remarks].filter(Boolean).join(' · ')}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${status.color}`}>
        {status.label}
      </span>
    </button>
  );
}
