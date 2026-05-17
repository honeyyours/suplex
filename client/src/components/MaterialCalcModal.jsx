// 자재 산출 모달 — 편의기능 탭 카드에서 트리거
// 자재 4종(타일·도배·마루·페인트) 평수 → 발주 권장량 즉시 계산.
// 인건비 정산 패턴 재활용: 카톡 텍스트 복사 + 메모 탭 자동 기록 ("자재발주" 태그).
// 격리 정책: 견적·발주 자동 push 없음. 카톡 텍스트만 산출.
// 산식 근거: docs/검증_자재산식_2026-05-17.md (한국 플랫폼 8곳 검증값).
import { useMemo, useState } from 'react';
import { projectMemosApi } from '../api/projectMemos';
import { useEscape } from '../hooks/useEscape';
import { useAuth } from '../contexts/AuthContext';
import { appendKakaoFooter } from '../utils/kakaoFooter';

const PYEONG_TO_M2 = 3.3058;
const ceil = (n) => Math.ceil(Math.max(0, n || 0));
const num = (v, def = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};
const fmt = (n, d = 1) =>
  Number.isFinite(n) ? n.toLocaleString('ko-KR', { maximumFractionDigits: d }) : '—';
const fmtInt = (n) => (Number.isFinite(n) ? Math.ceil(n).toLocaleString('ko-KR') : '—');

// ─────────────────────────────── 자재별 산식 ───────────────────────────────

// 타일 — 박스당 매수 규격별 자동 매핑 (한국 유통 표준)
const TILE_BOX_BY_SPEC = {
  '300x300': 16,
  '300x600': 8,
  '600x600': 4,
  '600x1200': 2,
  '800x800': 2,
};
const TILE_LOSS_BY_PART = { wall: 7, floor: 10, bathkitchen: 15 };

function calcTile(input) {
  const pyeong = input.areaMode === 'dimension'
    ? (num(input.width) * num(input.length)) / PYEONG_TO_M2
    : num(input.pyeong);
  const area_m2 = pyeong * PYEONG_TO_M2;
  const [w, h] = input.spec === 'custom'
    ? [num(input.customW, 600), num(input.customH, 600)]
    : input.spec.split('x').map(Number);
  const tile_m2 = (w / 1000) * (h / 1000);
  const netPieces = tile_m2 > 0 ? area_m2 / tile_m2 : 0;
  const loss = num(input.loss);
  const orderPieces = ceil(netPieces * (1 + loss / 100));
  const perBox = Math.max(1, num(input.perBox, 1));
  const boxes = ceil(orderPieces / perBox);
  return {
    primary: { label: '발주 권장 매수', value: fmtInt(orderPieces), unit: '매' },
    sub: `순수 ${fmtInt(netPieces)}매 + 로스 ${loss}%`,
    metrics: [
      ['시공 평수', `${fmt(pyeong, 2)}평`],
      ['시공 면적', `${fmt(area_m2, 2)}㎡`],
      ['박스 수', `${fmtInt(boxes)}박스`],
      ['타일 1매', `${fmt(tile_m2, 3)}㎡`],
    ],
    copyLines: [
      `발주 권장: ${fmtInt(orderPieces)}매 (${fmtInt(boxes)}박스)`,
      `시공 면적: ${fmt(area_m2, 2)}㎡ (${fmt(pyeong, 2)}평)`,
      `규격: ${input.spec === 'custom' ? `${w}×${h}mm (직접 입력)` : `${input.spec}mm`}`,
      `순수 ${fmtInt(netPieces)}매 + 로스 ${loss}%`,
    ],
  };
}

// 도배 — 간편(×2.5) / 상세(1.65×(천장/2.4) + 0.65) 토글
const WALLPAPER_ROLL_PYEONG = { silk: 5, paper: 2, wide: 5 };
const WALLPAPER_LABEL = { silk: '실크', paper: '합지', wide: '광폭합지' };

