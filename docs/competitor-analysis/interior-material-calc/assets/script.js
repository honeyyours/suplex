const KAKAO_COMMUNITY_CHAT_URL = "https://open.kakao.com/o/g9bD08ui";
const KAKAO_UPDATE_REQUEST_URL = "https://open.kakao.com/o/s4L065ui";
const APP_TRACKING_VERSION = "material-calculator-v10";
const TRACKING_ENDPOINT = "/api/track";
const OPENCHAT_POPUP_STORAGE_KEY = `interiorCalculatorOpenchatPopupSeen:${APP_TRACKING_VERSION}`;

const materials = {
  tile: {
    title: "타일",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 욕실·주방 등 절단이 많은 부위는 로스율 15% 이상 권장. 동일 LOT 확보를 위해 박스 단위 발주가 안전합니다.",
  },
  wallpaper: {
    title: "도배",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 벽 면적은 실평수와 천장 높이 기준 표준 환산식을 적용합니다. 큰 무늬 벽지는 로스율 20% 이상 권장.",
  },
  floor: {
    title: "마루",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 마루는 동일 LOT 확보를 위해 박스 단위 발주가 필수. 헤링본·사선 시공은 로스율 10% 이상 권장하세요.",
  },
  paint: {
    title: "페인트",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 1말통은 18L 기준입니다. 거친면, 진한 색상 변경, 흡수율 높은 바탕면은 로스율을 15~20%로 올려 잡으세요.",
  },
  lighting: {
    title: "조명",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 메인등과 다운라이트를 함께 쓰면 다운라이트 수량은 계산값의 50~70% 수준으로 조정하는 경우가 많습니다.",
  },
  aircon: {
    title: "에어컨",
    defaultAreaMode: "pyeong",
    note: "현장 메모 · 냉방 능력은 단열, 창호, 층수, 서향 여부에 따라 크게 달라집니다. 탑층이나 오픈형 거실은 한 단계 위 평형을 검토하세요.",
  },
  furniture: {
    title: "제작가구",
    defaultAreaMode: "length",
    note: "현장 메모 · 제작가구는 업체별 산출 기준 차이가 큽니다. 이 계산은 1차 물량 정리용이며, 최종 제작 전 실측·도면·철물 사양 확인이 필요합니다.",
  },
};

const tileSpecs = {
  "300x300": { width: 300, height: 300 },
  "300x600": { width: 300, height: 600 },
  "600x600": { width: 600, height: 600 },
  "600x1200": { width: 600, height: 1200 },
  "800x800": { width: 800, height: 800 },
};

const wallpaperSpecs = {
  silk: { label: "실크벽지 (폭 106cm × 길이 15.6m)", width: 1.06, length: 15.6 },
  paper: { label: "합지벽지 (폭 93cm × 길이 17.75m)", width: 0.93, length: 17.75 },
  point: { label: "포인트벽지 (폭 106cm × 길이 10m)", width: 1.06, length: 10 },
};

const floorSpecs = {
  direct: { label: "직접 입력", boxPyeong: 0.7 },
  laminate: { label: "강마루 일반 (박스 0.7평)", boxPyeong: 0.7 },
  wood: { label: "원목마루 (박스 0.5평)", boxPyeong: 0.5 },
  herringbone: { label: "헤링본 마루 (박스 0.45평)", boxPyeong: 0.45 },
};

const paintSpecs = {
  water: { label: "수성 페인트 (1L당 10㎡, 1회)", coverage: 10 },
  oil: { label: "유성 페인트 (1L당 8㎡, 1회)", coverage: 8 },
  eco: { label: "친환경 페인트 (1L당 8㎡, 1회)", coverage: 8 },
  primer: { label: "퍼티/프라이머 (1L당 5㎡, 1회)", coverage: 5 },
};

const lightingSpecs = {
  living: { label: "거실", lux: 220 },
  bedroom: { label: "침실", lux: 130 },
  kitchen: { label: "주방", lux: 400 },
  bath: { label: "욕실", lux: 160 },
  study: { label: "공부방·홈오피스", lux: 450 },
  office: { label: "사무실", lux: 750 },
  shop: { label: "카페·상가", lux: 400 },
  hallway: { label: "복도·현관", lux: 120 },
};

const airconBusinessSpecs = {
  office: { label: "사무실", kcalPerPyeong: 450 },
  shop: { label: "카페·상가", kcalPerPyeong: 520 },
  restaurant: { label: "음식점", kcalPerPyeong: 620 },
};

const sunlightFactors = {
  north: { label: "북향·그늘", factor: 0.95 },
  east: { label: "동향·일반", factor: 1 },
  south: { label: "남향·햇빛 보통", factor: 1.08 },
  west: { label: "서향·햇빛 많음", factor: 1.15 },
};

const furnitureSpecs = {
  kitchen: { label: "싱크대", defaultHeight: 850, defaultDepth: 600, doorWidth: 450, hasCountertop: true },
  wardrobe: { label: "붙박이장", defaultHeight: 2200, defaultDepth: 600, doorWidth: 500, hasCountertop: false },
  shoe: { label: "신발장", defaultHeight: 2100, defaultDepth: 350, doorWidth: 450, hasCountertop: false },
  storage: { label: "수납장", defaultHeight: 900, defaultDepth: 450, doorWidth: 450, hasCountertop: true },
  tv: { label: "TV장", defaultHeight: 500, defaultDepth: 400, doorWidth: 500, hasCountertop: true },
};

