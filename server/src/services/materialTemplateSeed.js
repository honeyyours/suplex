// 마감재 회사 마스터 시드 (~120개).
// 사용자 워크플로 검토 후 정제. 각 항목에 formKey 매핑.
// formKey 정의는 client/src/utils/materialFormSchemas.js 와 동기화.

const ROWS = [
  // ============================================
  // 공통·설비 — 전체 공통
  // ============================================
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', it: '도어 양식 (전체 통일)', fk: 'door_style',  notes: '벽체 마감(석고/MDF) 영향. 양식 결정 후 목공 진입' },
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', it: '도어 손잡이',           fk: 'door_handle', notes: '도어록 제조사와 호환 확인' },
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', it: '경첩 / 도어스톱퍼',     fk: 'hinge',       notes: '' },
  { sg: '전체 공통', sub: '마감 기준',   kind: 'FINISH', it: '걸레받이 / 몰딩 양식',  fk: 'baseboard',   notes: '마이너스 몰딩 적용 여부 결정' },

  // 공통·설비 — 창호
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '창호 일괄 (전체 교체)', fk: 'window',         notes: '교체 모델/색상 일괄 지정' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '거실 샷시',             fk: 'window_partial', notes: '일괄과 다른 점 있을 때만' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '안방 샷시',             fk: 'window_partial', notes: '' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '방1 샷시',              fk: 'window_partial', notes: '' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '방2 샷시',              fk: 'window_partial', notes: '' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '주방 샷시',             fk: 'window_partial', notes: '' },
  { sg: '창호', sub: '창호', kind: 'FINISH', it: '베란다 샷시',           fk: 'window_partial', notes: '' },

  // 공통·설비 — 전기 (스위치/콘센트 일괄)
  { sg: '전체 공통', sub: '전기',  kind: 'FINISH', it: '스위치 / 콘센트 (전체)', fk: 'switch_outlet', notes: '특정 공간만 다른 모델이면 그 공간 항목 비고에 메모' },

  // ============================================
  // 현관
  // ============================================
  { sg: '현관', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥 타일',  fk: 'entrance_floor_tile', notes: '' },
  { sg: '현관', sub: '바닥·벽·천장', kind: 'FINISH', it: '벽 마감재',  fk: 'entrance_wall',       notes: '' },
  { sg: '현관', sub: '바닥·벽·천장', kind: 'FINISH', it: '천장재',     fk: 'ceiling_finish',      notes: '' },
  { sg: '현관', sub: '조명·전기',    kind: 'FINISH', it: '현관 다운라이트', fk: 'downlight',     notes: '도면상 타공 위치 확인' },
  { sg: '현관', sub: '조명·전기',    kind: 'FINISH', it: '센서등',          fk: 'sensor_light',  notes: '' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', it: '디지털 도어록',   fk: 'digital_doorlock', notes: '' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', it: '현관문 필름',     fk: 'door_film',     notes: '기존 문선 철거 후 9mm 문선 래핑' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', it: '중문',            fk: 'mid_door',         notes: '' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', it: '중문 손잡이',     fk: 'mid_door_handle', notes: '' },
  { sg: '현관', sub: '가구',         kind: 'FINISH', it: '신발장',          fk: 'shoe_cabinet',  notes: '' },

  // ============================================
  // 거실
  // ============================================
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',          fk: 'floor_material',  notes: '' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배 (벽/천장)',  fk: 'wallpaper',        notes: '무몰딩/히든도어 시 올퍼티 작업 필요' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', it: '아트월',          fk: 'art_wall',         notes: 'TV 매립 방식에 따라 마감 결정' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', it: '우물천장 / 간접등', fk: 'coffer_ceiling', notes: '리폼/평탄화/그대로 둠 결정' },
  { sg: '거실', sub: '조명·전기',    kind: 'FINISH', it: '거실 다운라이트', fk: 'downlight',         notes: '' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', it: 'TV',                fk: 'tv',           notes: '브라켓 타공 위치 연동' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', it: '에어컨 (스탠드/시스템)', fk: 'aircon_free',  notes: '배관 선작업 및 단내림 목공 필수' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', it: '실링팬',            fk: 'ceiling_fan',  notes: '천장 합판 보강·전용 전원선' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', it: '로봇청소기',        fk: 'robot_vacuum', notes: '거실장 옆 빌트인 시 콘센트·여유 공간 확인' },

  // ============================================
  // 주방
  // ============================================
  { sg: '주방', sub: '바닥·벽·천장', kind: 'FINISH', it: '주방 벽 타일',     fk: 'wall_tile',     notes: '세로 시공·에폭시 본드' },
  { sg: '주방', sub: '바닥·벽·천장', kind: 'FINISH', it: '주방 다운라이트',  fk: 'downlight',     notes: '' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', it: '싱크대 하부장 도어', fk: 'sink_lower_door', notes: '서라운드 무몰딩, 푸시 인/아웃 철물' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', it: '상판',             fk: 'sink_top',      notes: '싱크볼 언더마운트, 타일 대신 상판 감아올리기' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', it: '싱크볼',           fk: 'sink_bowl',     notes: '' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', it: '수전',             fk: 'sink_faucet',   notes: '' },
  { sg: '주방', sub: '상부장·수납',  kind: 'FINISH', it: '싱크대 상부장 도어', fk: 'sink_upper_door', notes: '' },
  { sg: '주방', sub: '상부장·수납',  kind: 'FINISH', it: '상부장 하부 LED 바', fk: 'led_bar',     notes: '간접조명 배선' },
  { sg: '주방', sub: '전기·기타',    kind: 'FINISH', it: '가스차단기',       fk: 'gas_breaker',   notes: '인덕션 전환 시 가스 배관 철거 여부' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', it: '후드',           fk: 'range_hood',    notes: '후드 배관 위치 확인' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', it: '인덕션 / 가스쿡탑', fk: 'cooktop',     notes: '' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', it: '식기세척기',      fk: 'dishwasher',    notes: '콘센트·급배수 위치 확인' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', it: '오븐',            fk: 'oven',          notes: '콘센트·전력량·장 제작 사이즈 확인' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '냉장고 (메인)',   fk: 'fridge',        notes: '도어 개폐 방향 및 장 사이즈 확인' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '전자레인지 (빌트인)', fk: 'microwave', notes: '빌트인 시 장 타공 사이즈' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '김치냉장고 (빌트인)', fk: 'kimchi_fridge', notes: '빌트인 시 장 사이즈·환기' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '정수기 (빌트인)',     fk: 'water_purifier', notes: '직수 배관 위치' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '커피머신 (빌트인)',   fk: 'coffee_machine', notes: '직수 배관·콘센트' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', it: '와인셀러 (빌트인)',   fk: 'wine_cellar', notes: '환기·콘센트' },

  // ============================================
  // 안방
  // ============================================
  { sg: '안방', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',         fk: 'floor_material', notes: '' },
  { sg: '안방', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배 (벽/천장)', fk: 'wallpaper',      notes: '' },
  { sg: '안방', sub: '조명·전기',    kind: 'FINISH', it: '안방 조명',      fk: 'bedroom_light',  notes: '취침등 별도 회로 / 남영전구 권장 (스위치 색변경 X)' },
  { sg: '안방', sub: '도어·창',      kind: 'FINISH', it: '방문 + 문틀 필름', fk: 'room_door_film', notes: '9mm 문선 래핑' },
  { sg: '안방', sub: '가구',         kind: 'FINISH', it: '붙박이장',       fk: 'builtin_closet', notes: 'PET 마감 기본' },
  { sg: '안방', sub: '가전',         kind: 'APPLIANCE', it: '에어컨 (벽걸이)',         fk: 'aircon_free', notes: '' },
  { sg: '안방', sub: '가전',         kind: 'APPLIANCE', it: '스타일러 / 에어드레서',   fk: 'styler',      notes: '빌트인 가능' },

  // ============================================
  // 방1
  // ============================================
  { sg: '방1', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',         fk: 'floor_material', notes: '' },
  { sg: '방1', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배 (벽/천장)', fk: 'wallpaper',      notes: '' },
  { sg: '방1', sub: '조명·전기',    kind: 'FINISH', it: '조명',           fk: 'bedroom_light',  notes: '남영전구 권장' },
  { sg: '방1', sub: '도어·창',      kind: 'FINISH', it: '방문 + 문틀 필름', fk: 'room_door_film', notes: '' },
  { sg: '방1', sub: '가구·가전',    kind: 'FINISH',    it: '붙박이장 / 책상장', fk: 'builtin_closet', notes: '' },
  { sg: '방1', sub: '가구·가전',    kind: 'APPLIANCE', it: '에어컨 (벽걸이)',   fk: 'aircon_free',    notes: '' },

  // ============================================
  // 방2
  // ============================================
  { sg: '방2', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',         fk: 'floor_material', notes: '' },
  { sg: '방2', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배 (벽/천장)', fk: 'wallpaper',      notes: '' },
  { sg: '방2', sub: '조명·전기',    kind: 'FINISH', it: '조명',           fk: 'bedroom_light',  notes: '남영전구 권장' },
  { sg: '방2', sub: '도어·창',      kind: 'FINISH', it: '방문 + 문틀 필름', fk: 'room_door_film', notes: '' },
  { sg: '방2', sub: '가구·가전',    kind: 'FINISH',    it: '붙박이장 / 책상장', fk: 'builtin_closet', notes: '' },
  { sg: '방2', sub: '가구·가전',    kind: 'APPLIANCE', it: '에어컨 (벽걸이)',   fk: 'aircon_free',    notes: '' },

  // ============================================
  // 욕실 (공용)
  // ============================================
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', it: '벽 타일',         fk: 'wall_tile',  notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥 타일',       fk: 'floor_tile', notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', it: '방수',            fk: 'waterproofing', notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', it: '천장재',          fk: 'bath_ceiling', notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', it: '환풍기',          fk: 'bath_fan',     notes: '' },
  { sg: '욕실 (공용)', sub: '문',           kind: 'FINISH', it: '욕실 도어 + 문틀 필름', fk: 'door_film', notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '세면대',          fk: 'washbasin',  notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '세면대 수전',     fk: 'washbasin_faucet', notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '변기',            fk: 'toilet',     notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '샤워 수전 / 샤워바', fk: 'shower_faucet', notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '욕조',            fk: 'bathtub',    notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', it: '샤워부스',        fk: 'shower_booth', notes: '' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', it: '거울 / 거울장',   fk: 'bath_mirror', notes: '' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', it: '수건걸이',        fk: 'towel_holder', notes: '' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', it: '휴지걸이',        fk: 'toilet_paper_holder', notes: '' },
  { sg: '욕실 (공용)', sub: '기타',         kind: 'FINISH', it: '코킹 색상',       fk: 'caulking_color', notes: '' },

  // ============================================
  // 욕실 (안방)
  // ============================================
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', it: '벽 타일',         fk: 'wall_tile',  notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥 타일',       fk: 'floor_tile', notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', it: '방수',            fk: 'waterproofing', notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', it: '천장재',          fk: 'bath_ceiling', notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', it: '환풍기',          fk: 'bath_fan',     notes: '' },
  { sg: '욕실 (안방)', sub: '문',           kind: 'FINISH', it: '욕실 도어 + 문틀 필름', fk: 'door_film', notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '세면대',          fk: 'washbasin',  notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '세면대 수전',     fk: 'washbasin_faucet', notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '변기',            fk: 'toilet',     notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '샤워 수전 / 샤워바', fk: 'shower_faucet', notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '욕조',            fk: 'bathtub',    notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', it: '샤워부스',        fk: 'shower_booth', notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', it: '거울 / 거울장',   fk: 'bath_mirror', notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', it: '수건걸이',        fk: 'towel_holder', notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', it: '휴지걸이',        fk: 'toilet_paper_holder', notes: '' },
  { sg: '욕실 (안방)', sub: '기타',         kind: 'FINISH', it: '코킹 색상',       fk: 'caulking_color', notes: '' },

  // ============================================
  // 다용도실 / 베란다
  // ============================================
  { sg: '다용도실', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',         fk: 'floor_material', notes: '' },
  { sg: '다용도실', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배 (벽/천장)', fk: 'wallpaper',      notes: '' },
  { sg: '다용도실', sub: '바닥·벽·천장', kind: 'FINISH', it: '베란다 도장 (방수)', fk: 'veranda_paint', notes: '' },
  { sg: '다용도실', sub: '수납·건조',    kind: 'FINISH', it: '빨래건조대',     fk: 'free_text',     notes: '' },
  { sg: '다용도실', sub: '가전·전기',    kind: 'APPLIANCE', it: '세탁기',         fk: 'washer',     notes: '' },
  { sg: '다용도실', sub: '가전·전기',    kind: 'APPLIANCE', it: '건조기',         fk: 'dryer',      notes: '직배관/콘덴서 방식 확인' },

  // ============================================
  // 옵션 공간 — 디폴트 비활성 (active=false)
  // ============================================
  // 드레스룸
  { sg: '드레스룸', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',     fk: 'floor_material', notes: '', optional: true },
  { sg: '드레스룸', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배',       fk: 'wallpaper',      notes: '', optional: true },
  { sg: '드레스룸', sub: '조명·전기',    kind: 'FINISH', it: '조명',       fk: 'bedroom_light',  notes: '', optional: true },
  { sg: '드레스룸', sub: '가구',         kind: 'FINISH', it: '붙박이장',   fk: 'builtin_closet', notes: '', optional: true },
  { sg: '드레스룸', sub: '가구',         kind: 'FINISH', it: '화장대',     fk: 'vanity',         notes: '우리 제작', optional: true },

  // 파우더룸
  { sg: '파우더룸', sub: '바닥·벽·천장', kind: 'FINISH', it: '바닥재',         fk: 'floor_material', notes: '', optional: true },
  { sg: '파우더룸', sub: '바닥·벽·천장', kind: 'FINISH', it: '도배',           fk: 'wallpaper',      notes: '', optional: true },
  { sg: '파우더룸', sub: '조명·전기',    kind: 'FINISH', it: '조명',           fk: 'powder_light',   notes: '스위치/센서등 선택', optional: true },
  { sg: '파우더룸', sub: '위생도기',     kind: 'FINISH', it: '세면대',         fk: 'washbasin',      notes: '', optional: true },
  { sg: '파우더룸', sub: '위생도기',     kind: 'FINISH', it: '세면대 수전',    fk: 'washbasin_faucet', notes: '', optional: true },
];

function buildSeedRows() {
  return ROWS.map((r, idx) => ({
    kind: r.kind,
    spaceGroup: r.sg,
    subgroup: r.sub,
    itemName: r.it,
    formKey: r.fk || null,
    defaultSiteNotes: r.notes || null,
    essential: false, // 더 이상 사용 안 함 — UI에서 무시
    orderIndex: idx,
    active: r.optional ? false : true,
  }));
}

module.exports = { buildSeedRows };