function calcWallpaper(input) {
  const realPyeong = num(input.pyeong);
  const ceilingH = num(input.ceilingH, 2.4);
  const includeCeiling = input.includeCeiling;
  const loss = num(input.loss);
  const type = input.type || 'silk';

  let dobaePyeong;
  if (input.mode === 'simple') {
    // 간편 모드: 한국 B2C 통설 (마미견적서·꾸미고·세민)
    dobaePyeong = realPyeong * 2.5;
  } else {
    // 상세 모드: B 사이트 산식 (LX 표준과 검증 일치, "32평=실크 15롤")
    const wall = realPyeong * 1.65 * (ceilingH / 2.4);
    const ceiling = includeCeiling ? realPyeong * 0.65 : 0;
    dobaePyeong = wall + ceiling;
  }
  const dobae_m2 = dobaePyeong * PYEONG_TO_M2;
  const perRoll = WALLPAPER_ROLL_PYEONG[type] || 5;
  const netRolls = perRoll > 0 ? dobaePyeong / perRoll : 0;
  const orderRolls = ceil(netRolls * (1 + loss / 100));
  const glueKg = ceil(dobae_m2 / 12); // 종류별 격차 없이 통일

  return {
    primary: { label: '발주 권장 롤 수', value: fmtInt(orderRolls), unit: '롤' },
    sub: `순수 ${fmt(netRolls, 1)}롤 + 로스 ${loss}%`,
    metrics: [
      ['도배 평수', `${fmt(dobaePyeong, 1)}평`],
      ['도배 면적', `${fmt(dobae_m2, 1)}㎡`],
      ['롤당 시공평수', `${fmt(perRoll, 1)}평`],
      ['예상 풀', `${fmtInt(glueKg)}kg`],
    ],
    copyLines: [
      `발주 권장: ${fmtInt(orderRolls)}롤 (${WALLPAPER_LABEL[type]})`,
      `도배 평수: ${fmt(dobaePyeong, 1)}평${input.mode === 'simple' ? ' (간편 ×2.5)' : ''}`,
      `도배 면적: ${fmt(dobae_m2, 1)}㎡`,
      `예상 풀: ${fmtInt(glueKg)}kg`,
      `순수 ${fmt(netRolls, 1)}롤 · 추가로스 ${loss}%`,
    ],
  };
}

// 마루 — 강마루 1.0평/박스 (구정·동화 검증된 시장 표준)
const FLOOR_BOX_PYEONG = {
  laminate: 0.5,    // 강화마루 (HDF 코어, 클릭 끼움)
  engineered: 1.0,  // 강마루 ★ 검증 표준
  hardwood: 0.5,    // 원목마루 (엔지니어드)
  herringbone: 0.5, // 헤링본 강마루
};
const FLOOR_LABEL = {
  laminate: '강화마루',
  engineered: '강마루',
  hardwood: '원목마루',
  herringbone: '헤링본',
};

function calcFloor(input) {
  const pyeong = input.areaMode === 'dimension'
    ? (num(input.width) * num(input.length)) / PYEONG_TO_M2
    : num(input.pyeong);
  const area_m2 = pyeong * PYEONG_TO_M2;
  const perBox = Math.max(0.01, num(input.perBox, 0.7));
  const loss = num(input.loss);
  const netBoxes = pyeong / perBox;
  const orderBoxes = ceil(netBoxes * (1 + loss / 100));
  const orderPyeong = pyeong * (1 + loss / 100);
  const perimeter = num(input.perimeter);

  return {
    primary: { label: '발주 권장 박스 수', value: fmtInt(orderBoxes), unit: '박스' },
    sub: `순수 ${fmt(netBoxes, 1)}박스 + 로스 ${loss}%`,
    metrics: [
      ['시공 평수', `${fmt(pyeong, 2)}평`],
      ['시공 면적', `${fmt(area_m2, 2)}㎡`],
      ['발주 평수', `${fmt(orderPyeong, 1)}평`],
      ['걸레받이', perimeter > 0 ? `${fmt(perimeter, 1)}m` : '—'],
    ],
    copyLines: [
      `발주 권장: ${fmtInt(orderBoxes)}박스 (${FLOOR_LABEL[input.type] || ''} · 박스당 ${perBox}평)`,
      `시공 면적: ${fmt(area_m2, 2)}㎡ (${fmt(pyeong, 2)}평)`,
      `발주 평수: ${fmt(orderPyeong, 1)}평`,
      perimeter > 0 ? `걸레받이: ${fmt(perimeter, 1)}m` : null,
      `순수 ${fmt(netBoxes, 1)}박스 + 로스 ${loss}%`,
    ].filter(Boolean),
  };
}