const state = {
  material: "tile",
  areaMode: "pyeong",
  jobName: "",
  spaceName: "",
};

const refs = {
  tabs: [...document.querySelectorAll(".tab")],
  fields: document.querySelector("#dynamic-fields"),
  form: document.querySelector("#calculator-form"),
  primaryLabel: document.querySelector("#primary-label"),
  primaryValue: document.querySelector("#primary-value"),
  primaryUnit: document.querySelector("#primary-unit"),
  primaryDetail: document.querySelector("#primary-detail"),
  metrics: document.querySelector("#metric-grid"),
  metricTemplate: document.querySelector("#metric-template"),
  note: document.querySelector("#field-note"),
  basisList: document.querySelector("#basis-list"),
  copyButton: document.querySelector("#copy-button"),
  openchatModal: document.querySelector("#openchat-modal"),
  openchatClose: document.querySelector("#openchat-close"),
  openchatPopupLink: document.querySelector("#openchat-popup-link"),
  chatWidget: document.querySelector("#chat-widget"),
  chatToggle: document.querySelector("#chat-toggle"),
  communityLink: document.querySelector("#community-link"),
  feedbackLink: document.querySelector("#feedback-link"),
};

const nf = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

const pyeongToSquareMeters = (pyeong) => pyeong * 3.3058;
const squareMetersToPyeong = (meters) => meters / 3.3058;
const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const ceil = (value) => Math.ceil(Math.max(0, value));
const fixed = (value, digits = 2) => nf.format(Number(value.toFixed(digits)));

function getCampaignParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
  };
}

