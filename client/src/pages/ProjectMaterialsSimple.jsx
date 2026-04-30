// 간편 마감재 입력 — 간편 견적 패턴을 그대로 차용한 단순 인라인 테이블.
// 컬럼: 항목 / 품명·브랜드 / 수량 / 비고. 그룹(spaceGroup)별 묶음.
// 기존 마감재 페이지(formKey/customSpec/사이드바/마스터 시드 등)는 라우트에서 숨김.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { materialsApi } from '../api/materials';
import { applianceSpecsApi } from '../api/applianceSpecs';
import QuoteContextDrawer from '../components/QuoteContextDrawer';
import MaterialImportModal from '../components/MaterialImportModal';
import InputModal from '../components/InputModal';
import { OtherBadge } from '../components/PhaseSelect';
import { normalizePhase, isOther } from '../utils/phases';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

const SAVE_DELAY = 1000;

export default function ProjectMaterialsSimple() {
  const { id: projectId } = useParams();
  const location = useLocation();
  const [items, setItems] = useState([]); // 행 단위 로컬 상태 (서버 Material 매핑)
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({}); // {id: true} - 저장 중 표시
  const [applianceSearchGroup, setApplianceSearchGroup] = useState(null); // 가전 검색 모달 대상 그룹
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [quoteDrawerGroup, setQuoteDrawerGroup] = useState(null); // 드로어 활성 spaceGroup
  // 빈 그룹 — 그룹은 추가됐지만 아직 항목이 없는 상태 (Material row 0개)
  // 새로고침 시 사라짐 (사용자가 첫 항목 빨리 입력해야 함). [{name, kind}]
  const [emptyGroups, setEmptyGroups] = useState([]);
  // 공정별 불러오기 모달 — { spaceGroup, kind } 또는 null
  const [importTarget, setImportTarget] = useState(null);
  // 그룹 이름 입력 모달 — { mode: 'create' | 'rename', from?: string } 또는 null
  const [groupModal, setGroupModal] = useState(null);

  // 견적 → 마감재 보내기에서 넘어온 빈 그룹 자동 노출
  useEffect(() => {
    const incoming = location.state?.addedEmptyGroups;
    if (Array.isArray(incoming) && incoming.length > 0) {
      setEmptyGroups((prev) => {
        const have = new Set([
          ...prev.map((g) => g.name),
          ...items.map((it) => it.spaceGroup),
        ]);
        const fresh = incoming
          .filter((name) => !have.has(name))
          .map((name) => ({ name, kind: 'FINISH' }));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
      // state는 한 번만 — 같은 페이지 내 새로고침 시 다시 추가되지 않도록 cleanup
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, items.length]);

  // 디바운스 타이머: id별로 별도 관리
  const timersRef = useRef({}); // {id: setTimeout handle}
  const pendingRef = useRef({}); // {id: latest patch object}
  // 가전 자동 학습 디바운스 (modelCode별 5초)
  const learnTimersRef = useRef({});

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
          modelCode: m.modelCode || '',
          quantityText: m.unit && m.quantity != null && Number(m.quantity) > 0
            ? `${Number(m.quantity)}${m.unit}`
            : (m.unit || (m.quantity != null && Number(m.quantity) > 0 ? String(m.quantity) : '')),
          size: m.size || '',
          installed: m.installed,
          sourceUrl: m.sourceUrl || '',
          memo: m.memo || '',
          orderIndex: m.orderIndex ?? 0,
          createdAt: m.createdAt,
          // 발주 잠금 — 활성 PO(취소되지 않은 것) 있으면 행 편집 불가
          locked: !!m.hasActiveOrder,
          activeOrderStatus: m.activeOrderStatus || null,
          // 데드라인 — 같은 spaceGroup 일정 시작일 - D-N
          deadline: m.deadline || null,
          daysToDeadline: m.daysToDeadline,
          isFavorite: !!m.isFavorite,
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

  // 컴포넌트 언마운트 시 잔여 저장 플러시 + 학습 타이머 정리
  useEffect(() => () => {
    for (const id of Object.keys(timersRef.current)) {
      clearTimeout(timersRef.current[id]);
      const patch = pendingRef.current[id];
      if (patch) {
        materialsApi.update(projectId, id, patch).catch(() => {});
      }
    }
    // 학습 타이머는 그냥 취소 (5초 안에 페이지 이탈한 경우 학습 중단)
    for (const k of Object.keys(learnTimersRef.current)) {
      clearTimeout(learnTimersRef.current[k]);
    }
    /* eslint-disable-next-line */
  }, []);

  // ========== 행 디바운스 자동 저장 ==========
  function scheduleSave(id, patch) {
    pendingRef.current[id] = { ...(pendingRef.current[id] || {}), ...patch };
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(() => flushSave(id), SAVE_DELAY);
  }

  // ========== 가전 자동 학습 (5초 디바운스) ==========
  // modelCode + brand + size 다 채워지면 ApplianceSpec DB에 자동 누적 (회사간 공유)
  // 같은 사이즈 → consensusCount++, 다른 사이즈 → DISPUTED
  const CATEGORY_GUESS = {
    '냉장고': 'REFRIGERATOR', '김치냉장고': 'KIMCHI_REFRIGERATOR',
    '식기세척기': 'DISHWASHER', '식세기': 'DISHWASHER',
    '세탁기': 'WASHING_MACHINE', '건조기': 'DRYER',
    '오븐': 'OVEN', '쿡탑': 'COOKTOP', '인덕션': 'COOKTOP', '하이라이트': 'COOKTOP',
    '에어컨': 'AIR_CONDITIONER', '로봇청소기': 'ROBOT_VACUUM',
  };
  function guessCategory(itemName) {
    if (!itemName) return undefined;
    for (const [k, v] of Object.entries(CATEGORY_GUESS)) {
      if (itemName.includes(k)) return v;
    }
    return undefined;
  }
  function guessBrand(brandStr) {
    if (!brandStr) return undefined;
    const first = brandStr.trim().split(/\s+/)[0];
    const upper = first.toUpperCase();
    if (['LG', '삼성', 'SAMSUNG', '대우', '위니아', 'WHIRLPOOL'].includes(upper) || upper === 'LG') {
      return upper === 'SAMSUNG' ? '삼성' : first;
    }
    return undefined;
  }
  function scheduleLearn(item) {
    if (!item || item.kind !== 'APPLIANCE') return;
    const modelCode = (item.modelCode || '').trim();
    const brand = (item.brand || '').trim();
    const sizeStr = (item.size || '').trim();
    if (!modelCode || !brand || !sizeStr) return;
    if (!sizeStr.match(/\d{2,4}\s*[×x*Xㅅ]\s*\d{2,4}\s*[×x*Xㅅ]\s*\d{2,4}/)) return;
    const key = modelCode.toUpperCase();
    if (learnTimersRef.current[key]) clearTimeout(learnTimersRef.current[key]);
    learnTimersRef.current[key] = setTimeout(() => {
      applianceSpecsApi.learn({
        modelCode,
        productName: brand,
        brand: guessBrand(brand),
        category: guessCategory(item.itemName),
        sizeStr,
      }).catch(() => {}); // 조용히 실패 — 사용자 흐름 방해 안 함
      delete learnTimersRef.current[key];
    }, 5000);
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
    if ('modelCode' in patch) serverPatch.modelCode = patch.modelCode || null;
    if ('memo' in patch) serverPatch.memo = patch.memo || null;
    if ('quantityText' in patch) {
      serverPatch.unit = patch.quantityText || null;
      serverPatch.quantity = null;
    }
    if ('size' in patch) serverPatch.size = patch.size || null;
    if ('installed' in patch) serverPatch.installed = patch.installed;
    if ('sourceUrl' in patch) serverPatch.sourceUrl = patch.sourceUrl || null;
    // 상태 (status 변경 시 백엔드의 syncPurchaseOrders가 자동으로 PO 생성/동기화)
    if ('status' in patch) serverPatch.status = patch.status;
    // 즐겨찾기 토글
    if ('isFavorite' in patch) serverPatch.isFavorite = !!patch.isFavorite;
    if (Object.keys(serverPatch).length > 0) scheduleSave(id, serverPatch);

    // 가전 자동 학습 — APPLIANCE 행이고 modelCode/brand/size 변경에 영향 있는 patch면 트리거
    if (it && it.kind === 'APPLIANCE'
      && ('modelCode' in patch || 'brand' in patch || 'size' in patch || 'itemName' in patch)) {
      scheduleLearn({ ...it, ...patch });
    }
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
    // 그룹 안 첫 항목의 kind를 따라감 (items 또는 emptyGroups, 없으면 FINISH)
    const groupKind = kindHint
      || items.find((x) => x.spaceGroup === spaceGroup)?.kind
      || emptyGroups.find((g) => g.name === spaceGroup)?.kind
      || 'FINISH';
    // 첫 항목 추가 시 빈 그룹 목록에서 제거
    setEmptyGroups((prev) => prev.filter((g) => g.name !== spaceGroup));
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
          modelCode: '',
          quantityText: '',
          size: '',
          installed: null,
          sourceUrl: '',
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
  // 필드 분리: brand = 모델명("LG 디오스 식기세척기 14인용"), modelCode = 품번("DUE6BGL2E")
  async function addItemFromSpec(spaceGroup, spec) {
    const sizeStr = `${spec.widthMm} × ${spec.depthMm} × ${spec.heightMm}`;
    const itemNameLabel = ({
      REFRIGERATOR: '냉장고', KIMCHI_REFRIGERATOR: '김치냉장고',
      DISHWASHER: '식기세척기', WASHING_MACHINE: '세탁기',
      DRYER: '건조기', OVEN: '오븐', COOKTOP: '쿡탑', AIR_CONDITIONER: '에어컨',
      ROBOT_VACUUM: '로봇청소기',
    })[spec.category] || '가전';
    // brand는 "브랜드 + 제품명" (예: "LG 디오스 오브제컬렉션 식기세척기")
    const brandStr = `${spec.brand} ${spec.productName}`;
    const modelCodeStr = spec.modelCode || '';
    // 출처 URL — sources 배열에서 첫 번째 (보통 제조사 공식)
    const sourceUrlStr = spec.sources?.[0]?.url || '';
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
        modelCode: modelCodeStr,
        size: sizeStr,
        sourceUrl: sourceUrlStr || null,
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
          modelCode: modelCodeStr,
          quantityText: '',
          size: sizeStr,
          installed: null,
          sourceUrl: sourceUrlStr,
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
  // 가전: 설치 컬럼 제거됨 (가전은 발주 안 함)
  const APPLIANCE_COLS = ['itemName', 'brand', 'modelCode', 'size', 'memo'];
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
    // 빠른 편집 UX — 확인 다이얼로그 없이 즉시 삭제
    try {
      await materialsApi.remove(projectId, id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // ========== 그룹 추가/이름 변경/삭제 ==========
  // 마감재의 spaceGroup은 표준 공정 25개로 자동 흡수 (closed 척추 정책).
  // 가전·가구는 spaceGroup이 공간(거실/주방 등)이라 정규화 X.
  async function addGroup(kind = 'FINISH') {
    // 가전·가구 — prompt 없이 자동 이름으로 즉시 추가. 사용자는 그룹 헤더 이름 클릭으로 rename
    if (kind === 'APPLIANCE') {
      const base = '가전·가구';
      const taken = new Set([...groupNames, ...emptyGroups.map((g) => g.name)]);
      let finalName = base;
      let n = 2;
      while (taken.has(finalName)) finalName = `${base} ${n++}`;
      setEmptyGroups((prev) => [...prev, { name: finalName, kind: 'APPLIANCE' }]);
      return;
    }

    // 마감재 — InputModal로 입력 받음 (정규화·확인은 handleAddFinishGroup)
    setGroupModal({ mode: 'create' });
  }

  // InputModal에서 새 마감재 그룹 이름 확정 시 호출 — 표준 25개 정규화 + confirm
  function handleAddFinishGroup(name) {
    if (!name) { setGroupModal(null); return; }
    const trimmed = name.trim();
    if (!trimmed) { setGroupModal(null); return; }

    let finalName = trimmed;
    const phase = normalizePhase(trimmed);
    if (phase.key !== 'OTHER' && phase.label !== trimmed) {
      if (!confirm(`"${trimmed}" → 표준 공정 "${phase.label}"으로 자동 저장됩니다.\n계속하시겠어요?`)) {
        setGroupModal(null);
        return;
      }
      finalName = phase.label;
    }

    if (groupNames.includes(finalName)) {
      alert('이미 같은 이름의 그룹이 있습니다.');
      setGroupModal(null);
      return;
    }
    setEmptyGroups((prev) => [...prev, { name: finalName, kind: 'FINISH' }]);
    setGroupModal(null);
  }

  function renameGroup(from) {
    setGroupModal({ mode: 'rename', from });
  }

  // InputModal에서 이름 변경 확정
  async function handleRenameGroup(next) {
    if (next == null) { setGroupModal(null); return; }
    const from = groupModal?.from;
    const trimmed = next.trim();
    if (!trimmed || !from || trimmed === from) {
      setGroupModal(null);
      return;
    }

    const fromGroup = grouped.find((g) => g.name === from);
    let finalName = trimmed;
    if (fromGroup?.kind === 'FINISH') {
      const phase = normalizePhase(trimmed);
      if (phase.key !== 'OTHER' && phase.label !== trimmed) {
        if (!confirm(`"${trimmed}" → 표준 공정 "${phase.label}"으로 자동 저장됩니다. 계속하시겠어요?`)) {
          setGroupModal(null);
          return;
        }
        finalName = phase.label;
      }
    }

    if (finalName === from) { setGroupModal(null); return; }
    if (groupNames.includes(finalName)) {
      alert('이미 같은 이름의 그룹이 있습니다. 다른 이름을 사용하세요.');
      setGroupModal(null);
      return;
    }
    try {
      await materialsApi.renameGroup(projectId, from, finalName);
      setItems((prev) => prev.map((it) => (it.spaceGroup === from ? { ...it, spaceGroup: finalName } : it)));
      setGroupModal(null);
    } catch (e) {
      alert('이름 변경 실패: ' + (e.response?.data?.error || e.message));
      setGroupModal(null);
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
    const list = order.map((g) => {
      const arr = map.get(g).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      const kind = arr[0]?.kind || 'FINISH';
      const undecidedItems = arr.filter((it) => !it.locked && (it.status === 'UNDECIDED' || it.status === 'REVIEWING'));
      const minDays = undecidedItems
        .map((it) => it.daysToDeadline)
        .filter((d) => d != null)
        .reduce((min, d) => (min == null || d < min ? d : min), null);
      return { name: g, kind, items: arr, undecidedCount: undecidedItems.length, minDaysToDeadline: minDays };
    });
    // 빈 그룹 추가 (Material row 없는 그룹)
    for (const eg of emptyGroups) {
      if (!list.find((g) => g.name === eg.name)) {
        list.push({ name: eg.name, kind: eg.kind, items: [], undecidedCount: 0, minDaysToDeadline: null });
      }
    }
    return list;
  }, [items, emptyGroups]);
  const groupNames = grouped.map((g) => g.name);

  // 즐겨찾기 — isFavorite 항목 모음. spaceGroup 표기 같이 (어느 그룹의 항목인지)
  const favoriteItems = useMemo(
    () => items.filter((it) => it.isFavorite),
    [items]
  );

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
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { setQuoteDrawerGroup(null); setQuoteDrawerOpen(true); }}
            title="현재 프로젝트 견적의 공정별 금액·비고 보기"
            className="text-sm px-3 py-2 border border-amber-300 text-amber-700 bg-amber-50 rounded hover:bg-amber-100"
          >
            🪙 견적 보기
          </button>
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

      {/* 즐겨찾기 — 별표한 항목들 한 곳에 모아 상단 고정 */}
      {favoriteItems.length > 0 && (
        <FavoritesCard
          items={favoriteItems}
          savingMap={savingMap}
          onItemPatch={patchItem}
          onItemRemove={removeItem}
          onToggleConfirmed={toggleConfirmed}
          onCellKeyDown={handleCellKeyDown}
        />
      )}

      {grouped.map((g) => (
        <GroupCard
          key={g.name}
          group={g}
          projectId={projectId}
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
          onShowQuote={() => { setQuoteDrawerGroup(g.name); setQuoteDrawerOpen(true); }}
          onShowImport={() => setImportTarget({ spaceGroup: g.name, kind: g.kind })}
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

      <QuoteContextDrawer
        projectId={projectId}
        activeSpaceGroup={quoteDrawerGroup}
        open={quoteDrawerOpen}
        onClose={() => setQuoteDrawerOpen(false)}
      />

      {importTarget && (
        <MaterialImportModal
          projectId={projectId}
          spaceGroup={importTarget.spaceGroup}
          kind={importTarget.kind}
          onClose={() => setImportTarget(null)}
          onImported={() => { setImportTarget(null); reload(); }}
        />
      )}

      {groupModal?.mode === 'create' && (
        <InputModal
          title="새 마감재 그룹"
          placeholder="예: 목공, 도배, 화장실"
          hint="표준 25개 공정으로 자동 흡수됩니다 (자유 텍스트는 '기타' 그룹으로)."
          confirmLabel="추가"
          onConfirm={handleAddFinishGroup}
          onCancel={() => setGroupModal(null)}
        />
      )}
      {groupModal?.mode === 'rename' && (
        <InputModal
          title={`그룹 이름 변경 — "${groupModal.from}"`}
          defaultValue={groupModal.from}
          confirmLabel="변경"
          onConfirm={handleRenameGroup}
          onCancel={() => setGroupModal(null)}
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
// ============================================
// 즐겨찾기 카드 — 별표한 항목들 한 곳에 모음. FINISH/APPLIANCE 혼합 가능
// 항목 옆에 원래 그룹명 작게 표시 (어디에서 별표한 건지 컨텍스트 유지)
// ============================================
function FavoritesCard({ items, savingMap, onItemPatch, onItemRemove, onToggleConfirmed, onCellKeyDown }) {
  const { displayPhase } = usePhaseLabels();
  return (
    <div className="bg-amber-50/50 rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-amber-200 bg-amber-100/40 flex items-center gap-2">
        <span className="text-amber-600 font-bold text-base">★</span>
        <span className="font-bold text-amber-800">즐겨찾기</span>
        <span className="text-xs text-amber-700/70 tabular-nums">{items.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '32px' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '70px' }} />
            <col />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className="bg-amber-50 text-xs text-amber-800/70">
            <tr>
              <th className="text-center"></th>
              <th className="text-left px-2 py-1.5">그룹</th>
              <th className="text-left px-2 py-1.5">항목</th>
              <th className="text-left px-2 py-1.5">브랜드 규격 등</th>
              <th className="text-left px-2 py-1.5">수량</th>
              <th className="text-left px-2 py-1.5">비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-amber-50/40">
                <td className="px-2 py-1.5 text-center">
                  <ConfirmCheckbox item={it} onToggle={() => onToggleConfirmed(it.id)} />
                </td>
                <td className="px-2 py-1.5 text-xs text-amber-700 truncate" title={it.spaceGroup}>
                  {displayPhase(it.spaceGroup || '')}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={it.itemName || ''}
                    onChange={(e) => onItemPatch(it.id, { itemName: e.target.value })}
                    onKeyDown={(e) => onCellKeyDown?.(e, it.id, 'itemName')}
                    className="w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 bg-transparent"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={it.brand || ''}
                    onChange={(e) => onItemPatch(it.id, { brand: e.target.value })}
                    onKeyDown={(e) => onCellKeyDown?.(e, it.id, 'brand')}
                    className="w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 bg-transparent"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={it.quantityText || ''}
                    onChange={(e) => onItemPatch(it.id, { quantityText: e.target.value })}
                    onKeyDown={(e) => onCellKeyDown?.(e, it.id, 'quantityText')}
                    className="w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 bg-transparent"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={it.memo || ''}
                    onChange={(e) => onItemPatch(it.id, { memo: e.target.value })}
                    onKeyDown={(e) => onCellKeyDown?.(e, it.id, 'memo')}
                    className="w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 bg-transparent"
                  />
                </td>
                <td className="px-1 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onItemPatch(it.id, { isFavorite: false })}
                      tabIndex={-1}
                      className="text-amber-500 hover:text-amber-600 text-sm leading-none"
                      title="즐겨찾기 해제"
                    >★</button>
                    {savingMap[it.id] ? (
                      <span className="text-xs sm:text-[10px] text-gray-400">…</span>
                    ) : (
                      <button
                        onClick={() => onItemRemove(it.id)}
                        tabIndex={-1}
                        className="text-gray-300 hover:text-rose-500 text-sm"
                        title="삭제"
                      >✕</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupCard({ group, projectId, savingMap, onItemPatch, onItemRemove, onAddItem, onAddApplianceFromSpec, onRenameGroup, onRemoveGroup, onConfirmGroup, onToggleConfirmed, onCellKeyDown, onShowQuote, onShowImport }) {
  const { displayPhase } = usePhaseLabels();
  // 그룹 접기 상태를 localStorage에 영구 저장 — 새로고침해도 유지
  const storageKey = `mat-collapsed:${projectId}:${group.name}`;
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; }
    catch { return false; }
  });
  useEffect(() => {
    try {
      if (collapsed) localStorage.setItem(storageKey, '1');
      else localStorage.removeItem(storageKey);
    } catch { /* noop */ }
  }, [collapsed, storageKey]);
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
      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 ${collapsed ? '' : 'border-b'} ${headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? '펼치기' : '접기'}
            className={`${accentText} font-bold flex-shrink-0 hover:bg-white/60 rounded w-5 h-5 flex items-center justify-center text-sm leading-none`}
          >
            {collapsed ? '▸' : '▾'}
          </button>
          <button
            onClick={onRenameGroup}
            className={`text-base font-bold ${titleText} hover:underline truncate text-left`}
            title="그룹 이름 변경"
          >
            {displayPhase(group.name)}
          </button>
          {!isAppliance && <OtherBadge phase={group.name} />}
          {/* 확정 카운트는 마감재에만 표시 (가전은 발주 안 함) */}
          {!isAppliance && (
            <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
              {confirmedCount}/{total} 확정
            </span>
          )}
          {isAppliance && total > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
              {total}개
            </span>
          )}
          {!isAppliance && group.undecidedCount > 0 && group.minDaysToDeadline != null && group.minDaysToDeadline <= 7 && (
            <DeadlineWarning days={group.minDaysToDeadline} count={group.undecidedCount} />
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* 공정별 불러오기 — 회사 템플릿 + 다른 프로젝트 마감재 체크해서 일괄 추가 */}
          {!isAppliance && onShowImport && (
            <button
              onClick={onShowImport}
              title={`'${group.name}' 공정에 회사 템플릿/다른 프로젝트에서 불러오기`}
              className="text-xs px-2 py-1 border border-sky-300 text-sky-700 rounded hover:bg-sky-50"
            >
              📋 불러오기
            </button>
          )}
          {/* 견적 컨텍스트 — 이 그룹의 견적 정보 즉시 보기 */}
          {onShowQuote && (
            <button
              onClick={onShowQuote}
              title={`'${group.name}' 견적 정보 보기`}
              className="text-xs px-2 py-1 border border-amber-300 text-amber-700 rounded hover:bg-amber-50"
            >
              🪙 견적
            </button>
          )}
          {/* 발주 자동 생성 버튼은 마감재에만 (가전은 발주 안 함) */}
          {!isAppliance && pendingActionable > 0 && (
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

      {!collapsed && (
        <div className="overflow-x-auto">
          {isAppliance ? (
            <ApplianceTable group={group} savingMap={savingMap} onItemPatch={onItemPatch} onItemRemove={onItemRemove} onCellKeyDown={onCellKeyDown} />
          ) : (
            <FinishTable group={group} savingMap={savingMap} onItemPatch={onItemPatch} onItemRemove={onItemRemove} onCellKeyDown={onCellKeyDown} onToggleConfirmed={onToggleConfirmed} />
          )}
        </div>
      )}
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
// 가전·가구 테이블 (품목 / 모델명 / 품번+↗ / 사이즈 / 비고)
// 가전은 발주 안 함 — 체크박스·설치·잠금 모두 제거
// ============================================
function ApplianceTable({ group, savingMap, onItemPatch, onItemRemove, onCellKeyDown }) {
  return (
    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '13%' }} />{/* 품목 */}
        <col style={{ width: '24%' }} />{/* 모델명 */}
        <col style={{ width: '18%' }} />{/* 품번 + 링크 */}
        <col style={{ width: '140px' }} />{/* 사이즈 */}
        <col />{/* 비고 */}
        <col style={{ width: '24px' }} />
      </colgroup>
      <thead className="bg-gray-50 text-xs text-gray-500">
        <tr>
          <th className="text-left px-2 py-1.5">품목</th>
          <th className="text-left px-2 py-1.5">모델명</th>
          <th className="text-left px-2 py-1.5">품번 / 출처</th>
          <th className="text-left px-2 py-1.5">사이즈 (W×D×H)</th>
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
// 가전·가구 행 — 체크박스·설치·잠금 모두 제거 (가전은 발주 안 함)
// 품번 셀에 출처 URL 링크 (↗ 아이콘) 노출
// ============================================
function ApplianceRow({ item, saving, onChange, onRemove, onCellKeyDown }) {
  const inputCls = 'w-full px-1 py-1 border-transparent border rounded outline-none focus:border-violet-400 hover:border-gray-200';
  const kd = (col) => (e) => onCellKeyDown?.(e, item.id, col);
  const cellAttrs = (col) => ({ 'data-mat-cell': `${item.id}-${col}`, onKeyDown: kd(col) });
  const sourceUrl = (item.sourceUrl || '').trim();
  return (
    <tr className="hover:bg-gray-50">
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
          placeholder="예: BESPOKE 4도어 871L"
        />
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1">
          <input
            {...cellAttrs('modelCode')}
            value={item.modelCode || ''}
            onChange={(e) => onChange({ modelCode: e.target.value })}
            className={inputCls + ' font-mono text-xs'}
            placeholder="예: RF85R9013S8"
          />
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              title={`출처 페이지 열기 (${sourceUrl})`}
              className="text-violet-500 hover:text-violet-700 text-xs flex-shrink-0 px-1"
            >
              ↗
            </a>
          ) : null}
        </div>
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
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('memo')}
          value={item.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={inputCls}
          placeholder="빌트인 여부, 도어 개폐 방향, 콘센트 위치 등"
        />
      </td>
      <td className="px-1 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onChange({ isFavorite: !item.isFavorite })}
            tabIndex={-1}
            className={`text-sm leading-none ${item.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-400'}`}
            title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 — 상단 고정'}
          >
            {item.isFavorite ? '★' : '☆'}
          </button>
          {saving ? (
            <span className="text-xs sm:text-[10px] text-gray-400" title="저장 중">…</span>
          ) : (
            <button
              onClick={onRemove}
              tabIndex={-1}
              className="text-gray-300 hover:text-rose-500 text-sm"
              title="삭제"
            >✕</button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ItemRow({ item, saving, onChange, onRemove, onCellKeyDown, onToggle }) {
  const locked = !!item.locked;
  const inputCls = `w-full px-1 py-1 border-transparent border rounded outline-none focus:border-navy-400 hover:border-gray-200 ${
    locked ? 'bg-transparent text-gray-600 cursor-default' : ''
  }`;
  const kd = (col) => (e) => onCellKeyDown?.(e, item.id, col);
  const cellAttrs = (col) => ({
    'data-mat-cell': `${item.id}-${col}`,
    onKeyDown: kd(col),
    disabled: locked,
  });
  const rowCls = locked ? 'bg-gray-50/50' : 'hover:bg-gray-50';
  return (
    <tr className={rowCls}>
      <td className="px-2 py-1.5 text-center">
        <ConfirmCheckbox item={item} onToggle={onToggle} />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('itemName')}
          value={item.itemName || ''}
          onChange={(e) => onChange({ itemName: e.target.value })}
          className={inputCls}
          placeholder="예: 콘센트"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('brand')}
          value={item.brand || ''}
          onChange={(e) => onChange({ brand: e.target.value })}
          className={inputCls}
          placeholder="예: 르그랑 / 무광 블랙 / 9미리"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('quantityText')}
          value={item.quantityText || ''}
          onChange={(e) => onChange({ quantityText: e.target.value })}
          className={inputCls.replace(/cursor-default/, '')}
          placeholder="예: 12개"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          {...cellAttrs('memo')}
          value={item.memo || ''}
          onChange={(e) => onChange({ memo: e.target.value })}
          className={inputCls}
          placeholder="설명/색상/위치 등"
        />
      </td>
      <td className="px-1 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onChange({ isFavorite: !item.isFavorite })}
            tabIndex={-1}
            className={`text-sm leading-none ${item.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-400'}`}
            title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 — 상단 고정'}
          >
            {item.isFavorite ? '★' : '☆'}
          </button>
          {saving ? (
            <span className="text-xs sm:text-[10px] text-gray-400" title="저장 중">…</span>
          ) : (
            !locked && (
              <button
                onClick={onRemove}
                tabIndex={-1}
                className="text-gray-300 hover:text-rose-500 text-sm"
                title="삭제"
              >✕</button>
            )
          )}
        </div>
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
