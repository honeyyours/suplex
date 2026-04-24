// 마감재 항목별 폼 schema. formKey → fields 정의.
// 각 항목 클릭 시 MaterialModal이 이걸 보고 dynamic 렌더링.
//
// fields[].type: 'text' | 'select' | 'radio' | 'number' | 'multiline' | 'toggle'
// fields[].target?: 'brand' | 'productName' | 'spec' (있으면 Material 컬럼에 직접 저장,
//   없으면 customSpec[key]에 저장)
// fields[].unit?: number 단위 표시 (예: 'mm', 'kg', 'L')

export const FORM_SCHEMAS = {
  // ============================================
  // 공통·설비
  // ============================================
  door_style: {
    title: '도어 양식',
    fields: [
      { key: 'style', label: '양식', type: 'select', options: ['일반문선', '9미리 문선', '히든도어', '스탭도어'] },
      { key: 'frame', label: '문틀', type: 'radio',  options: ['리폼', '유지'] },
      { key: 'door',  label: '도어', type: 'radio',  options: ['재사용', '신규 주문'] },
    ],
  },
  door_handle: {
    title: '도어 손잡이',
    fields: [
      { key: 'brand',  label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model',  label: '모델',   type: 'text', target: 'productName' },
      { key: 'finish', label: '마감',   type: 'text', placeholder: '예: 크롬 / 블랙 / 골드' },
    ],
  },
  hinge: {
    title: '경첩 / 도어스톱퍼',
    fields: [
      { key: 'color', label: '색상', type: 'text' },
    ],
  },
  baseboard: {
    title: '걸레받이 / 몰딩 양식',
    fields: [
      { key: 'style', label: '양식',   type: 'select', options: ['마이너스 몰딩', '일반 몰딩', '없음'] },
      { key: 'width', label: '폭',     type: 'number', unit: 'mm' },
      { key: 'film',  label: '필름지', type: 'text', placeholder: '색상/모델' },
    ],
  },
  window: {
    title: '창호 일괄',
    fields: [
      { key: 'brand',   label: '브랜드',     type: 'text', target: 'brand' },
      { key: 'model',   label: '모델',       type: 'text', target: 'productName' },
      { key: 'profile', label: '프로파일',   type: 'text', placeholder: '예: 70mm·시스템' },
      { key: 'glass',   label: '유리',       type: 'select', options: ['2중', '3중', '로이', '슈퍼로이'] },
      { key: 'color',   label: '색상',       type: 'text' },
    ],
  },
  window_partial: {
    title: '샷시 (특정 공간)',
    fields: [
      { key: 'note', label: '일괄과 다른 점', type: 'multiline', placeholder: '동일하면 비워두세요' },
    ],
  },
  switch_outlet: {
    title: '스위치 / 콘센트',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },

  // ============================================
  // 현관
  // ============================================
  entrance_floor_tile: {
    title: '바닥 타일',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: '예: 600×600' },
    ],
  },
  entrance_wall: {
    title: '벽 마감재',
    fields: [
      { key: 'finish', label: '마감 종류', type: 'select', options: ['타일', '도배', '필름'] },
      { key: 'brand',  label: '브랜드',    type: 'text', target: 'brand' },
      { key: 'model',  label: '모델/품번', type: 'text', target: 'productName' },
    ],
  },
  ceiling_finish: {
    title: '천장재',
    fields: [
      { key: 'type',  label: '종류', type: 'select', options: ['도배', '도장', '필름', '마이너스 천장', 'PVC', '기타'] },
      { key: 'color', label: '색상', type: 'text' },
    ],
  },
  downlight: {
    title: '다운라이트',
    fields: [
      { key: 'brand', label: '브랜드',     type: 'text', target: 'brand' },
      { key: 'model', label: '모델',       type: 'text', target: 'productName' },
      { key: 'kelvin', label: '색온도',    type: 'text', placeholder: '예: 5700K / 전구색' },
      { key: 'size',  label: '사이즈',     type: 'text', placeholder: '예: 4인치' },
    ],
  },
  sensor_light: {
    title: '센서등',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  digital_doorlock: {
    title: '디지털 도어록',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'auth',  label: '인증 방식', type: 'select', options: ['번호', '지문', '카드', '얼굴', '복합'] },
    ],
  },
  door_film: {
    title: '도어 + 문틀 필름',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'code',  label: '품번',   type: 'text', target: 'productName' },
    ],
  },
  mid_door: {
    title: '중문',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['슬라이딩', '여닫이'] },
      { key: 'glass', label: '유리',   type: 'select', options: ['망입', '투명', '모루', '없음'] },
      { key: 'color', label: '색상',   type: 'text' },
    ],
  },
  mid_door_handle: {
    title: '중문 손잡이',
    fields: [
      { key: 'color', label: '색상', type: 'text' },
    ],
  },
  shoe_cabinet: {
    title: '신발장',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['도어형', '오픈형', '혼합'] },
      { key: 'color', label: '색상',   type: 'text' },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: 'W×H mm' },
    ],
  },

  // ============================================
  // 거실
  // ============================================
  floor_material: {
    title: '바닥재',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['강마루', '원목마루', '장판', '타일'] },
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  wallpaper: {
    title: '도배 (벽지)',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['실크', '합지'] },
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'code',  label: '품번',   type: 'text', target: 'productName' },
    ],
  },
  art_wall: {
    title: '아트월',
    fields: [
      { key: 'tvMount', label: 'TV 매립',     type: 'select', options: ['반매립', '매립', '없음', '특이'] },
      { key: 'finish',  label: '마감 종류',   type: 'select', options: ['대리석', '타일', '필름', '도배', '우드', '포세린', '기타'] },
      { key: 'model',   label: '마감 모델',   type: 'text', target: 'productName' },
      { key: 'tvModel', label: 'TV 모델 (참고)', type: 'text', placeholder: '브라켓 위치 결정용' },
    ],
  },
  coffer_ceiling: {
    title: '우물천장 / 간접등',
    fields: [
      { key: 'plan', label: '시공 방향', type: 'select', options: ['간접등박스로 리폼', '평탄화', '그대로 둠'] },
    ],
  },
  tv: {
    title: 'TV',
    fields: [
      { key: 'brand', label: '브랜드',   type: 'text', target: 'brand' },
      { key: 'model', label: '모델',     type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈',   type: 'text', placeholder: '예: 75인치' },
    ],
  },
  aircon_free: {
    title: '에어컨',
    fields: [
      { key: 'note', label: '비고', type: 'multiline', placeholder: '브랜드/모델/평형 등 자유 입력' },
    ],
  },
  ceiling_fan: {
    title: '실링팬',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈', type: 'number', unit: 'mm' },
      { key: 'color', label: '색상',   type: 'text' },
    ],
  },
  robot_vacuum: {
    title: '로봇청소기',
    fields: [
      { key: 'brand',    label: '브랜드',         type: 'text', target: 'brand' },
      { key: 'model',    label: '모델',           type: 'text', target: 'productName' },
      { key: 'station',  label: '스테이션 위치',  type: 'text', placeholder: '예: 거실장 옆 빌트인' },
    ],
  },

  // ============================================
  // 주방
  // ============================================
  wall_tile: {
    title: '벽 타일',
    fields: [
      { key: 'brand',     label: '브랜드',     type: 'text', target: 'brand' },
      { key: 'model',     label: '모델',       type: 'text', target: 'productName' },
      { key: 'size',      label: '사이즈',     type: 'text', placeholder: '예: 300×600' },
      { key: 'direction', label: '시공 방향', type: 'select', options: ['가로', '세로'] },
      { key: 'grout',     label: '메지 색상', type: 'text' },
    ],
  },
  sink_lower_door: {
    title: '싱크대 하부장 도어',
    fields: [
      { key: 'finish', label: '마감',   type: 'select', options: ['PET', '우레탄', '하이그로시', '원목'] },
      { key: 'color',  label: '색상',   type: 'text' },
      { key: 'handle', label: '손잡이', type: 'select', options: ['Push', '노출', '매립'] },
    ],
  },
  sink_top: {
    title: '싱크대 상판',
    fields: [
      { key: 'material', label: '재질',     type: 'select', options: ['세라믹', '스테인리스', '인조대리석'] },
      { key: 'brand',    label: '브랜드',   type: 'text', target: 'brand' },
      { key: 'model',    label: '모델/색상', type: 'text', target: 'productName' },
      { key: 'thickness', label: '두께',    type: 'number', unit: 'mm' },
    ],
  },
  sink_bowl: {
    title: '싱크볼',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'mount', label: '타입',   type: 'select', options: ['언더마운트', '탑마운트'] },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: 'W×D mm' },
    ],
  },
  sink_faucet: {
    title: '싱크 수전',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'finish', label: '마감',  type: 'select', options: ['크롬', '매트블랙', '골드', '기타'] },
    ],
  },
  sink_upper_door: {
    title: '싱크대 상부장 도어',
    fields: [
      { key: 'finish', label: '마감',   type: 'select', options: ['PET', '우레탄', '하이그로시', '원목'] },
      { key: 'color',  label: '색상',   type: 'text' },
      { key: 'handle', label: '손잡이', type: 'select', options: ['Push', '노출', '매립'] },
    ],
  },
  led_bar: {
    title: '상부장 하부 LED 바',
    fields: [
      { key: 'type',   label: '종류',   type: 'select', options: ['라인', '포인트'] },
      { key: 'kelvin', label: '색온도', type: 'text', placeholder: '예: 4000K' },
      { key: 'length', label: '길이',   type: 'number', unit: 'mm' },
    ],
  },
  gas_breaker: {
    title: '가스차단기',
    fields: [
      { key: 'type', label: '종류', type: 'select', options: ['자동', '수동'] },
    ],
  },
  range_hood: {
    title: '후드',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'type',  label: '타입',   type: 'select', options: ['매립', '벽부', '아일랜드'] },
      { key: 'width', label: '폭',     type: 'number', unit: 'mm' },
    ],
  },
  cooktop: {
    title: '인덕션 / 가스쿡탑',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['인덕션', '가스', '하이브리드'] },
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'width', label: '폭',     type: 'number', unit: 'mm' },
    ],
  },
  dishwasher: {
    title: '식기세척기',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'type',  label: '타입',   type: 'select', options: ['빌트인', '카운터'] },
      { key: 'wdh',   label: 'W×D×H', type: 'text', placeholder: 'mm' },
    ],
  },
  oven: {
    title: '오븐',
    fields: [
      { key: 'brand',    label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model',    label: '모델',   type: 'text', target: 'productName' },
      { key: 'capacity', label: '용량',   type: 'text', placeholder: 'L' },
      { key: 'wdh',      label: 'W×D×H', type: 'text', placeholder: 'mm' },
    ],
  },
  fridge: {
    title: '냉장고 (메인)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'whd',   label: 'W×H×D', type: 'text', placeholder: 'mm' },
    ],
  },
  microwave: {
    title: '전자레인지 (빌트인)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'wdh',   label: 'W×D×H', type: 'text', placeholder: 'mm' },
    ],
  },
  kimchi_fridge: {
    title: '김치냉장고 (빌트인)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: 'W×H×D mm' },
    ],
  },
  water_purifier: {
    title: '정수기 (빌트인)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'type',  label: '타입',   type: 'select', options: ['직수', '저수'] },
    ],
  },
  coffee_machine: {
    title: '커피머신 (빌트인)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: 'mm' },
    ],
  },
  wine_cellar: {
    title: '와인셀러 (빌트인)',
    fields: [
      { key: 'brand',    label: '브랜드',     type: 'text', target: 'brand' },
      { key: 'model',    label: '모델',       type: 'text', target: 'productName' },
      { key: 'capacity', label: '용량 (병)', type: 'number' },
    ],
  },

  // ============================================
  // 안방 / 방1 / 방2
  // ============================================
  bedroom_light: {
    title: '조명',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'color', label: '색상',   type: 'text' },
    ],
  },
  room_door_film: {
    title: '방문 + 문틀 필름',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'code',  label: '품번',   type: 'text', target: 'productName' },
    ],
  },
  builtin_closet: {
    title: '붙박이장',
    fields: [
      { key: 'color',     label: '색상',     type: 'text' },
      { key: 'doorType',  label: '도어 타입', type: 'select', options: ['슬라이딩', '여닫이', '오픈'] },
      { key: 'handle',    label: '손잡이',   type: 'select', options: ['Push', '노출', '매립', '없음'] },
    ],
  },
  styler: {
    title: '스타일러 / 에어드레서',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',  label: '사이즈', type: 'text', placeholder: 'W×H×D mm' },
    ],
  },

  // ============================================
  // 욕실 (공용/안방 동일 폼)
  // ============================================
  floor_tile: {
    title: '바닥 타일',
    fields: [
      { key: 'brand',     label: '브랜드',     type: 'text', target: 'brand' },
      { key: 'model',     label: '모델',       type: 'text', target: 'productName' },
      { key: 'size',      label: '사이즈',     type: 'text' },
      { key: 'direction', label: '시공 방향', type: 'select', options: ['가로', '세로'] },
      { key: 'grout',     label: '메지 색상', type: 'text' },
    ],
  },
  waterproofing: {
    title: '방수',
    fields: [
      { key: 'apply', label: '적용 여부', type: 'radio', options: ['적용', '미적용'] },
    ],
  },
  bath_ceiling: {
    title: '천장재',
    fields: [
      { key: 'type', label: '종류', type: 'select', options: ['PVC', 'SMC', '도장'] },
    ],
  },
  bath_fan: {
    title: '환풍기',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  washbasin: {
    title: '세면대',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  washbasin_faucet: {
    title: '세면대 수전',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  toilet: {
    title: '변기',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
      { key: 'type',  label: '타입',   type: 'select', options: ['원피스', '투피스', '일체형'] },
    ],
  },
  shower_faucet: {
    title: '샤워 수전 / 샤워바',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  bathtub: {
    title: '욕조',
    fields: [
      { key: 'install', label: '설치 여부', type: 'radio', options: ['설치', '미설치'] },
      { key: 'size',    label: '사이즈',    type: 'select', options: ['700', '750', '기타'] },
    ],
  },
  shower_booth: {
    title: '샤워부스',
    fields: [
      { key: 'install',    label: '설치 여부',  type: 'radio',  options: ['설치', '미설치'] },
      { key: 'doorType',   label: '도어 타입', type: 'select', options: ['도어 있음', '도어 없음', '통유리', '하프'] },
      { key: 'glassColor', label: '유리 색상', type: 'text' },
    ],
  },
  bath_mirror: {
    title: '거울 / 거울장',
    fields: [
      { key: 'composition', label: '구성', type: 'select', options: ['거울장 일체형', '거울 + 수건장 분리', '거울만'] },
      { key: 'brand',       label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model',       label: '모델',   type: 'text', target: 'productName' },
      { key: 'size',        label: '사이즈', type: 'text', placeholder: 'W×H mm' },
    ],
  },
  towel_holder: {
    title: '수건걸이',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  toilet_paper_holder: {
    title: '휴지걸이',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
  caulking_color: {
    title: '코킹 색상',
    fields: [
      { key: 'color', label: '색상', type: 'text' },
    ],
  },

  // ============================================
  // 다용도실
  // ============================================
  veranda_paint: {
    title: '베란다 도장 (방수)',
    fields: [
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'color', label: '색상',   type: 'text' },
    ],
  },
  free_text: {
    title: '자유 입력',
    fields: [
      { key: 'note', label: '내용', type: 'multiline' },
    ],
  },
  washer: {
    title: '세탁기',
    fields: [
      { key: 'brand',    label: '브랜드',  type: 'text', target: 'brand' },
      { key: 'model',    label: '모델',    type: 'text', target: 'productName' },
      { key: 'size',     label: '사이즈',  type: 'text', placeholder: 'W×H×D mm' },
      { key: 'capacity', label: '용량',    type: 'number', unit: 'kg' },
      { key: 'type',     label: '타입',    type: 'select', options: ['드럼', '통돌이'] },
    ],
  },
  dryer: {
    title: '건조기',
    fields: [
      { key: 'brand',    label: '브랜드',  type: 'text', target: 'brand' },
      { key: 'model',    label: '모델',    type: 'text', target: 'productName' },
      { key: 'size',     label: '사이즈',  type: 'text', placeholder: 'W×H×D mm' },
      { key: 'capacity', label: '용량',    type: 'number', unit: 'kg' },
    ],
  },

  // ============================================
  // 옵션 공간
  // ============================================
  vanity: {
    title: '화장대',
    fields: [
      { key: 'shape', label: '형태', type: 'select', options: ['의자 수용', '일반'] },
    ],
  },
  powder_light: {
    title: '조명',
    fields: [
      { key: 'type',  label: '종류',   type: 'select', options: ['일반 스위치', '센서등'] },
      { key: 'brand', label: '브랜드', type: 'text', target: 'brand' },
      { key: 'model', label: '모델',   type: 'text', target: 'productName' },
    ],
  },
};

// 폼 정의 없는 항목 — 기본 자유 입력 폼
export const DEFAULT_FORM = {
  title: '항목',
  fields: [
    { key: 'brand', label: '브랜드',  type: 'text', target: 'brand' },
    { key: 'model', label: '모델/품번', type: 'text', target: 'productName' },
    { key: 'spec',  label: '규격/마감', type: 'text', target: 'spec' },
  ],
};

export function getFormSchema(formKey) {
  return FORM_SCHEMAS[formKey] || DEFAULT_FORM;
}