function trackInternalEvent(eventName, extra = {}) {
  const payload = {
    event_name: eventName,
    version: APP_TRACKING_VERSION,
    path: window.location.pathname,
    referrer: document.referrer,
    ...getCampaignParams(),
    ...extra,
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(TRACKING_ENDPOINT, blob);
    return;
  }

  fetch(TRACKING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function input(name, label, value, attrs = {}) {
  const step = attrs.step ?? "0.01";
  const min = attrs.min ?? "0";
  const hint = attrs.hint ? `<span class="hint">${attrs.hint}</span>` : "";
  return `
    <div class="field-group">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="number" min="${min}" step="${step}" value="${value}" />
      ${hint}
    </div>
  `;
}

function textInput(name, label, value, attrs = {}) {
  const hint = attrs.hint ? `<span class="hint">${attrs.hint}</span>` : "";
  const placeholder = attrs.placeholder ? `placeholder="${attrs.placeholder}"` : "";
  return `
    <div class="field-group">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="text" value="${escapeAttr(value)}" ${placeholder} />
      ${hint}
    </div>
  `;
}

function select(name, label, options, selected, hint = "") {
  const optionMarkup = options
    .map((option) => {
      const isSelected = option.value === selected ? "selected" : "";
      return `<option value="${option.value}" ${isSelected}>${option.label}</option>`;
    })
    .join("");
  const hintMarkup = hint ? `<span class="hint">${hint}</span>` : "";
  return `
    <div class="field-group">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}">${optionMarkup}</select>
      ${hintMarkup}
    </div>
  `;
}

function presetButtons(target, options) {
  return `
    <div class="preset-row" aria-label="빠른 선택">
      ${options
        .map(
          (option) => `
            <button type="button" data-set-input="${target}" data-set-value="${option.value}">
              ${option.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function segmented(name, label, options, selected) {
  return `
    <div class="field-group">
      <span class="group-title">${label}</span>
      <div class="segmented" data-segmented="${name}">
        ${options
          .map(
            (option) => `
              <button class="${option.value === selected ? "is-active" : ""}" type="button" data-name="${name}" data-value="${option.value}">
                ${option.label}
              </button>
            `,
          )
          .join("")}
      </div>
      <input type="hidden" name="${name}" value="${selected}" />
    </div>
  `;
}

function conditional(when, values, markup) {
  return `
    <div class="conditional-fields" data-visible-when="${when}" data-visible-value="${values}">
      ${markup}
    </div>
  `;
}

function renderFields() {
  saveCommonFields();
  const renderers = {
    tile: renderTileFields,
    wallpaper: renderWallpaperFields,
    floor: renderFloorFields,
    paint: renderPaintFields,
    lighting: renderLightingFields,
    aircon: renderAirconFields,
    furniture: renderFurnitureFields,
  };

  refs.fields.innerHTML = `
    ${renderCommonFields()}
    ${renderers[state.material]()}
  `;

  toggleConditionalFields();
  syncDependentFields();
  calculate();
}

function renderCommonFields() {
  return `
    <div class="field-stack common-fields">
      <div class="field-row">
        ${textInput("jobName", "현장명", state.jobName, {
          placeholder: "예: 김포 장기동 32평",
        })}
        ${textInput("spaceName", "공간명", state.spaceName, {
          placeholder: "예: 거실 / 욕실 / 방1",
        })}
      </div>
    </div>
  `;
}

function renderTileFields() {
  state.areaMode = materials.tile.defaultAreaMode;
  return `
    <div class="field-stack">
      ${segmented("installPlace", "시공 부위", [
        { value: "floor", label: "바닥" },
        { value: "wall", label: "벽" },
      ], "floor")}
      ${areaFields("시공 평수", "10")}
      ${select("tileSpec", "타일 규격 (mm)", [
        ...Object.entries(tileSpecs).map(([value, spec]) => ({
          value,
          label: `${spec.width} × ${spec.height}`,
        })),
        { value: "custom", label: "직접 입력" },
      ], "600x600")}
      <div class="field-row custom-fields" data-custom-for="tileSpec">
        ${input("tileWidth", "가로 (mm)", "600", { step: "1" })}
        ${input("tileHeight", "세로 (mm)", "600", { step: "1" })}
      </div>
      ${input("tilesPerBox", "박스당 매수", "4", {
        step: "1",
        hint: "자재상 카탈로그 기준. 모르면 4 입력",
      })}
      ${input("lossRate", "로스율 (%)", "10", {
        step: "1",
        hint: "권장: 바닥 10% · 욕실벽 15% · 대형타일 12%",
      })}
      ${presetButtons("lossRate", [
        { value: "7", label: "일반 7%" },
        { value: "10", label: "권장 10%" },
        { value: "15", label: "절단 15%" },
        { value: "20", label: "복잡 20%" },
      ])}
    </div>
  `;
}

function renderWallpaperFields() {
  state.areaMode = materials.wallpaper.defaultAreaMode;
  return `
    <div class="field-stack">
      ${select("wallpaperSpec", "벽지 종류", Object.entries(wallpaperSpecs).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "silk")}
      ${areaFields("시공 평수", "24")}
      ${input("ceilingHeight", "천장 높이 (m)", "2.4", {
        hint: "평수 입력 시 벽 면적 환산에 사용",
      })}
      <label class="checkbox-row">
        <input name="includeCeiling" type="checkbox" />
        <span>천장 도배 포함</span>
      </label>
      ${input("lossRate", "로스율 (%)", "10", {
        step: "1",
        hint: "권장: 실크 10% · 합지 15% · 무늬 매칭 시 20%",
      })}
      ${presetButtons("lossRate", [
        { value: "0", label: "기본 0%" },
        { value: "10", label: "실크 10%" },
        { value: "15", label: "합지 15%" },
        { value: "20", label: "무늬 20%" },
      ])}
    </div>
  `;
}

function renderFloorFields() {
  state.areaMode = materials.floor.defaultAreaMode;
  return `
    <div class="field-stack">
      ${select("floorSpec", "마루 종류", Object.entries(floorSpecs).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "direct")}
      ${input("boxPyeong", "박스당 면적 (평)", "0.7")}
      ${areaFields("시공 평수", "20")}
      ${input("perimeter", "실 둘레 (m)", "20", {
        hint: "걸레받이 계산용",
      })}
      ${input("lossRate", "로스율 (%)", "7", {
        step: "1",
        hint: "권장: 직선시공 5% · 일반 7~8% · 헤링본 10%",
      })}
      ${presetButtons("lossRate", [
        { value: "5", label: "직선 5%" },
        { value: "8", label: "일반 8%" },
        { value: "10", label: "헤링본 10%" },
        { value: "15", label: "복잡 15%" },
      ])}
    </div>
  `;
}

function renderPaintFields() {
  state.areaMode = materials.paint.defaultAreaMode;
  return `
    <div class="field-stack">
      ${select("paintSpec", "페인트 종류", Object.entries(paintSpecs).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "water")}
      ${segmented("paintTarget", "시공 부위", [
        { value: "wall", label: "벽" },
        { value: "ceiling", label: "천장" },
        { value: "direct", label: "직접 면적" },
      ], "wall")}
      ${conditional("paintTarget", "wall|ceiling", areaFields("실 평수", "24"))}
      ${conditional("paintTarget", "direct", input("directArea", "직접 시공 면적 (㎡)", "30"))}
      ${input("ceilingHeight", "천장 높이 (m)", "2.4", {
        hint: "벽면 계산 시 둘레 또는 실평수 환산에 사용",
      })}
      ${segmented("coatCount", "도장 횟수", [
        { value: "1", label: "1회" },
        { value: "2", label: "2회" },
        { value: "3", label: "3회" },
      ], "2")}
      ${input("lossRate", "로스율 (%)", "10", {
        step: "1",
        hint: "권장: 평탄면 10% · 거친면 15~20%",
      })}
      ${presetButtons("lossRate", [
        { value: "10", label: "평탄 10%" },
        { value: "15", label: "거친면 15%" },
        { value: "20", label: "흡수면 20%" },
      ])}
    </div>
  `;
}

function renderLightingFields() {
  state.areaMode = materials.lighting.defaultAreaMode;
  return `
    <div class="field-stack">
      ${select("lightingSpace", "공간 종류", Object.entries(lightingSpecs).map(([value, spec]) => ({
        value,
        label: `${spec.label} (${spec.lux} lux 기준)`,
      })), "living", "KS 권장 조도 범위를 실무용 중간값으로 계산")}
      ${areaFields("시공 평수", "10")}
      ${input("ceilingHeight", "천장 높이 (m)", "2.4", {
        hint: "2.4m 초과 시 광량을 보정",
      })}
      ${segmented("lightingPlan", "시공 방식", [
        { value: "downlight", label: "다운라이트 중심" },
        { value: "mixed", label: "메인등 병행" },
      ], "downlight")}
    </div>
  `;
}

function renderAirconFields() {
  state.areaMode = materials.aircon.defaultAreaMode;
  return `
    <div class="field-stack">
      ${segmented("airconUse", "사용 목적", [
        { value: "home", label: "가정용" },
        { value: "commercial", label: "상업용" },
      ], "home")}
      ${conditional("airconUse", "commercial", select("businessType", "상업 공간 종류", Object.entries(airconBusinessSpecs).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "office"))}
      ${segmented("airconType", "에어컨 종류", [
        { value: "stand", label: "스탠드" },
        { value: "system", label: "시스템" },
      ], "stand")}
      ${input("areaPyeong", "냉방 면적 (평)", "18", {
        hint: "에어컨이 직접 냉방할 공간만 입력",
      })}
      ${select("sunlight", "햇빛 노출", Object.entries(sunlightFactors).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "east")}
      ${input("ceilingHeight", "천장 높이 (m)", "2.4")}
      <label class="checkbox-row">
        <input name="openPlan" type="checkbox" />
        <span>거실 + 주방 오픈형</span>
      </label>
      <label class="checkbox-row">
        <input name="topFloor" type="checkbox" />
        <span>탑층 또는 단열 취약</span>
      </label>
    </div>
  `;
}

function renderFurnitureFields() {
  return `
    <div class="field-stack">
      ${select("furnitureSpec", "가구 종류", Object.entries(furnitureSpecs).map(([value, spec]) => ({
        value,
        label: spec.label,
      })), "kitchen")}
      ${input("baseLength", "하부/본체 길이 (m)", "3.2", {
        hint: "싱크대 하부장, 붙박이장 전체 폭 등",
      })}
      ${input("upperLength", "상부장 길이 (m)", "2.4", {
        hint: "상부장이 없으면 0 입력",
      })}
      <div class="field-row">
        ${input("cabinetHeight", "높이 (mm)", "850", { step: "10" })}
        ${input("cabinetDepth", "깊이 (mm)", "600", { step: "10" })}
      </div>
      ${input("doorWidth", "도어 기준 폭 (mm)", "450", {
        step: "10",
        hint: "대략 도어 수 산출용. 여닫이/슬라이딩은 현장 기준 조정",
      })}
      <label class="checkbox-row">
        <input name="includeCountertop" type="checkbox" checked />
        <span>상판 산출 포함</span>
      </label>
      ${input("lossRate", "여유율 (%)", "5", {
        step: "1",
        hint: "코너·마감판·필러가 있으면 5~10% 권장",
      })}
      ${presetButtons("lossRate", [
        { value: "0", label: "정미 0%" },
        { value: "5", label: "일반 5%" },
        { value: "10", label: "코너 10%" },
      ])}
    </div>
  `;
}

function areaFields(label, defaultPyeong) {
  return `
    ${segmented("areaMode", "면적 입력 방식", [
      { value: "pyeong", label: "평수" },
      { value: "dimension", label: "가로 × 세로" },
    ], state.areaMode)}
    <div class="dimension-fields is-visible" data-area-fields="pyeong">
      ${input("areaPyeong", label, defaultPyeong, {
        hint: "1평 = 3.3058㎡",
      })}
    </div>
    <div class="field-row dimension-fields" data-area-fields="dimension">
      ${input("width", "가로 (m)", "5")}
      ${input("length", "세로 (m)", "4")}
    </div>
  `;
}

function toggleConditionalFields() {
  const formData = new FormData(refs.form);
  const areaMode = formData.get("areaMode") || "pyeong";
  state.areaMode = areaMode;

  document.querySelectorAll("[data-area-fields]").forEach((field) => {
    field.classList.toggle("is-visible", field.dataset.areaFields === areaMode);
  });

  document.querySelectorAll("[data-custom-for]").forEach((field) => {
    const owner = field.dataset.customFor;
    field.classList.toggle("is-visible", formData.get(owner) === "custom");
  });

  document.querySelectorAll("[data-visible-when]").forEach((field) => {
    const owner = field.dataset.visibleWhen;
    const values = field.dataset.visibleValue.split("|");
    field.classList.toggle("is-visible", values.includes(formData.get(owner)));
  });
}

function getArea(formData) {
  const areaMode = formData.get("areaMode") || "pyeong";
  if (areaMode === "dimension") {
    const meters = toNumber(formData.get("width")) * toNumber(formData.get("length"));
    return {
      squareMeters: meters,
      pyeong: squareMetersToPyeong(meters),
    };
  }

  const pyeong = toNumber(formData.get("areaPyeong"));
  return {
    squareMeters: pyeongToSquareMeters(pyeong),
    pyeong,
  };
}

function calculate() {
  const formData = new FormData(refs.form);
  const calculators = {
    tile: calculateTile,
    wallpaper: calculateWallpaper,
    floor: calculateFloor,
    paint: calculatePaint,
    lighting: calculateLighting,
    aircon: calculateAircon,
    furniture: calculateFurniture,
  };
  const result = calculators[state.material](formData);

  renderResult(result);
}

function calculateTile(formData) {
  const area = getArea(formData);
  const selectedSpec = formData.get("tileSpec");
  const spec = selectedSpec === "custom"
    ? {
        width: toNumber(formData.get("tileWidth"), 600),
        height: toNumber(formData.get("tileHeight"), 600),
      }
    : tileSpecs[selectedSpec];
  const tileArea = (spec.width / 1000) * (spec.height / 1000);
  const pureTiles = ceil(area.squareMeters / tileArea);
  const lossRate = toNumber(formData.get("lossRate"));
  const orderTiles = ceil(pureTiles * (1 + lossRate / 100));
  const tilesPerBox = Math.max(1, toNumber(formData.get("tilesPerBox"), 1));
  const boxCount = ceil(orderTiles / tilesPerBox);

  return {
    primaryLabel: "발주 권장 매수",
    primaryValue: nf.format(orderTiles),
    primaryUnit: "매",
    primaryDetail: `순수 ${nf.format(pureTiles)}매 + 로스 ${fixed(lossRate, 0)}%`,
    metrics: [
      ["시공 면적", `${fixed(area.squareMeters)}㎡`],
      ["시공 평수", `${fixed(area.pyeong)}평`],
      ["순수 필요 매수", `${nf.format(pureTiles)}매`],
      ["박스 수", `${nf.format(boxCount)}박스`],
    ],
    note: materials.tile.note,
    basis: [
      "박스 단위 발주",
      "절단 많은 구간 로스 상향",
      "동일 LOT 확보 확인",
    ],
    copyText: `타일 발주 권장 매수: ${nf.format(orderTiles)}매 / 박스 수: ${nf.format(boxCount)}박스 / 시공 면적: ${fixed(area.squareMeters)}㎡`,
  };
}

function calculateWallpaper(formData) {
  const area = getArea(formData);
  const spec = wallpaperSpecs[formData.get("wallpaperSpec")] || wallpaperSpecs.silk;
  const ceilingHeight = toNumber(formData.get("ceilingHeight"), 2.4);
  const includeCeiling = formData.get("includeCeiling") === "on";
  const lossRate = toNumber(formData.get("lossRate"));
  const wallArea = state.areaMode === "dimension"
    ? 2 * (toNumber(formData.get("width")) + toNumber(formData.get("length"))) * ceilingHeight
    : area.pyeong * ceilingHeight * 1.2625;
  const totalArea = wallArea + (includeCeiling ? area.squareMeters : 0);
  const rollArea = spec.width * spec.length;
  const pureRolls = totalArea / rollArea;
  const orderRolls = ceil(pureRolls * (1 + lossRate / 100));
  const pasteKg = ceil(orderRolls);

  return {
    primaryLabel: "발주 권장 롤 수",
    primaryValue: nf.format(orderRolls),
    primaryUnit: "롤",
    primaryDetail: `순수 ${fixed(pureRolls, 1)}롤 + 로스 ${fixed(lossRate, 0)}%`,
    metrics: [
      ["벽 면적", `${fixed(wallArea, 1)}㎡`],
      ["총 도배 면적", `${fixed(totalArea, 1)}㎡`],
      ["롤당 시공량", `${fixed(rollArea, 1)}㎡`],
      ["예상 풀", `${nf.format(pasteKg)}kg`],
    ],
    note: materials.wallpaper.note,
    basis: [
      "실내공기질 방출확인 표지 확인",
      "천장 포함 여부 확인",
      "무늬 매칭 시 로스 상향",
    ],
    copyText: `도배 발주 권장 롤 수: ${nf.format(orderRolls)}롤 / 총 도배 면적: ${fixed(totalArea, 1)}㎡ / 예상 풀: ${nf.format(pasteKg)}kg`,
  };
}

function calculateFloor(formData) {
  const area = getArea(formData);
  const floorSpec = formData.get("floorSpec");
  const selectedBoxPyeong = floorSpecs[floorSpec]?.boxPyeong || 0.7;
  const boxPyeong = Math.max(0.01, floorSpec === "direct"
    ? toNumber(formData.get("boxPyeong"), 0.7)
    : selectedBoxPyeong);
  const lossRate = toNumber(formData.get("lossRate"));
  const pureBoxes = area.pyeong / boxPyeong;
  const orderPyeong = area.pyeong * (1 + lossRate / 100);
  const orderBoxes = ceil(pureBoxes * (1 + lossRate / 100));
  const perimeter = toNumber(formData.get("perimeter"));

  return {
    primaryLabel: "발주 권장 박스 수",
    primaryValue: nf.format(orderBoxes),
    primaryUnit: "박스",
    primaryDetail: `순수 ${fixed(pureBoxes, 1)}박스 + 로스 ${fixed(lossRate, 0)}%`,
    metrics: [
      ["시공 면적", `${fixed(area.squareMeters)}㎡`],
      ["시공 평수", `${fixed(area.pyeong)}평`],
      ["발주 평수", `${fixed(orderPyeong, 1)}평`],
      ["걸레받이", `${fixed(perimeter, 1)}m`],
    ],
    note: materials.floor.note,
    basis: [
      "실내공기질 방출확인 표지 확인",
      "박스당 시공 평수 확인",
      "걸레받이는 현장 둘레 기준",
    ],
    copyText: `마루 발주 권장 박스 수: ${nf.format(orderBoxes)}박스 / 발주 평수: ${fixed(orderPyeong, 1)}평 / 걸레받이: ${fixed(perimeter, 1)}m`,
  };
}

function calculatePaint(formData) {
  const area = getArea(formData);
  const spec = paintSpecs[formData.get("paintSpec")] || paintSpecs.water;
  const target = formData.get("paintTarget") || "wall";
  const ceilingHeight = toNumber(formData.get("ceilingHeight"), 2.4);
  const coatCount = Math.max(1, toNumber(formData.get("coatCount"), 2));
  const lossRate = toNumber(formData.get("lossRate"));
  let paintArea;

  if (target === "direct") {
    paintArea = toNumber(formData.get("directArea"), 0);
  } else if (target === "ceiling") {
    paintArea = area.squareMeters;
  } else if (state.areaMode === "dimension") {
    paintArea = 2 * (toNumber(formData.get("width")) + toNumber(formData.get("length"))) * ceilingHeight;
  } else {
    paintArea = pyeongToSquareMeters(area.pyeong * 1.65);
  }

  const coatedArea = paintArea * coatCount;
  const pureLiters = coatedArea / spec.coverage;
  const orderLiters = pureLiters * (1 + lossRate / 100);
  const buckets18 = ceil(orderLiters / 18);
  const cans4 = ceil(orderLiters / 4);

  return {
    primaryLabel: "발주 권장 말통",
    primaryValue: nf.format(buckets18),
    primaryUnit: "통",
    primaryDetail: `18L 기준 · 필요 ${fixed(orderLiters, 1)}L`,
    metrics: [
      ["시공 면적", `${fixed(paintArea, 1)}㎡`],
      ["도장 면적", `${fixed(coatedArea, 1)}㎡`],
      ["순수 필요량", `${fixed(pureLiters, 1)}L`],
      ["4L 캔 기준", `${nf.format(cans4)}캔`],
    ],
    note: materials.paint.note,
    basis: [
      "실내공기질 방출확인 표지 확인",
      "2회 도장 기준 확인",
      "도장 후 환기 계획",
    ],
    copyText: `페인트 발주 권장: 18L ${nf.format(buckets18)}통 / 필요량: ${fixed(orderLiters, 1)}L / 시공 면적: ${fixed(paintArea, 1)}㎡`,
  };
}

function calculateLighting(formData) {
  const area = getArea(formData);
  const spec = lightingSpecs[formData.get("lightingSpace")] || lightingSpecs.living;
  const ceilingHeight = toNumber(formData.get("ceilingHeight"), 2.4);
  const heightFactor = 1 + Math.max(0, ceilingHeight - 2.4) * 0.22;
  const totalLumens = area.squareMeters * spec.lux * heightFactor;
  const totalWatts = totalLumens / 90;
  const plan = formData.get("lightingPlan") || "downlight";
  const downlightFactor = plan === "mixed" ? 0.65 : 1;
  const downlightWatts = totalWatts * downlightFactor;
  const lights7w = ceil(downlightWatts / 7);
  const lights10w = ceil(downlightWatts / 10);

  return {
    primaryLabel: "권장 총 와트수",
    primaryValue: nf.format(ceil(totalWatts)),
    primaryUnit: "W",
    primaryDetail: `${nf.format(spec.lux)} lux 기준 · LED 90 lm/W`,
    metrics: [
      ["권장 조도", `${nf.format(spec.lux)} lux`],
      ["시공 면적", `${fixed(area.squareMeters)}㎡`],
      ["LED 7W", `${nf.format(lights7w)}개`],
      ["LED 10W", `${nf.format(lights10w)}개`],
    ],
    note: materials.lighting.note,
    basis: [
      "작업면 기준 조도",
      "눈부심 생기면 위치 조정",
      "전등 노후·먼지 관리",
    ],
    copyText: `조명 권장 총 와트수: ${nf.format(ceil(totalWatts))}W / LED 7W: ${nf.format(lights7w)}개 / LED 10W: ${nf.format(lights10w)}개`,
  };
}

function calculateAircon(formData) {
  const pyeong = toNumber(formData.get("areaPyeong"), 0);
  const use = formData.get("airconUse") || "home";
  const business = airconBusinessSpecs[formData.get("businessType")] || airconBusinessSpecs.office;
  const baseKcal = use === "commercial" ? business.kcalPerPyeong : 400;
  const sunlight = sunlightFactors[formData.get("sunlight")] || sunlightFactors.east;
  const ceilingHeight = toNumber(formData.get("ceilingHeight"), 2.4);
  const heightFactor = 1 + Math.max(0, ceilingHeight - 2.4) * 0.16;
  const openFactor = formData.get("openPlan") === "on" ? 1.1 : 1;
  const topFloorFactor = formData.get("topFloor") === "on" ? 1.12 : 1;
  const capacity = pyeong * baseKcal * sunlight.factor * heightFactor * openFactor * topFloorFactor;
  const capacityKw = capacity / 860;
  const marketPyeong = ceil(capacity / 400);
  const airconType = formData.get("airconType") || "stand";
  const indoorUnits = airconType === "system"
    ? ceil(pyeong / (use === "commercial" ? 6 : 8))
    : Math.max(1, 1 + ceil(Math.max(0, pyeong - 18) / 6));
  const wallUnits = airconType === "stand" ? Math.max(0, indoorUnits - 1) : 0;

  return {
    primaryLabel: "권장 냉방 평형",
    primaryValue: nf.format(marketPyeong),
    primaryUnit: "평형",
    primaryDetail: `실내기 ${nf.format(indoorUnits)}대 · ${fixed(capacityKw, 1)}kW급`,
    metrics: [
      ["실내기 수", `${nf.format(indoorUnits)}대`],
      ["냉방 능력", `${fixed(capacityKw, 1)}kW`],
      ["냉방 면적", `${fixed(pyeong, 1)}평`],
      ["보조 벽걸이", `${nf.format(wallUnits)}대`],
    ],
    note: materials.aircon.note,
    basis: [
      "실외기 통풍 공간 확보",
      "필터 주기 세척",
      "권장 운전 26℃ 참고",
    ],
    copyText: `에어컨 권장 평형: ${nf.format(marketPyeong)}평형 / 실내기: ${nf.format(indoorUnits)}대 / 냉방 능력: ${fixed(capacityKw, 1)}kW`,
  };
}

function calculateFurniture(formData) {
  const spec = furnitureSpecs[formData.get("furnitureSpec")] || furnitureSpecs.kitchen;
  const baseLength = toNumber(formData.get("baseLength"), 0);
  const upperLength = toNumber(formData.get("upperLength"), 0);
  const cabinetHeight = Math.max(1, toNumber(formData.get("cabinetHeight"), spec.defaultHeight));
  const cabinetDepth = Math.max(1, toNumber(formData.get("cabinetDepth"), spec.defaultDepth));
  const doorWidth = Math.max(1, toNumber(formData.get("doorWidth"), spec.doorWidth));
  const includeCountertop = formData.get("includeCountertop") === "on";
  const lossRate = toNumber(formData.get("lossRate"), 0);
  const totalLength = baseLength + upperLength;
  const orderLength = totalLength * (1 + lossRate / 100);
  const baseDoors = ceil((baseLength * 1000) / doorWidth);
  const upperDoors = upperLength > 0 ? ceil((upperLength * 1000) / doorWidth) : 0;
  const panelArea = orderLength * (cabinetHeight / 1000);
  const countertopLength = includeCountertop ? baseLength * (1 + lossRate / 100) : 0;
  const sidePanelDepth = cabinetDepth / 1000;

  return {
    primaryLabel: "산출 기준 길이",
    primaryValue: fixed(orderLength, 1),
    primaryUnit: "m",
    primaryDetail: `${spec.label} · 본체 ${fixed(baseLength, 1)}m + 상부 ${fixed(upperLength, 1)}m`,
    metrics: [
      ["예상 도어", `${nf.format(baseDoors + upperDoors)}개`],
      ["상판 길이", includeCountertop ? `${fixed(countertopLength, 1)}m` : "제외"],
      ["면재 참고", `${fixed(panelArea, 1)}㎡`],
      ["깊이 기준", `${fixed(sidePanelDepth, 2)}m`],
    ],
    note: materials.furniture.note,
    basis: [
      "최종 제작 전 실측 필수",
      "코너장·마감판 별도 확인",
      "상판 이음·타공 위치 확인",
    ],
    copyText: `제작가구 산출 기준 길이: ${fixed(orderLength, 1)}m / 예상 도어: ${nf.format(baseDoors + upperDoors)}개 / 상판 길이: ${includeCountertop ? `${fixed(countertopLength, 1)}m` : "제외"}`,
  };
}

function renderResult(result) {
  saveCommonFields();
  refs.primaryLabel.textContent = result.primaryLabel;
  refs.primaryValue.textContent = result.primaryValue;
  refs.primaryUnit.textContent = result.primaryUnit;
  refs.primaryDetail.textContent = result.primaryDetail;
  refs.note.textContent = result.note;
  refs.basisList.innerHTML = "";
  refs.copyButton.dataset.copyText = buildCopyText(result);
  refs.metrics.innerHTML = "";

  (result.basis || []).forEach((basis) => {
    const item = document.createElement("li");
    item.textContent = basis;
    refs.basisList.append(item);
  });

  result.metrics.forEach(([name, value]) => {
    const item = refs.metricTemplate.content.cloneNode(true);
    item.querySelector(".metric-name").textContent = name;
    item.querySelector(".metric-value").textContent = value;
    refs.metrics.append(item);
  });
}

function saveCommonFields() {
  if (!refs.form?.elements) return;
  const jobName = refs.form.elements.jobName;
  const spaceName = refs.form.elements.spaceName;
  if (jobName) state.jobName = jobName.value.trim();
  if (spaceName) state.spaceName = spaceName.value.trim();
}

function buildCopyText(result) {
  const lines = [`[${materials[state.material].title} 계산]`];
  if (state.jobName) lines.push(`현장: ${state.jobName}`);
  if (state.spaceName) lines.push(`공간: ${state.spaceName}`);
  lines.push(`결과: ${result.primaryLabel} ${result.primaryValue}${result.primaryUnit}`);
  lines.push(result.primaryDetail);
  result.metrics.forEach(([name, value]) => lines.push(`${name}: ${value}`));
  if (result.basis?.length) lines.push(`체크: ${result.basis.join(" / ")}`);
  lines.push("※ 제품 카탈로그와 현장 조건 확인 후 발주");
  return lines.join("\n");
}

refs.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.material = tab.dataset.material;
    refs.tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    renderFields();
  });
});