// 페인트 — 간편(coverage 6) / 상세(종류별)
const PAINT_COVERAGE = { water: 6, eco: 6, oil: 8, primer: 5 };
const PAINT_LABEL = { water: '수성', eco: '친환경', oil: '유성', primer: '퍼티/프라이머' };

function calcPaint(input) {
  const pyeong = num(input.pyeong);
  const ceilingH = num(input.ceilingH, 2.4);
  const target = input.target || 'wall';
  const coats = Math.max(1, num(input.coats, 2));
  const loss = num(input.loss);
  const type = input.type || 'water';
  const coverage = input.mode === 'simple' ? 6 : (PAINT_COVERAGE[type] || 6);

  let paintArea;
  if (target === 'direct') {
    paintArea = num(input.directArea);
  } else if (target === 'ceiling') {
    paintArea = pyeong * PYEONG_TO_M2;
  } else {
    // 벽 도장: 평 × 1.65 × (천장/2.4) × 3.3058
    paintArea = pyeong * 1.65 * (ceilingH / 2.4) * PYEONG_TO_M2;
  }
  const coatedArea = paintArea * coats;
  const netLiters = coverage > 0 ? coatedArea / coverage : 0;
  const orderLiters = ceil(netLiters * (1 + loss / 100));
  const buckets = ceil(orderLiters / 18);
  const cans4 = ceil(orderLiters / 4);

  return {
    primary: { label: '발주 권장 말통', value: fmtInt(buckets), unit: '통' },
    sub: `18L 기준 · 필요 ${fmt(orderLiters, 1)}L · ${coats}회 도장`,
    metrics: [
      ['시공 면적', `${fmt(paintArea, 1)}㎡`],
      ['도장 면적', `${fmt(coatedArea, 1)}㎡`],
      ['순수 필요량', `${fmt(netLiters, 1)}L`],
      ['4L 캔 환산', `${fmtInt(cans4)}캔`],
    ],
    copyLines: [
      `발주 권장: 18L ${fmtInt(buckets)}통 (${PAINT_LABEL[type]})`,
      `시공 면적: ${fmt(paintArea, 1)}㎡ · 도장 면적: ${fmt(coatedArea, 1)}㎡`,
      `필요량: ${fmt(orderLiters, 1)}L (4L 캔 ${fmtInt(cans4)}캔)`,
      `${coats}회 도장 · 로스 ${loss}% · coverage ${coverage}㎡/L${input.mode === 'simple' ? ' (간편)' : ''}`,
    ],
  };
}

const CALCULATORS = {
  tile: calcTile,
  wallpaper: calcWallpaper,
  floor: calcFloor,
  paint: calcPaint,
};

// ─────────────────────────────── 자재 메타 ───────────────────────────────
const MATERIALS = [
  { key: 'tile',      icon: '🧱', name: '타일',   color: 'amber',   note: '욕실·주방 등 절단이 많은 부위는 로스 15% 이상 권장. 동일 LOT 확보를 위해 박스 단위 발주가 안전합니다.' },
  { key: 'wallpaper', icon: '🎨', name: '도배',   color: 'sky',     note: '간편 모드 = 한국 B2C 통설(전용평×2.5). 상세 모드 = 벽 1.65 + 천장 0.65 분리 (LX 표준).' },
  { key: 'floor',     icon: '📦', name: '마루',   color: 'emerald', note: '강마루 1박스 = 1평 (구정·동화 시장 표준). 동일 LOT 확보를 위해 박스 단위 발주 필수. 헤링본은 로스 10% 이상.' },
  { key: 'paint',     icon: '🪣', name: '페인트', color: 'rose',    note: '1말통 = 18L (한국 표준). 2회 도장 기준. 수성 1L = 6㎡ (4대 제조사 공통). 거친면·진한 색 변경 시 로스 15~20% 권장.' },
];

