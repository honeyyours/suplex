// 간편 마감재 입력 — 간편 견적 패턴을 그대로 차용한 단순 인라인 테이블.
// 컬럼: 항목 / 품명·브랜드 / 수량 / 비고. 그룹(spaceGroup)별 묶음.
// 기존 마감재 페이지(formKey/customSpec/사이드바/마스터 시드 등)는 라우트에서 숨김.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { materialsApi } from '../api/materials';

const SAVE_DELAY = 1000;

export default function ProjectMaterialsSimple() {
  const { id: projectId } = useParams();
  const [items, setItems] = useState([]); // 행 단위 로컬 상태 (서버 Material 매핑)
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({}); // {id: true} - 저장 중 표시

  // 디바운스 타이머: id별로 별도 관리
  const timersRef = useRef({}); // {id: setTimeout handle}
  const pendingRef = useRef({}); // {id: latest patch object}

  async function reload() {
    setLoading(true);
    try {
      const { materials } = await materialsApi.list(projectId);
      setItems(
        materials.map((m) => ({
          id: m.id,
          spaceGroup: m.spaceGroup || '기타',
          itemName: m.itemName === '(미정)' || m.itemName === '(이름없음)' ? '' : (m.itemName || ''),
          brand: m.brand || '',
          // 수량 표시: brand는 "품명/브랜드"로 사용. 수량은 unit 컬럼에 자유 텍스트 통째 저장.
          // 기존 데이터(quantity+unit 분리)는 합쳐서 표시
          quantityText: m.unit && m.quantity != null && Number(m.quantity) > 0
            ? `${Number(m.quantity)}${m.unit}`
            : (m.unit || (m.quantity != null && Number(m.quantity) > 0 ? String(m.quantity) : '')),
          memo: m.memo || '',
          orderIndex: m.orderIndex ?? 0,
          createdAt: m.createdAt,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    /* eslint-disable-next-line */
  }, [projectId]);

  // 컴포넌트 언마운트 시 잔여 저장 플러시
  useEffect(() => () => {
    for (const id of Object.keys(timersRef.current)) {
      clearTimeout(timersRef.current[id]);
      const patch = pendingRef.current[id];
      if (patch) {
        materialsApi.update(projectId, id, patch).catch(() => {});
      }
    }
    /* eslint-disable-next-line */
  }, []);

  // ========== 행 디바운스 자동 저장 ==========
  function scheduleSave(id, patch) {
    pendingRef.current[id] = { ...(pendingRef.current[id] || {}), ...patch };
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(() => flushSave(id), SAVE_DELAY);
  }

  async function flushSave(id) {
    const patch = pendingRef.current[id];
    if (!patch) return;
    pendingRef.current[id] = null;
    delete timersRef.current[id];
    setSavingMap((s) => ({ ...s, [id]: true }));
    try {
      await materialsApi.update(projectId, id, patch);
    } catch (e) {
      console.error(e);
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setSavingMap((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
    }
  }

  // 로컬 상태 + 서버 patch
  function patchItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    // brand/itemName/memo는 그대로. quantityText는 서버에서 unit 컬럼에 저장.
    const serverPatch = {};
    if ('itemName' in patch) serverPatch.itemName = patch.itemName || '';
    if ('brand' in patch) serverPatch.brand = patch.brand || null;
    if ('memo' in patch) serverPatch.memo = patch.memo || null;
    if ('quantityText' in patch) {
      serverPatch.unit = patch.quantityText || null;
      serverPatch.quantity = null; // 새 UI는 unit에 통째로
    }
    if (Object.keys(serverPatch).length > 0) scheduleSave(id, serverPatch);
  }

  // ========== 항목 추가/삭제 ==========
  async function addItem(spaceGroup) {
    try {
      const { material } = await materialsApi.create(projectId, {
        kind: 'FINISH',
        spaceGroup,
        itemName: '',
        brand: null,
        unit: null,
        memo: null,
        orderIndex: nextOrderIndex(spaceGroup),
      });
      setItems((prev) => [
        ...prev,
        {
          id: material.id,
          spaceGroup: material.spaceGroup,
          itemName: '',
          brand: '',
          quantityText: '',
          memo: '',
          orderIndex: material.orderIndex ?? 0,
          createdAt: material.createdAt,
        },
      ]);
    } catch (e) {
      alert('항목 추가 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  function nextOrderIndex(spaceGroup) {
    const inGroup = items.filter((it) => it.spaceGroup === spaceGroup);
    return inGroup.length > 0
      ? Math.max(...inGroup.map((it) => it.orderIndex || 0)) + 1
      : (items.length > 0 ? Math.max(...items.map((it) => it.orderIndex || 0)) + 1 : 0);
  }

  async function removeItem(id) {
    if (!confirm('이 항목을 삭제할까요?')) return;
    try {
      await materialsApi.remove(projectId, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // ========== 그룹 추가/이름 변경/삭제 ==========
  async function addGroup() {
    const name = prompt('새 그룹 이름을 입력하세요 (예: 목공, 도배, 화장실)');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groupNames.includes(trimmed)) {
      alert('이미 같은 이름의 그룹이 있습니다.');
      return;
    }
    await addItem(trimmed);
  }

  async function renameGroup(from) {
    const next = prompt(`그룹 이름 변경: "${from}" →`, from);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === from) return;
    if (groupNames.includes(trimmed)) {
      alert('이미 같은 이름의 그룹이 있습니다. 다른 이름을 사용하세요.');
      return;
    }
    try {
      await materialsApi.renameGroup(projectId, from, trimmed);
      setItems((prev) => prev.map((it) => (it.spaceGroup === from ? { ...it, spaceGroup: trimmed } : it)));
    } catch (e) {
      alert('이름 변경 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function removeGroup(name) {
    if (!confirm(`"${name}" 그룹과 그 안의 모든 항목을 삭제할까요? (되돌릴 수 없음)`)) return;
    try {
      await materialsApi.removeGroup(projectId, name);
      setItems((prev) => prev.filter((it) => it.spaceGroup !== name));
    } catch (e) {
      alert('그룹 삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 그룹별 묶기 (spaceGroup distinct, 입력 순서 유지)
  const grouped = useMemo(() => {
    const order = [];
    const map = new Map();
    for (const it of items) {
      const g = it.spaceGroup || '기타';
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g).push(it);
    }
    return order.map((g) => ({ name: g, items: map.get(g).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)) }));
  }, [items]);
  const groupNames = grouped.map((g) => g.name);

  if (loading) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-gray-500">
          {items.length === 0
            ? '아직 등록된 마감재가 없습니다. [+ 새 그룹 추가]로 시작하거나, 견적 탭에서 [📦 마감재로 보내기]를 사용하세요.'
            : `총 ${grouped.length}개 그룹 / ${items.length}개 항목`}
        </div>
        <button
          onClick={addGroup}
          className="text-sm px-4 py-2 bg-navy-700 text-white rounded hover:bg-navy-800"
        >
          + 새 그룹 추가
        </button>
      </div>

      {grouped.map((g) => (
        <GroupCard
          key={g.name}
          group={g}
          savingMap={savingMap}
          onItemPatch={patchItem}
          onItemRemove={removeItem}
          onAddItem={() => addItem(g.name)}
          onRenameGroup={() => renameGroup(g.name)}
          onRemoveGroup={() => removeGroup(g.name)}
        />
      ))}

      {grouped.length === 0 && (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
          아직 등록된 마감재가 없습니다.
          <div className="mt-3">
            <button onClick={addGroup} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">
              + 첫 그룹 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 그룹 카드
// ============================================
function GroupCard({ group, savingMap, onItemPatch, onItemRemove, onAddItem, onRenameGroup, onRemoveGroup }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-navy-50/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-navy-600 font-bold flex-shrink-0">▸</span>
          <button
            onClick={onRenameGroup}
            className="text-base font-bold text-navy-800 hover:underline truncate text-left"
            title="그룹 이름 변경"
          >
            {group.name}
          </button>
          <span className="text-xs text-gray-400 flex-shrink-0">{group.items.length}개</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddItem}
            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            + 항목
          </button>
          <button
            onClick={onRemoveGroup}
            className="text-xs px-2 py-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
            title="그룹 통째 삭제"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />{/* 항목 */}
            <col style={{ width: '22%' }} />{/* 품명/브랜드 */}
            <col style={{ width: '90px' }} />{/* 수량 */}
            <col />{/* 비고 — 나머지 */}
            <col style={{ width: '24px' }} />{/* X */}
          </colgroup>
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left px-2 py-1.5">항목</th>
              <th className="text-left px-2 py-1.5">품명·브랜드</th>
              <th className="text-left px-2 py-1.5">수량</th>
              <th className="text-left px-2 py-1.5">비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {group.items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                saving={!!savingMap[it.id]}
                onChange={(patch) => onItemPatch(it.id, patch)}
                onRemove={() => onItemRemove(it.id)}
              />
            ))}
            {group.items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-3 text-xs text-gray-400">
                  아직 항목이 없습니다. [+ 항목]을 눌러 추가하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({ item, saving, onChange, onRemove }) {
  const inputCls = 'w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200';
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1.5">
        <input
          value={item.itemName}
          onChange={(e) => onChange({ itemName: e.target.value })}
          className={inputCls}
          placeholder="예: 콘센트"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={item.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className={inputCls}
          placeholder="예: 르그랑"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={item.quantityText}
          onChange={(e) => onChange({ quantityText: e.target.value })}
          className={inputCls}
          placeholder="예: 12개"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={item.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={inputCls}
          placeholder="설명/색상/위치 등"
        />
      </td>
      <td className="px-1 text-right">
        {saving ? (
          <span className="text-[10px] text-gray-400" title="저장 중">…</span>
        ) : (
          <button
            onClick={onRemove}
            tabIndex={-1}
            className="text-gray-300 hover:text-red-500 text-sm"
            title="삭제"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