refs.form.addEventListener("input", () => {
  saveCommonFields();
  toggleConditionalFields();
  syncDependentFields();
  calculate();
});

refs.form.addEventListener("change", () => {
  saveCommonFields();
  toggleConditionalFields();
  syncDependentFields();
  calculate();
});

refs.form.addEventListener("click", (event) => {
  const presetButton = event.target.closest("[data-set-input][data-set-value]");
  if (presetButton) {
    const target = refs.form.elements[presetButton.dataset.setInput];
    if (!target) return;
    target.value = presetButton.dataset.setValue;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const segmentButton = event.target.closest("[data-name][data-value]");
  if (!segmentButton) return;

  const hidden = refs.form.elements[segmentButton.dataset.name];
  hidden.value = segmentButton.dataset.value;
  segmentButton
    .closest(".segmented")
    .querySelectorAll("button")
    .forEach((button) => button.classList.toggle("is-active", button === segmentButton));
  toggleConditionalFields();
  syncDependentFields();
  calculate();
});

refs.copyButton.addEventListener("click", async () => {
  const copyText = refs.copyButton.dataset.copyText || "";
  try {
    await navigator.clipboard.writeText(copyText);
    refs.copyButton.textContent = "✓";
    window.setTimeout(() => {
      refs.copyButton.textContent = "📋";
    }, 1200);
  } catch {
    window.prompt("결과 복사", copyText);
  }
});

refs.feedbackLink.addEventListener("click", () => {
  trackInternalEvent("update_request_click", {
    link_url: KAKAO_UPDATE_REQUEST_URL,
    link_text: "업데이트 요청하기",
  });

  if (typeof gtag !== "function") return;

  gtag("event", "update_request_click", {
    event_category: "engagement",
    event_label: "kakao_update_request",
    link_url: KAKAO_UPDATE_REQUEST_URL,
    link_text: "업데이트 요청하기",
    ...getCampaignParams(),
  });
});

refs.communityLink.addEventListener("click", () => {
  trackCommunityChatClick();
});

refs.openchatPopupLink.addEventListener("click", () => {
  trackCommunityChatClick();
  closeOpenchatPopup({ remember: true });
});

refs.openchatClose.addEventListener("click", () => {
  closeOpenchatPopup({ remember: true });
});

refs.openchatModal.addEventListener("click", (event) => {
  if (event.target === refs.openchatModal) closeOpenchatPopup({ remember: true });
});

function trackCommunityChatClick() {
  if (typeof gtag !== "function") return;

  gtag("event", "community_chat_click", {
    event_category: "engagement",
    event_label: "kakao_practitioner_chat",
    link_url: KAKAO_COMMUNITY_CHAT_URL,
    link_text: "실무자 오픈채팅",
    ...getCampaignParams(),
  });
}

refs.chatToggle.addEventListener("click", () => {
  setChatOpen(!refs.chatWidget.classList.contains("is-open"));
});

document.addEventListener("click", (event) => {
  if (!refs.chatWidget.classList.contains("is-open")) return;
  if (refs.chatWidget.contains(event.target)) return;
  setChatOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  setChatOpen(false);
  closeOpenchatPopup({ remember: true });
});

function syncDependentFields() {
  const floorSpec = refs.form.elements.floorSpec;
  const boxPyeong = refs.form.elements.boxPyeong;
  if (floorSpec && boxPyeong && state.material === "floor") {
    const spec = floorSpecs[floorSpec.value];
    if (floorSpec.value !== "direct" && spec) {
      boxPyeong.value = spec.boxPyeong;
      boxPyeong.disabled = true;
    } else {
      boxPyeong.disabled = false;
    }
  }

  const furnitureSpec = refs.form.elements.furnitureSpec;
  if (furnitureSpec && state.material === "furniture") {
    const spec = furnitureSpecs[furnitureSpec.value];
    const height = refs.form.elements.cabinetHeight;
    const depth = refs.form.elements.cabinetDepth;
    const doorWidth = refs.form.elements.doorWidth;
    const countertop = refs.form.elements.includeCountertop;
    if (spec && furnitureSpec.dataset.lastValue !== furnitureSpec.value) {
      height.value = spec.defaultHeight;
      depth.value = spec.defaultDepth;
      doorWidth.value = spec.doorWidth;
      countertop.checked = spec.hasCountertop;
      furnitureSpec.dataset.lastValue = furnitureSpec.value;
    }
  }
}

function setupChatLinks() {
  setupExternalLink(refs.communityLink, KAKAO_COMMUNITY_CHAT_URL);
  setupExternalLink(refs.openchatPopupLink, KAKAO_COMMUNITY_CHAT_URL);
  setupExternalLink(refs.feedbackLink, KAKAO_UPDATE_REQUEST_URL);
}

function setupExternalLink(link, url) {
  if (!link) return;

  if (!url) {
    link.removeAttribute("href");
    link.removeAttribute("target");
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
    return;
  }

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.classList.remove("is-disabled");
  link.removeAttribute("aria-disabled");
}

function setChatOpen(isOpen) {
  refs.chatWidget.classList.toggle("is-open", isOpen);
  refs.chatToggle.setAttribute("aria-expanded", String(isOpen));
  refs.chatToggle.setAttribute("aria-label", isOpen ? "카카오 메뉴 닫기" : "카카오 메뉴 열기");
}

function setupOpenchatPopup() {
  if (hasSeenOpenchatPopup()) return;

  const showAfterScroll = () => {
    if (window.scrollY < 80) return;
    openOpenchatPopup();
    window.removeEventListener("scroll", showAfterScroll);
  };

  window.addEventListener("scroll", showAfterScroll, { passive: true });
}

function openOpenchatPopup() {
  refs.openchatModal.classList.add("is-visible");
  refs.openchatModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  rememberOpenchatPopup();
}

function closeOpenchatPopup({ remember } = { remember: false }) {
  if (!refs.openchatModal.classList.contains("is-visible")) return;
  refs.openchatModal.classList.remove("is-visible");
  refs.openchatModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
  if (remember) rememberOpenchatPopup();
}

function hasSeenOpenchatPopup() {
  try {
    return localStorage.getItem(OPENCHAT_POPUP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberOpenchatPopup() {
  try {
    localStorage.setItem(OPENCHAT_POPUP_STORAGE_KEY, "1");
  } catch {
    // Storage can be unavailable in some privacy modes; the popup should still work.
  }
}

function escapeAttr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

setupChatLinks();
setupOpenchatPopup();
renderFields();
trackInternalEvent("site_visit");