const DEFAULT_INPUT = {
  tile: {
    areaMode: 'pyeong', pyeong: '10', width: '5', length: '4',
    part: 'floor',
    spec: '600x600', customW: '600', customH: '600',
    perBox: 4,
    loss: 10,
  },
  wallpaper: {
    mode: 'simple',
    type: 'silk',
    pyeong: '24',
    ceilingH: '2.4',
    includeCeiling: false,
    loss: 0,
  },
  floor: {
    areaMode: 'pyeong', pyeong: '20', width: '5', length: '4',
    type: 'engineered',
    perBox: 1.0,
    perimeter: '20',
    loss: 8,
  },
  paint: {
    mode: 'simple',
    type: 'water',
    target: 'wall',
    pyeong: '24',
    ceilingH: '2.4',
    directArea: '30',
    coats: 2,
    loss: 10,
  },
};

// 종류 변경 시 자동 채움값
const FLOOR_PERBOX_SYNC = (type) => FLOOR_BOX_PYEONG[type] ?? 1.0;
const TILE_BOX_SYNC = (spec) => TILE_BOX_BY_SPEC[spec] ?? 4;

// ─────────────────────────────── 메인 컴포넌트 ───────────────────────────────
export default function MaterialCalcModal({ project, projectId, onClose }) {
  useEscape(true, onClose);
  const { auth } = useAuth();

  const [material, setMaterial] = useState('tile');
  const [spaceName, setSpaceName] = useState('');
  const [inputs, setInputs] = useState(() => structuredClone(DEFAULT_INPUT));
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const input = inputs[material];
  const result = useMemo(() => CALCULATORS[material](input), [material, input]);
  const meta = MATERIALS.find((m) => m.key === material);

  function patch(updates) {
    setInputs((prev) => ({ ...prev, [material]: { ...prev[material], ...updates } }));
  }

  // 종속 필드 자동 동기화
  function changeFloorType(type) {
    patch({ type, perBox: FLOOR_PERBOX_SYNC(type) });
  }
  function changeTileSpec(spec) {
    if (spec === 'custom') { patch({ spec }); return; }
    patch({ spec, perBox: TILE_BOX_SYNC(spec) });
  }
  function changeTilePart(part) {
    patch({ part, loss: TILE_LOSS_BY_PART[part] ?? 10 });
  }

  function buildText() {
    const head = project
      ? `[${project.name}] 자재 산출 - ${meta.name}`
      : `자재 산출 - ${meta.name}`;
    const lines = [head, '━━━━━━━━━━━━━━━', ...result.copyLines, '━━━━━━━━━━━━━━━'];
    if (spaceName.trim()) lines.push(`공간: ${spaceName.trim()}`);
    return lines.join('\n');
  }

  async function copyAndSave() {
    setBusy(true);
    try {
      const text = appendKakaoFooter(buildText(), auth?.company?.plan);
      await navigator.clipboard.writeText(text);

      if (projectId) {
        await projectMemosApi.create(projectId, {
          tag: '자재발주',
          content: text,
        }).catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('메모 자동 기록 실패', e);
        });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert('복사 실패: ' + (e?.message || ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">📐 자재 산출</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            자재 4종(타일·도배·마루·페인트) 평수 → 발주 권장량 즉시 계산. 한국 4대 제조사·시공자 검증값 적용.
            <span className="text-violet-700"> 복사와 동시에 메모 탭에 "자재발주" 태그로 자동 기록됩니다.</span>
          </p>
        </div>

        {/* 자재 탭 */}
        <div className="px-6 pt-3 pb-1 border-b bg-gray-50">
          <div className="flex flex-wrap gap-1.5">
            {MATERIALS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMaterial(m.key)}
                className={`text-sm px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
                  material === m.key
                    ? 'bg-navy-700 text-white border-navy-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* 공간명 (공통) */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">공간명 (선택)</div>
            <input
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="예: 거실 / 욕실 / 방1"
              className="w-full sm:w-64 px-3 py-2 border rounded text-sm"
            />
          </div>

          {/* 입력 + 결과 2-column */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 입력 패널 */}
            <div className="lg:col-span-2 space-y-3">
              {material === 'tile' && <TileInputs input={input} patch={patch} changeTileSpec={changeTileSpec} changeTilePart={changeTilePart} />}
              {material === 'wallpaper' && <WallpaperInputs input={input} patch={patch} />}
              {material === 'floor' && <FloorInputs input={input} patch={patch} changeFloorType={changeFloorType} />}
              {material === 'paint' && <PaintInputs input={input} patch={patch} />}
            </div>

            {/* 결과 패널 */}
            <div className="lg:col-span-3 space-y-3">
              <div className="rounded-lg border bg-gradient-to-br from-navy-50 to-white px-5 py-4">
                <div className="text-xs text-gray-500">{result.primary.label}</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-bold text-navy-800 tabular-nums">{result.primary.value}</span>
                  <span className="text-lg text-gray-600">{result.primary.unit}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{result.sub}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {result.metrics.map(([label, value]) => (
                  <div key={label} className="border rounded px-3 py-2">
                    <div className="text-[11px] text-gray-500">{label}</div>
                    <div className="text-sm font-medium text-gray-800 tabular-nums">{value}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 leading-relaxed">
                <span className="font-bold">💡 현장 메모</span> · {meta.note}
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">미리보기 (카톡에 붙여넣을 텍스트)</div>
                <pre className="bg-gray-50 border rounded p-3 text-xs font-mono whitespace-pre-wrap text-gray-700">
{buildText()}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded">닫기</button>
          <button
            onClick={copyAndSave}
            disabled={busy}
            className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${
              copied ? 'bg-emerald-600' : 'bg-navy-700 hover:bg-navy-800'
            }`}
          >
            {busy ? '처리 중...' : copied ? '✓ 복사됨' : '📋 카톡 복사 + 메모 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── 입력 서브 컴포넌트 ───────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded border bg-gray-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`text-xs px-3 py-1 rounded transition ${
            value === o.value ? 'bg-white text-navy-800 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumInput({ value, onChange, step = '0.01', min = '0', className = '' }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-2.5 py-1.5 border rounded text-sm tabular-nums ${className || 'w-full'}`}
    />
  );
}

function Presets({ values, current, onPick }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {values.map((v) => (
        <button
          key={v.value}
          type="button"
          onClick={() => onPick(v.value)}
          className={`text-[11px] px-2 py-0.5 rounded border transition ${
            String(current) === String(v.value)
              ? 'bg-navy-700 text-white border-navy-700'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

// ─── 타일 ───
function TileInputs({ input, patch, changeTileSpec, changeTilePart }) {
  return (
    <>
      <Field label="시공 부위">
        <Seg
          value={input.part}
          onChange={changeTilePart}
          options={[
            { value: 'wall', label: '일반벽 (7%)' },
            { value: 'floor', label: '바닥 (10%)' },
            { value: 'bathkitchen', label: '욕실·주방 (15%)' },
          ]}
        />
      </Field>
      <Field label="면적 입력 방식">
        <Seg
          value={input.areaMode}
          onChange={(v) => patch({ areaMode: v })}
          options={[
            { value: 'pyeong', label: '평수' },
            { value: 'dimension', label: '가로×세로' },
          ]}
        />
      </Field>
      {input.areaMode === 'pyeong' ? (
        <Field label="시공 평수" hint="1평 = 3.3058㎡">
          <NumInput value={input.pyeong} onChange={(v) => patch({ pyeong: v })} className="w-full" />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Field label="가로 (m)"><NumInput value={input.width} onChange={(v) => patch({ width: v })} /></Field>
          <Field label="세로 (m)"><NumInput value={input.length} onChange={(v) => patch({ length: v })} /></Field>
        </div>
      )}
      <Field label="타일 규격 (mm)" hint="선택 시 박스당 매수 자동 채움">
        <select
          value={input.spec}
          onChange={(e) => changeTileSpec(e.target.value)}
          className="w-full px-2.5 py-1.5 border rounded text-sm"
        >
          {Object.keys(TILE_BOX_BY_SPEC).map((s) => (
            <option key={s} value={s}>{s.replace('x', ' × ')}</option>
          ))}
          <option value="custom">직접 입력</option>
        </select>
      </Field>
      {input.spec === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="가로 (mm)"><NumInput value={input.customW} onChange={(v) => patch({ customW: v })} step="1" /></Field>
          <Field label="세로 (mm)"><NumInput value={input.customH} onChange={(v) => patch({ customH: v })} step="1" /></Field>
        </div>
      )}
      <Field label="박스당 매수" hint="규격 선택 시 자동 채움. 자재상 카탈로그가 다르면 직접 수정">
        <NumInput value={input.perBox} onChange={(v) => patch({ perBox: v })} step="1" className="w-full" />
      </Field>
      <Field label="로스율 (%)">
        <NumInput value={input.loss} onChange={(v) => patch({ loss: v })} step="1" className="w-full" />
        <Presets
          values={[
            { value: 7, label: '일반 7%' },
            { value: 10, label: '권장 10%' },
            { value: 15, label: '절단 15%' },
            { value: 20, label: '복잡 20%' },
          ]}
          current={input.loss}
          onPick={(v) => patch({ loss: v })}
        />
      </Field>
    </>
  );
}

// ─── 도배 ───
function WallpaperInputs({ input, patch }) {
  return (
    <>
      <Field label="산출 방식">
        <Seg
          value={input.mode}
          onChange={(v) => patch({ mode: v })}
          options={[
            { value: 'simple', label: '간편 (×2.5)' },
            { value: 'detail', label: '상세 (벽+천장)' },
          ]}
        />
      </Field>
      <Field label="벽지 종류">
        <select
          value={input.type}
          onChange={(e) => patch({ type: e.target.value })}
          className="w-full px-2.5 py-1.5 border rounded text-sm"
        >
          <option value="silk">실크벽지 (1롤 ≈ 5평)</option>
          <option value="paper">합지벽지 (1롤 ≈ 2평)</option>
          <option value="wide">광폭합지 (1롤 ≈ 5평)</option>
        </select>
      </Field>
      <Field label="시공 평수 (실평수)">
        <NumInput value={input.pyeong} onChange={(v) => patch({ pyeong: v })} className="w-full" />
      </Field>
      {input.mode === 'detail' && (
        <>
          <Field label="천장 높이 (m)" hint="벽 면적 환산에 사용 (×(천장/2.4) 보정)">
            <NumInput value={input.ceilingH} onChange={(v) => patch({ ceilingH: v })} className="w-full" />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!input.includeCeiling}
              onChange={(e) => patch({ includeCeiling: e.target.checked })}
              className="h-4 w-4"
            />
            <span>천장 도배 포함 (실평수 × 0.65)</span>
          </label>
        </>
      )}
      <Field
        label="추가 로스율 (%)"
        hint={input.mode === 'simple' ? '×2.5에 자연 로스 일부 포함 — 무늬·사선 시공 시에만 추가' : '환산식에 자연 로스 포함 — 무늬 매칭/사선 시에만 추가'}
      >
        <NumInput value={input.loss} onChange={(v) => patch({ loss: v })} step="1" className="w-full" />
        <Presets
          values={[
            { value: 0, label: '기본 0%' },
            { value: 10, label: '실크 10%' },
            { value: 15, label: '합지 15%' },
            { value: 20, label: '무늬 20%' },
          ]}
          current={input.loss}
          onPick={(v) => patch({ loss: v })}
        />
      </Field>
    </>
  );
}

// ─── 마루 ───
function FloorInputs({ input, patch, changeFloorType }) {
  return (
    <>
      <Field label="면적 입력 방식">
        <Seg
          value={input.areaMode}
          onChange={(v) => patch({ areaMode: v })}
          options={[
            { value: 'pyeong', label: '평수' },
            { value: 'dimension', label: '가로×세로' },
          ]}
        />
      </Field>
      {input.areaMode === 'pyeong' ? (
        <Field label="시공 평수"><NumInput value={input.pyeong} onChange={(v) => patch({ pyeong: v })} className="w-full" /></Field>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Field label="가로 (m)"><NumInput value={input.width} onChange={(v) => patch({ width: v })} /></Field>
          <Field label="세로 (m)"><NumInput value={input.length} onChange={(v) => patch({ length: v })} /></Field>
        </div>
      )}
      <Field label="마루 종류" hint="강마루 1박스 = 1평이 한국 시장 표준 (구정·동화). 종류 선택 시 박스당 평수 자동 채움">
        <select
          value={input.type}
          onChange={(e) => changeFloorType(e.target.value)}
          className="w-full px-2.5 py-1.5 border rounded text-sm"
        >
          <option value="laminate">강화마루 (0.5평/박스)</option>
          <option value="engineered">강마루 (1.0평/박스) ★</option>
          <option value="hardwood">원목마루 (0.5평/박스)</option>
          <option value="herringbone">헤링본 (0.5평/박스)</option>
        </select>
      </Field>
      <Field label="박스당 평수" hint="자재상 카탈로그가 다르면 직접 수정">
        <NumInput value={input.perBox} onChange={(v) => patch({ perBox: v })} className="w-full" />
      </Field>
      <Field label="실 둘레 (m)" hint="걸레받이 표시용 (옵션)">
        <NumInput value={input.perimeter} onChange={(v) => patch({ perimeter: v })} className="w-full" />
      </Field>
      <Field label="로스율 (%)">
        <NumInput value={input.loss} onChange={(v) => patch({ loss: v })} step="1" className="w-full" />
        <Presets
          values={[
            { value: 5, label: '직선 5%' },
            { value: 8, label: '일반 8%' },
            { value: 10, label: '헤링본 10%' },
            { value: 15, label: '복잡 15%' },
          ]}
          current={input.loss}
          onPick={(v) => patch({ loss: v })}
        />
      </Field>
    </>
  );
}

// ─── 페인트 ───
function PaintInputs({ input, patch }) {
  return (
    <>
      <Field label="산출 방식">
        <Seg
          value={input.mode}
          onChange={(v) => patch({ mode: v })}
          options={[
            { value: 'simple', label: '간편 (6㎡/L)' },
            { value: 'detail', label: '상세 (종류별)' },
          ]}
        />
      </Field>
      <Field label="페인트 종류">
        <select
          value={input.type}
          onChange={(e) => patch({ type: e.target.value })}
          className="w-full px-2.5 py-1.5 border rounded text-sm"
        >
          <option value="water">수성 (6 ㎡/L)</option>
          <option value="eco">친환경 (6 ㎡/L)</option>
          <option value="oil">유성 (8 ㎡/L)</option>
          <option value="primer">퍼티/프라이머 (5 ㎡/L)</option>
        </select>
      </Field>
      <Field label="시공 부위">
        <Seg
          value={input.target}
          onChange={(v) => patch({ target: v })}
          options={[
            { value: 'wall', label: '벽' },
            { value: 'ceiling', label: '천장' },
            { value: 'direct', label: '직접 면적' },
          ]}
        />
      </Field>
      {input.target === 'direct' ? (
        <Field label="직접 시공 면적 (㎡)"><NumInput value={input.directArea} onChange={(v) => patch({ directArea: v })} className="w-full" /></Field>
      ) : (
        <Field label={input.target === 'wall' ? '실 평수 (벽 도장)' : '실 평수 (천장 도장)'}>
          <NumInput value={input.pyeong} onChange={(v) => patch({ pyeong: v })} className="w-full" />
        </Field>
      )}
      {input.target === 'wall' && (
        <Field label="천장 높이 (m)" hint="벽 도장 면적 = 평 × 1.65 × (천장/2.4) × 3.3058">
          <NumInput value={input.ceilingH} onChange={(v) => patch({ ceilingH: v })} className="w-full" />
        </Field>
      )}
      <Field label="도장 횟수">
        <Seg
          value={String(input.coats)}
          onChange={(v) => patch({ coats: Number(v) })}
          options={[
            { value: '1', label: '1회' },
            { value: '2', label: '2회' },
            { value: '3', label: '3회' },
          ]}
        />
      </Field>
      <Field label="로스율 (%)" hint="붓·롤러 10% / 스프레이 30% (노루 공식)">
        <NumInput value={input.loss} onChange={(v) => patch({ loss: v })} step="1" className="w-full" />
        <Presets
          values={[
            { value: 10, label: '붓·롤러 10%' },
            { value: 15, label: '거친면 15%' },
            { value: 20, label: '흡수면 20%' },
            { value: 30, label: '스프레이 30%' },
          ]}
          current={input.loss}
          onPick={(v) => patch({ loss: v })}
        />
      </Field>
    </>
  );
}
