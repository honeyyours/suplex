// 간편 마감재 입력 — 간편 견적 패턴을 그대로 차용한 단순 인라인 테이블.
// 컬럼: 항목 / 품명·브랜드 / 수량 / 비고. 그룹(spaceGroup)별 묶음.
// 기존 마감재 페이지(formKey/customSpec/사이드바/마스터 시드 등)는 라우트에서 숨김.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { materialsApi } from '../api/materials';
import { applianceSpecsApi } from '../api/applianceSpecs';

const SAVE_DELAY = 1000;

export default function ProjectMaterialsSimple() {
  const { id: projectId } = useParams();
  const [items, setItems] = useState([]); // 행 단위 로컬 상태 (서버 Material 매핑)
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({}); // {id: true} - 저장 중 표시
  const [applianceSearchGroup, setApplianceSearchGroup] = useState(null); // 가전 검색 모달 대상 그룹

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
          kind: m.kind || 'FINISH',
          status: m.status || 'UNDECIDED',
          spaceGroup: m.spaceGroup || '기타',
          itemName: m.itemName === '(미정)' || m.itemName === '(이름없음)' ? '' : (m.itemName || ''),
          brand: m.brand || '',
          quantityText: m.unit && m.quantity != null && Number(m.quantity) > 0
            ? `${Number(m.quantity)}${m.unit}`
            : (m.unit || (m.quantity != null && Number(m.quantity) > 0 ? String(m.quantity) : '')),
          size: m.size || '',
          installed: m.installed,
          memo: m.memo || '',
          orderIndex: m.orderIndex ?? 0,
          createdAt: m.createdAt,
          // 발주 잠금 — 활성 PO(취소되지 않은 것) 있으면 행 편집 불가
          locked: !!m.hasActiveOrder,
          activeOrderStatus: m.activeOrderStatus || null,
          // 데드라인 — 같은 spaceGroup 일정 시작일 - D-N
          deadline: m.deadline || null,
          daysToDeadline: m.daysToDeadline,
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

  // 로컬 상태 + 서버 patch (잠긴 행은 status 외 변경 차단)
  function patchItem(id, patch) {
    const it = items.find((x) => x.id === id);
    // 잠금 + status 외 변경 시도면 차단 (status 변경은 발주 취소 흐름이라 별도)
    if (it?.locked && !('status' in patch)) {
      alert('이 항목은 발주에 묶여 있어 수정할 수 없습니다.\n발주 탭에서 [발주 취소]하면 잠금이 해제됩니다.');
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const serverPatch = {};
    if ('itemName' in patch) serverPatch.itemName = patch.itemName || '';
    if ('brand' in patch) serverPatch.brand = patch.brand || null;
    if ('memo' in patch) serverPatch.memo = patch.memo || null;
    if ('quantityText' in patch) {
      serverPatch.unit = patch.quantityText || null;
      serverPatch.quantity = null;
    }
    if ('size' in patch) serverPatch.size = patch.size || null;
    if ('installed' in patch) serverPatch.installed = patch.installed;
    // 상태 (status 변경 시 백엔드의 syncPurchaseOrders가 자동으로 PO 생성/동기화)
    if ('status' in patch) serverPatch.status = patch.status;
    if (Object.keys(serverPatch).length > 0) scheduleSave(id, serverPatch);
  }

  // 체크박스 토글 — 미체크→체크 = CONFIRMED (PO PENDING 자동 생성, 행 즉시 잠금 낙관적 반영)
  // 잠긴 항목은 체크 해제 불가 — 발주 탭에서 취소해야
  function toggleConfirmed(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    if (it.locked) {
      alert('이미 발주에 들어간 항목입니다.\n해제하려면 발주 탭에서 [발주 취소]하세요.');
      return;
    }
    const isCurrentlyConfirmed = ['CONFIRMED', 'CHANGED', 'REUSED'].includes(it.status);
    const next = isCurrentlyConfirmed ? 'UNDECIDED' : 'CONFIRMED';
    // 낙관적 업데이트 — reload 없이 즉시 잠금/해제 반영
    setItems((prev) => prev.map((x) => (
      x.id === id ? { ...x, status: next, locked: next === 'CONFIRMED' } : x
    )));
    // 서버 PATCH는 status만 (낙관 반영은 위에서 끝)
    scheduleSave(id, { status: next });
  }

  // 그룹 일괄 확정 — 미정 + 잠금 안 된 항목만 CONFIRMED로
  // 이미 발주된 항목은 자동 제외
  async function confirmGroup(name) {
    const targets = items.filter((it) =>
      it.spaceGroup === name && !it.locked && (it.status === 'UNDECIDED' || it.status === 'REVIEWING')
    );
    if (targets.length === 0) {
      alert('이 그룹에는 새로 확정할 미정 항목이 없습니다.');
      return;
    }
    if (!confirm(`"${name}" 그룹의 미정 항목 ${targets.length}개를 모두 확정합니다.\n자동으로 발주 대기에 들어가고 행이 잠깁니다.\n\n계속할까요?`)) return;
    try {
      // 낙관적 업데이트 — locked까지 즉시 반영, reload 없음
      setItems((prev) => prev.map((it) => (
        targets.find((t) => t.id === it.id) ? { ...it, status: 'CONFIRMED', locked: true } : it
      )));
      await Promise.all(targets.map((t) => materialsApi.update(projectId, t.id, { status: 'CONFIRMED' })));
    } catch (e) {
      alert('일괄 확정 실패: ' + (e.response?.data?.error || e.message));
      reload();
    }
  }

  // ========== 항목 추가/삭제 ==========
  async function addItem(spaceGroup, focusCol = 'itemName', kindHint = null) {
    // 그룹 안 첫 항목의 kind를 따라감 (없으면 kindHint, 그것도 없으면 FINISH)
    const groupKind = kindHint
      || items.find((x) => x.spaceGroup === spaceGroup)?.kind
      || 'FINISH';
    try {
      const { material } = await materialsApi.create(projectId, {
        kind: groupKind,
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
          kind: material.kind || groupKind,
          status: material.status || 'UNDECIDED',
          spaceGroup: material.spaceGroup,
          itemName: '',
          brand: '',
          quantityText: '',
          size: '',
          installed: null,
          memo: '',
          orderIndex: material.orderIndex ?? 0,
          createdAt: material.createdAt,
          locked: false,
          activeOrderStatus: null,
        },
      ]);
      setTimeout(() => focusCell(material.id, focusCol), 30);
      return material.id;
    } catch (e) {
      alert('항목 추가 실패: ' + (e.response?.data?.error || e.message));
      return null;
    }
  }

  // 가전 규격 DB에서 선택한 spec으로 새 APPLIANCE 항목 생성 (자동 채움)
  async function addItemFromSpec(spaceGroup, spec) {
    const sizeStr = `${spec.widthMm} × ${spec.depthMm} × ${spec.heightMm}`;
    const itemNameLabel = ({
      REFRIGERATOR: '냉장고', KIMCHI_REFRIGERATOR: '김치냉장고',
      DISHWASHER: '식기세척기', WASHING_MACHINE: '세탁기',
      DRYER: '건조기', OVEN: '오븐', COOKTOP: '쿡탑', AIR_CONDITIONER: '에어컨',
      ROBOT_VACUUM: '로봇청소기',
    })[spec.category] || '가전';
    const brandStr = `${spec.brand} ${spec.productName} (${spec.modelCode})`;
    const memoBits = [];
    if (spec.builtIn) memoBits.push('빌트인');
    if (spec.hingeOpenWidthMm) memoBits.push(`문열림 ${spec.hingeOpenWidthMm}mm`);
    if (spec.ventTopMm || spec.ventSideMm || spec.ventBackMm) {
      const vents = [
        spec.ventTopMm && `상부 ${spec.ventTopMm}`,
        spec.ventSideMm && `측면 ${spec.ventSideMm}`,
        spec.ventBackMm && `후면 ${spec.ventBackMm}`,
      ].filter(Boolean).join(' / ');
      memoBits.push(`통풍 ${vents}mm`);
    }
    try {
      const { material } = await materialsApi.create(projectId, {
        kind: 'APPLIANCE',
        spaceGroup,
        itemName: itemNameLabel,
        brand: brandStr,
        size: sizeStr,
        memo: memoBits.join(', ') || null,
        orderIndex: nextOrderIndex(spaceGroup),
      });
      setItems((prev) => [
        ...prev,
        {
          id: material.id,
          kind: 'APPLIANCE',
          status: material.status || 'UNDECIDED',
          spaceGroup: material.spaceGroup,
          itemName: itemNameLabel,
          brand: brandStr,
          quantityText: '',
          size: sizeStr,
          installed: null,
          memo: memoBits.join(', '),
          orderIndex: material.orderIndex ?? 0,
          createdAt: material.createdAt,
          locked: false,
          activeOrderStatus: null,
        },
      ]);
      setApplianceSearchGroup(null);
    } catch (e) {
      alert('가전 추가 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // ========== 키보드 네비게이션 ==========
  // Enter: 같은 컬럼 아래 행, 같은 그룹 마지막이면 새 행 자동 추가
  // ↑/↓: 같은 컬럼 위/아래 행 (마지막에서 ↓는 무시 — 새 행 추가 X)
  // ←/→: 커서가 input 끝/처음일 때만 같은 행 좌/우 셀로
  // Tab: 네이티브 (행 내 가로 이동)
  const FINISH_COLS = ['itemName', 'brand', 'quantityText', 'memo'];
  const APPLIANCE_COLS = ['itemName', 'brand', 'size', 'installed', 'memo'];
  function colsFor(itemId) {
    const it = items.find((x) => x.id === itemId);
    return it?.kind === 'APPLIANCE' ? APPLIANCE_COLS : FINISH_COLS;
  }

  function focusCell(itemId, col) {
    const el = document.querySelector(`[data-mat-cell="${itemId}-${col}"]`);
    if (el) {
      el.focus();
      if (typeof el.select === 'function') el.select();
    }
  }
  function siblingItemId(currentId, dir) {
    const it = items.find((x) => x.id === currentId);
    if (!it) return null;
    const inGroup = items
      .filter((x) => x.spaceGroup === it.spaceGroup)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = inGroup.findIndex((x) => x.id === currentId);
    if (idx < 0) return null;
    const next = inGroup[idx + dir];
    return next?.id || null;
  }
  function handleCellKeyDown(e, itemId, col) {
    const target = e.target;
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextId = siblingItemId(itemId, +1);
      if (nextId) {
        focusCell(nextId, col);
      } else {
        const it = items.find((x) => x.id === itemId);
        if (it) addItem(it.spaceGroup, col);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = siblingItemId(itemId, +1);
      if (nextId) focusCell(nextId, col);
      // 마지막 행이면 무시 (새 행 추가 X — Enter만)
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = siblingItemId(itemId, -1);
      if (prevId) focusCell(prevId, col);
      return;
    }
    const cols = colsFor(itemId);
    if (e.key === 'ArrowRight') {
      // input이 아닐 수 있음 (가전 설치 select 등) — value 없으면 항상 이동
      const atEnd = target.value == null
        || (target.selectionStart === target.value.length && target.selectionEnd === target.value.length);
      if (atEnd) {
        const idx = cols.indexOf(col);
        const nextCol = cols[idx + 1];
        if (nextCol) {
          e.preventDefault();
          focusCell(itemId, nextCol);
        }
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      const atStart = target.value == null
        || (target.selectionStart === 0 && target.selectionEnd === 0);
      if (atStart) {
        const idx = cols.indexOf(col);
        const prevCol = cols[idx - 1];
        if (prevCol) {
          e.preventDefault();
          focusCell(itemId, prevCol);
        }
      }
      return;
    }
  }

  function nextOrderIndex(spaceGroup) {
    const inGroup = items.filter((it) => it.spaceGroup === spaceGroup);
    return inGroup.length > 0
      ? Math.max(...inGroup.map((it) => it.orderIndex || 0)) + 1
      : (items.length > 0 ? Math.max(...items.map((it) => it.orderIndex || 0)) + 1 : 0);
  }

  async function removeItem(id) {
    const it = items.find((x) => x.id === id);
    if (it?.locked) {
      alert('이미 발주에 들어간 항목이라 삭제할 수 없습니다.\n발주 탭에서 [발주 취소]하면 잠금이 해제됩니다.');
      return;
    }
    if (!confirm('이 항목을 삭제할까요?')) return;
    try {
      await materialsApi.remove(projectId, id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // ========== 그룹 추가/이름 변경/삭제 ==========
  async function addGroup(kind = 'FINISH') {
    const placeholder = kind === 'APPLIANCE'
      ? '예: 주방, 거실, 욕실, 다용도실'
      : '예: 목공, 도배, 화장실';
    const name = prompt(`새 ${kind === 'APPLIANCE' ? '가전·가구' : '마감재'} 그룹 이름을 입력하세요 (${placeholder})`);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groupNames.includes(trimmed)) {
      alert('이미 같은 이름의 그룹이 있습니다.');
      return;
    }
    await addItem(trimmed, 'itemName', kind);
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
    return order.map((g) => {
      const arr = map.get(g).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      // 그룹 kind = 첫 항목의 kind (정상적으로는 그룹 안 모두 동일)
      const kind = arr[0]?.kind || 'FINISH';
      // 미정 + 데드라인 임박 — 그룹의 deadline은 첫 항목 기준 (모두 같은 spaceGroup이라 동일)
      const undecidedItems = arr.filter((it) => !it.locked && (it.status === 'UNDECIDED' || it.status === 'REVIEWING'));
      const minDays = undecidedItems
        .map((it) => it.daysToDeadline)
        .filter((d) => d != null)
        .reduce((min, d) => (min == null || d < min ? d : min), null);
      return { name: g, kind, items: arr, undecidedCount: undecidedItems.length, minDaysToDeadline: minDays };
    });
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
        <div className="flex gap-2">
          <button
            onClick={() => addGroup('FINISH')}
            className="text-sm px-3 py-2 bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            + 마감재 그룹
          </button>
          <button
            onClick={() => addGroup('APPLIANCE')}
            className="text-sm px-3 py-2 bg-violet-700 text-white rounded hover:bg-violet-800"
          >
            + 가전·가구 그룹
          </button>
        </div>
      </div>

      {grouped.map((g) => (
        <GroupCard
          key={g.name}
          group={g}
          savingMap={savingMap}
          onItemPatch={patchItem}
          onItemRemove={removeItem}
          onAddItem={() => addItem(g.name)}
          onAddApplianceFromSpec={() => setApplianceSearchGroup(g.name)}
          onRenameGroup={() => renameGroup(g.name)}
          onRemoveGroup={() => removeGroup(g.name)}
          onConfirmGroup={() => confirmGroup(g.name)}
          onToggleConfirmed={toggleConfirmed}
          onCellKeyDown={handleCellKeyDown}
        />
      ))}

      {grouped.length === 0 && (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
          아직 등록된 마감재가 없습니다.
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={() => addGroup('FINISH')} className="text-sm px-4 py-2 border border-navy-300 text-navy-700 rounded hover:bg-navy-50">
              + 마감재 그룹
            </button>
            <button onClick={() => addGroup('APPLIANCE')} className="text-sm px-4 py-2 border border-violet-300 text-violet-700 rounded hover:bg-violet-50">
              + 가전·가구 그룹
            </button>
          </div>
        </div>
      )}

      {applianceSearchGroup && (
        <ApplianceSearchModal
          spaceGroup={applianceSearchGroup}
          onClose={() => setApplianceSearchGroup(null)}
          onSelect={(spec) => addItemFromSpec(applianceSearchGroup, spec)}
        />
      )}
    </div>
  );
}

// ============================================
// 가전 규격 DB 검색 모달 — 모델 선택 → 자동 채움
// ============================================
function ApplianceSearchModal({ spaceGroup, onClose, onSelect }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { limit: 30 };
        if (q.trim()) params.q = q.trim();
        if (category) params.category = category;
        if (brand) params.brand = brand;
        const { specs } = await applianceSpecsApi.search(params);
        if (!cancelled) setResults(specs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, category, brand]);

  const verifyChip = (s) => {
    if (s.verifyStatus === 'VERIFIED') return <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">✅ {s.consensusCount}출처</span>;
    if (s.verifyStatus === 'USER_CORRECTED') return <span className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded">🛠️ 정정</span>;
    if (s.verifyStatus === 'DISPUTED') return <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">⚠️ 출처 불일치</span>;
    // PENDING — 단일 출처. "확인필요"는 사용자에게 부담스러워 톤 조정.
    return <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">ⓘ 공식 1곳</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-800">가전 규격 검색 → "{spaceGroup}"에 추가</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="모델코드 / 제품명 검색 (예: S634, 디오스, 매직스페이스)"
              className="flex-1 min-w-[200px] text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm px-2 py-1.5 border rounded">
              <option value="">전체 카테고리</option>
              <option value="REFRIGERATOR">냉장고</option>
              <option value="KIMCHI_REFRIGERATOR">김치냉장고</option>
              <option value="DISHWASHER">식기세척기</option>
              <option value="WASHING_MACHINE">세탁기</option>
              <option value="DRYER">건조기</option>
              <option value="OVEN">오븐</option>
              <option value="COOKTOP">쿡탑</option>
              <option value="AIR_CONDITIONER">에어컨</option>
              <option value="ROBOT_VACUUM">로봇청소기</option>
            </select>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="text-sm px-2 py-1.5 border rounded">
              <option value="">전체 브랜드</option>
              <option value="LG">LG</option>
              <option value="삼성">삼성</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && <div className="text-sm text-gray-400">검색 중...</div>}
          {!loading && results.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              {q.trim() ? '검색 결과가 없습니다.' : '검색어를 입력하거나 필터를 선택하세요.'}
              <div className="text-xs text-gray-400 mt-2">
                DB에 없는 모델은 Settings → 가전 규격 DB에서 추가하세요.
              </div>
            </div>
          )}
          <div className="divide-y">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left py-2.5 px-2 hover:bg-gray-50 transition ${selected?.id === s.id ? 'bg-navy-50' : ''}`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{s.brand}</span>
                  <span className="font-mono text-xs text-navy-700">{s.modelCode}</span>
                  {verifyChip(s)}
                  {s.discontinued && <span className="text-[10px] text-gray-400">(단종)</span>}
                </div>
                <div className="text-xs text-gray-700 mt-0.5">{s.productName}</div>
                <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  {s.widthMm} × {s.depthMm} × {s.heightMm} mm
                  {s.builtIn && ' · 빌트인'}
                  {s.doorType && ` · ${s.doorType}`}
                  {s.capacityL && ` · ${s.capacityL}L`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="border-t px-5 py-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">선택됨 — 미리보기:</div>
            <div className="text-sm">
              <div><span className="text-gray-500">품목:</span> {({ REFRIGERATOR: '냉장고', KIMCHI_REFRIGERATOR: '김치냉장고', DISHWASHER: '식기세척기', WASHING_MACHINE: '세탁기', DRYER: '건조기', OVEN: '오븐', COOKTOP: '쿡탑', AIR_CONDITIONER: '에어컨', ROBOT_VACUUM: '로봇청소기' })[selected.category]}</div>
              <div><span className="text-gray-500">모델명:</span> {selected.brand} {selected.productName} ({selected.modelCode})</div>
              <div><span className="text-gray-500">사이즈:</span> {selected.widthMm} × {selected.depthMm} × {selected.heightMm}</div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="text-sm px-3 py-1.5 border rounded hover:bg-white">취소</button>
              <button
                onClick={() => onSelect(selected)}
                className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
              >
                이 사이즈로 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 그룹 카드
// ============================================
function GroupCard({ group, savingMap, onItemPatch, onItemRemove, onAddItem, onAddApplianceFromSpec, onRenameGroup, onRemoveGroup, onConfirmGroup, onToggleConfirmed, onCellKeyDown }) {
  const isAppliance = group.kind === 'APPLIANCE';
  const headerBg = isAppliance ? 'bg-violet-50/60' : 'bg-navy-50/40';
  const accentText = isAppliance ? 'text-violet-700' : 'text-navy-600';
  const titleText = isAppliance ? 'text-violet-800' : 'text-navy-800';
  const badge = isAppliance
    ? 'bg-violet-100 text-violet-700'
    : 'bg-navy-100 text-navy-700';

  // 진행률 — 확정(체크된 것) / 전체. 잠긴 것도 확정으로 카운트
  const total = group.items.length;
  const confirmedCount = group.items.filter((it) =>
    ['CONFIRMED', 'CHANGED', 'REUSED'].includes(it.status) || it.locked
  ).length;
  const pendingActionable = group.items.filter((it) =>
    !it.locked && (it.status === 'UNDECIDED' || it.status === 'REVIEWING')
  ).length;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${accentText} font-bold flex-shrink-0`}>▸</span>
          <button
            onClick={onRenameGroup}
            className={`text-base font-bold ${titleText} hover:underline truncate text-left`}
            title="그룹 이름 변경"
          >
            {group.name}
          </button>
          <span className={`text-xs sm:text-[10px] px-1.5 py-0.5 rounded ${badge} flex-shrink-0`}>
            {isAppliance ? '가전·가구' : '마감재'}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
            {confirmedCount}/{total} 확정
          </span>
          {group.undecidedCount > 0 && group.minDaysToDeadline != null && group.minDaysToDeadline <= 7 && (
            <DeadlineWarning days={group.minDaysToDeadline} count={group.undecidedCount} />
          )}
        </div>
        <div className="flex items-center gap-1">
          {pendingActionable > 0 && (
            <button
              onClick={onConfirmGroup}
              className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              title={`미정·잠금해제 ${pendingActionable}개를 모두 확정 → 발주 자동 생성 (이미 발주된 건 제외)`}
            >
              ✅ 모두 확정 → 발주 ({pendingActionable})
            </button>
          )}
          {isAppliance && (
            <button
              onClick={onAddApplianceFromSpec}
              className="text-xs px-2 py-1 border border-violet-300 text-violet-700 rounded hover:bg-violet-50"
              title="가전 규격 DB에서 모델 검색 → 사이즈 자동 채움"
            >
              🔍 가전 검색
            </button>
          )}
          <button
            onClick={onAddItem}
            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
          >
            + 항목
          </button>
          <button
            onClick={onRemoveGroup}
            className="text-xs px-2 py-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded"
            title="그룹 통째 삭제"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isAppliance ? (
          <ApplianceTable group={group} savingMap={savingMap} onItemPatch={onItemPatch} onItemRemove={onItemRemove} onCellKeyDown={onCellKeyDown} onToggleConfirmed={onToggleConfirmed} />
        ) : (
          <FinishTable group={group} savingMap={savingMap} onItemPatch={onItemPatch} onItemRemove={onItemRemove} onCellKeyDown={onCellKeyDown} onToggleConfirmed={onToggleConfirmed} />
        )}
      </div>
    </div>
  );
}

// ============================================
// 마감재 테이블 (4컬럼)
// ============================================
function FinishTable({ group, savingMap, onItemPatch, onItemRemove, onCellKeyDown, onToggleConfirmed }) {
  return (
    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '32px' }} />{/* 체크박스 */}
        <col style={{ width: '18%' }} />
        <col style={{ width: '22%' }} />
        <col style={{ width: '80px' }} />
        <col />
        <col style={{ width: '24px' }} />
      </colgroup>
      <thead className="bg-gray-50 text-xs text-gray-500">
        <tr>
          <th className="text-center"></th>
          <th className="text-left px-2 py-1.5">항목</th>
          <th className="text-left px-2 py-1.5">브랜드 규격 등</th>
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
            onCellKeyDown={onCellKeyDown}
            onToggle={() => onToggleConfirmed(it.id)}
          />
        ))}
        {group.items.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center py-3 text-xs text-gray-400">
              아직 항목이 없습니다. [+ 항목]을 눌러 추가하세요.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ============================================
// 가전·가구 테이블 (체크박스 + 품목 / 모델명 / 사이즈 / 설치 / 비고)
// ============================================
function ApplianceTable({ group, savingMap, onItemPatch, onItemRemove, onCellKeyDown, onToggleConfirmed }) {
  return (
    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '32px' }} />{/* 체크박스 */}
        <col style={{ width: '13%' }} />{/* 품목 */}
        <col style={{ width: '22%' }} />{/* 모델명 */}
        <col style={{ width: '125px' }} />{/* 사이즈 */}
        <col style={{ width: '70px' }} />{/* 설치 */}
        <col />{/* 비고 */}
        <col style={{ width: '24px' }} />
      </colgroup>
      <thead className="bg-gray-50 text-xs text-gray-500">
        <tr>
          <th className="text-center"></th>
          <th className="text-left px-2 py-1.5">품목</th>
          <th className="text-left px-2 py-1.5">모델명 / 품번</th>
          <th className="text-left px-2 py-1.5">사이즈 (W×D×H)</th>
          <th className="text-center px-2 py-1.5">설치</th>
          <th className="text-left px-2 py-1.5">비고 (빌트인/도어방향)</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {group.items.map((it) => (
          <ApplianceRow
            key={it.id}
            item={it}
            saving={!!savingMap[it.id]}
            onChange={(patch) => onItemPatch(it.id, patch)}
            onRemove={() => onItemRemove(it.id)}
            onCellKeyDown={onCellKeyDown}
            onToggle={() => onToggleConfirmed(it.id)}
          />
        ))}
        {group.items.length === 0 && (
          <tr>
            <td colSpan={7} className="text-center py-3 text-xs text-gray-400">
              아직 항목이 없습니다. [+ 항목]을 눌러 추가하세요.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ============================================
// 행 잠금/체크 헬퍼
// ============================================
function isConfirmed(item) {
  return ['CONFIRMED', 'CHANGED', 'REUSED'].includes(item.status) || item.locked;
}
function ConfirmCheckbox({ item, onToggle }) {
  const checked = isConfirmed(item);
  const locked = !!item.locked;
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      disabled={locked}
      tabIndex={-1}
      className={`w-4 h-4 accent-emerald-600 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      title={locked ? '발주 진행 중 — 발주 탭에서 [발주 취소]하면 해제' : (checked ? '확정 해제' : '확정 → 발주 대기로 전환')}
    />
  );
}

// ============================================
// 가전·가구 행
// ============================================
function ApplianceRow({ item, saving, onChange, onRemove, onCellKeyDown, onToggle }) {
  const locked = !!item.locked;
  const inputCls = `w-full px-1 py-1 border-transparent border rounded outline-none focus:border-violet-400 hover:border-gray-200 ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;
  const kd = (col) => (e) => onCellKeyDown?.(e, item.id, col);
  const cellAttrs = (col) => ({ 'data-mat-cell': `${item.id}-${col}`, onKeyDown: kd(col), disabled: locked });
  return (
    <tr className={locked ? 'bg-gray-50/50' : 'hover:bg-gray-50'}>
      <td className="px-2 py-1.5 text-center">
        <ConfirmCheckbox item={item} onToggle={onToggle} />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('itemName')}
          value={item.itemName}
          onChange={(e) => onChange({ itemName: e.target.value })}
          className={inputCls}
          placeholder="예: 냉장고 / 세탁기"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('brand')}
          value={item.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className={inputCls}
          placeholder="예: BESPOKE 4도어 871L / RF85R9013S8"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('size')}
          value={item.size}
          onChange={(e) => onChange({ size: e.target.value })}
          className={inputCls + ' tabular-nums'}
          placeholder="예: 908 × 930 × 1853"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <select
          {...cellAttrs('installed')}
          value={item.installed === true ? 'Y' : item.installed === false ? 'N' : ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ installed: v === 'Y' ? true : v === 'N' ? false : null });
          }}
          className={`text-xs px-1 py-1 border-transparent border rounded outline-none focus:border-violet-400 hover:border-gray-200 bg-transparent ${locked ? 'cursor-not-allowed' : ''}`}
        >
          <option value="">—</option>
          <option value="Y">✓ 유</option>
          <option value="N">✕ 무</option>
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('memo')}
          value={item.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={inputCls}
          placeholder="빌트인 여부, 도어 개폐 방향, 콘센트 위치 등"
        />
      </td>
      <td className="px-1 text-right">
        {saving ? (
          <span className="text-xs sm:text-[10px] text-gray-400" title="저장 중">…</span>
        ) : locked ? null : (
          <button
            onClick={onRemove}
            tabIndex={-1}
            className="text-gray-300 hover:text-rose-500 text-sm"
            title="삭제"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}

function ItemRow({ item, saving, onChange, onRemove, onCellKeyDown, onToggle }) {
  const locked = !!item.locked;
  const inputCls = `w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;
  const kd = (col) => (e) => onCellKeyDown?.(e, item.id, col);
  const cellAttrs = (col) => ({ 'data-mat-cell': `${item.id}-${col}`, onKeyDown: kd(col), disabled: locked });
  return (
    <tr className={locked ? 'bg-gray-50/50' : 'hover:bg-gray-50'}>
      <td className="px-2 py-1.5 text-center">
        <ConfirmCheckbox item={item} onToggle={onToggle} />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('itemName')}
          value={item.itemName}
          onChange={(e) => onChange({ itemName: e.target.value })}
          className={inputCls}
          placeholder="예: 콘센트"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('brand')}
          value={item.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
          className={inputCls}
          placeholder="예: 르그랑 / 무광 블랙 / 9미리"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('quantityText')}
          value={item.quantityText}
          onChange={(e) => onChange({ quantityText: e.target.value })}
          className={inputCls}
          placeholder="예: 12개"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('memo')}
          value={item.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={inputCls}
          placeholder="설명/색상/위치 등"
        />
      </td>
      <td className="px-1 text-right">
        {saving ? (
          <span className="text-xs sm:text-[10px] text-gray-400" title="저장 중">…</span>
        ) : locked ? null : (
          <button
            onClick={onRemove}
            tabIndex={-1}
            className="text-gray-300 hover:text-rose-500 text-sm"
            title="삭제"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}

// ============================================
// 상태 칩 (4가지 status select)
// ============================================
const STATUS_OPTIONS = [
  { key: 'UNDECIDED',      icon: '🔍', label: '미정',     bg: 'bg-gray-100 text-gray-600' },
  { key: 'CONFIRMED',      icon: '✅', label: '확정',     bg: 'bg-emerald-100 text-emerald-700' },
  { key: 'REUSED',         icon: '♻️', label: '재사용',   bg: 'bg-sky-100 text-sky-700' },
  { key: 'NOT_APPLICABLE', icon: '⊘', label: '해당없음', bg: 'bg-gray-100 text-gray-400' },
];
function StatusChip({ status, onChange }) {
  // legacy 매핑: REVIEWING/CHANGED 도 표시 가능하게
  const effective = status === 'REVIEWING' ? 'UNDECIDED'
    : status === 'CHANGED' ? 'CONFIRMED'
    : (status || 'UNDECIDED');
  const meta = STATUS_OPTIONS.find((o) => o.key === effective) || STATUS_OPTIONS[0];
  return (
    <select
      value={effective}
      onChange={(e) => onChange(e.target.value)}
      tabIndex={-1}
      className={`text-[11px] px-1.5 py-0.5 rounded ${meta.bg} border-transparent outline-none focus:border-navy-400 cursor-pointer`}
      title={meta.label}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.key} value={o.key}>{o.icon} {o.label}</option>
      ))}
    </select>
  );
}

// ============================================
// 데드라인 임박 경고 칩 — 그룹 헤더용
// ============================================
function DeadlineWarning({ days, count }) {
  let cls = 'bg-amber-100 text-amber-800';
  let prefix = '⏰ ';
  if (days < 0) { cls = 'bg-rose-100 text-rose-800 font-semibold'; prefix = '⚠ '; }
  else if (days <= 3) { cls = 'bg-rose-100 text-rose-700'; prefix = '🔥 '; }
  const label = days < 0
    ? `${prefix}데드라인 ${Math.abs(days)}일 지남 — 미정 ${count}개`
    : days === 0
    ? `${prefix}오늘까지 — 미정 ${count}개`
    : `${prefix}D-${days} — 미정 ${count}개`;
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded ${cls}`} title="발주 데드라인이 임박했지만 아직 미정인 항목">
      {label}
    </span>
  );
}
