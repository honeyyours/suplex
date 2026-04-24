// 마감재 회사 마스터 시드.
// 사용자(인테리어 회사) 워크플로 검토 후 정제한 ~130개. 자세한 검토 내역은 PR/세션 메모 참고.
// 형식: { sg: 공간/공정, sub: 세부 그룹, kind: FINISH/APPLIANCE, ess: 필수●여부, it: 항목명, notes }

const ROWS = [
  // ============================================
  // 공통·설비 그룹
  // ============================================

  // 전체 공통 — 도어·손잡이
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', ess: true,  it: '도어 양식 (전체 통일)', notes: '목공 전 전체 도어 마감 기준 확립' },
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', ess: true,  it: '도어 손잡이',           notes: '도어록 제조사와 호환 확인' },
  { sg: '전체 공통', sub: '도어·손잡이', kind: 'FINISH', ess: true,  it: '경첩 / 도어스톱퍼',     notes: '' },

  // 전체 공통 — 마감 기준
  { sg: '전체 공통', sub: '마감 기준',   kind: 'FINISH', ess: true,  it: '걸레받이 / 몰딩 양식', notes: '마이너스 몰딩 적용 여부 결정' },
  { sg: '전체 공통', sub: '마감 기준',   kind: 'FINISH', ess: true,  it: '타일 줄눈(메지) 색상', notes: '욕실/주방 통일 또는 분리 결정' },
  { sg: '전체 공통', sub: '마감 기준',   kind: 'FINISH', ess: true,  it: '실리콘 코킹 색상',     notes: '' },
  { sg: '전체 공통', sub: '마감 기준',   kind: 'FINISH', ess: false, it: '올퍼티 여부',          notes: '무몰딩/히든도어 적용 시 필수' },

  // 창호
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: true,  it: '창호 일괄 (전체 교체)', notes: '교체 모델/색상 일괄 지정' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: true,  it: '방충망 (전체)',         notes: '' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: true,  it: '창호 실리콘 코킹',      notes: '기존 실리콘 제거 후 재시공' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '거실 샷시',             notes: '일괄 외 특이사항 시' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '안방 샷시',             notes: '' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '방1 샷시',              notes: '' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '방2 샷시',              notes: '' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '주방 샷시',             notes: '' },
  { sg: '창호', sub: '창호',  kind: 'FINISH', ess: false, it: '베란다 샷시',           notes: '' },

  // ============================================
  // 공간별 — 현관
  // ============================================
  { sg: '현관', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥 타일',     notes: '' },
  { sg: '현관', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '천장재',         notes: '' },
  { sg: '현관', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '현관 다운라이트', notes: '도면상 타공 위치 확인' },
  { sg: '현관', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '센서등',         notes: '' },
  { sg: '현관', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', ess: true,  it: '디지털 도어록',  notes: '' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', ess: true,  it: '현관문 필름',    notes: '기존 문선 철거 후 9mm 문선 래핑' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', ess: false, it: '중문',           notes: '중문 종류에 따른 색상·모델명 확인' },
  { sg: '현관', sub: '도어·중문',    kind: 'FINISH', ess: false, it: '중문 손잡이',    notes: '' },
  { sg: '현관', sub: '가구',         kind: 'FINISH', ess: true,  it: '신발장',         notes: '' },

  // ============================================
  // 공간별 — 거실
  // ============================================
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥재',           notes: '걸레받이 유무 및 마이너스 몰딩 시공 맞춤' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '도배 (벽/천장)',   notes: '무몰딩/히든도어 적용 시 올퍼티 작업 필수' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '아트월 (TV 마감)', notes: 'TV 브라켓·사운드바 사이즈 확인 후 설계' },
  { sg: '거실', sub: '바닥·벽·천장', kind: 'FINISH', ess: false, it: '우물천장 / 간접등', notes: '목공 마감, 간접조명 스위치 배선 필요' },
  { sg: '거실', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '거실 다운라이트',  notes: '도면상 타공 위치 및 배선 가닥수 확인' },
  { sg: '거실', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트',  notes: '' },
  { sg: '거실', sub: '창·커튼',      kind: 'FINISH', ess: true,  it: '커튼박스 (목공)',  notes: '' },
  { sg: '거실', sub: '창·커튼',      kind: 'FINISH', ess: true,  it: '커튼 / 블라인드',  notes: '' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', ess: true,  it: 'TV',                notes: '브라켓 타공 위치 연동' },
  { sg: '거실', sub: '가전',         kind: 'FINISH',    ess: true,  it: 'TV 브라켓',         notes: '천장 보강 필요 여부 확인' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', ess: true,  it: '에어컨 (스탠드/시스템)', notes: '배관 선작업 및 단내림 목공 필수' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', ess: false, it: '실링팬',            notes: '천장 합판 보강·전용 전원선 단독 배선' },
  { sg: '거실', sub: '가전',         kind: 'APPLIANCE', ess: false, it: '로봇청소기 (스테이션)', notes: '거실장 옆 빌트인 시 콘센트·여유 공간 확인' },

  // ============================================
  // 공간별 — 주방
  // ============================================
  { sg: '주방', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '주방 벽 타일',     notes: '세로 시공·에폭시 본드, 메지 색상 지정' },
  { sg: '주방', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '주방 다운라이트',  notes: '' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', ess: true,  it: '싱크대 하부장 도어', notes: '서라운드 무몰딩, 푸시 인/아웃 철물' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', ess: true,  it: '상판',             notes: '싱크볼 언더마운트, 타일 대신 상판 감아올리기' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', ess: true,  it: '싱크볼 / 수전',    notes: '식기세척기 유무 및 모델명 확인' },
  { sg: '주방', sub: '싱크대 하부',  kind: 'FINISH', ess: true,  it: '걸레받이 (킥판)',   notes: '' },
  { sg: '주방', sub: '상부장·수납',  kind: 'FINISH', ess: true,  it: '싱크대 상부장 도어', notes: '' },
  { sg: '주방', sub: '상부장·수납',  kind: 'FINISH', ess: true,  it: '상부장 하부 LED 바', notes: '간접조명 배선' },
  { sg: '주방', sub: '상부장·수납',  kind: 'FINISH', ess: true,  it: '냉장고장 / 키큰장', notes: '냉장고 사이즈 확인 후 장 제작' },
  { sg: '주방', sub: '전기·기타',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트',  notes: '인덕션 전용 콘센트 / 식세기·오븐 별도' },
  { sg: '주방', sub: '전기·기타',    kind: 'FINISH', ess: true,  it: '가스차단기',       notes: '인덕션 전환 시 가스 배관 철거 여부' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', ess: true,  it: '후드',           notes: '후드 배관 위치 확인' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', ess: true,  it: '인덕션 / 가스쿡탑', notes: '' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', ess: false, it: '식기세척기',      notes: '콘센트·급배수 위치 확인' },
  { sg: '주방', sub: '빌트인 가전',  kind: 'APPLIANCE', ess: false, it: '오븐',           notes: '콘센트·전력량·장 제작 사이즈 확인' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: true,  it: '냉장고 (메인)',   notes: '도어 개폐 방향 및 장 사이즈 확인' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: false, it: '전자레인지 (빌트인)', notes: '빌트인 시 장 타공 사이즈' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: false, it: '김치냉장고 (빌트인)', notes: '빌트인 시 장 사이즈·환기' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: false, it: '정수기 (빌트인)',     notes: '직수 배관 위치' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: false, it: '커피머신 (빌트인)',   notes: '직수 배관·콘센트' },
  { sg: '주방', sub: '일반 가전',    kind: 'APPLIANCE', ess: false, it: '와인셀러 (빌트인)',   notes: '환기·콘센트' },

  // ============================================
  // 공간별 — 안방
  // ============================================
  { sg: '안방', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥재',         notes: '' },
  { sg: '안방', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '도배 (벽/천장)', notes: '' },
  { sg: '안방', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '안방 조명 (취침등 2회로)', notes: '취침등 별도 스위치 배선' },
  { sg: '안방', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '안방', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '방문 + 문틀 필름', notes: '9mm 문선 래핑' },
  { sg: '안방', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼박스 (목공)', notes: '' },
  { sg: '안방', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼 / 블라인드', notes: '' },
  { sg: '안방', sub: '가구',         kind: 'FINISH', ess: true,  it: '붙박이장',        notes: '' },
  { sg: '안방', sub: '가전',         kind: 'APPLIANCE', ess: true,  it: '에어컨 (벽걸이)', notes: '' },
  { sg: '안방', sub: '가전',         kind: 'APPLIANCE', ess: false, it: '스타일러 / 에어드레서 (빌트인)', notes: '' },

  // ============================================
  // 공간별 — 방1
  // ============================================
  { sg: '방1', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥재',         notes: '' },
  { sg: '방1', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '도배 (벽/천장)', notes: '' },
  { sg: '방1', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '조명',           notes: '남영전구 권장 (스위치로 껐다 켜도 색변경 X)' },
  { sg: '방1', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '방1', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '방문 + 문틀 필름', notes: '' },
  { sg: '방1', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼박스 (목공)', notes: '' },
  { sg: '방1', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼 / 블라인드', notes: '' },
  { sg: '방1', sub: '가구·가전',    kind: 'FINISH',    ess: false, it: '붙박이장 / 책상장', notes: '' },
  { sg: '방1', sub: '가구·가전',    kind: 'APPLIANCE', ess: false, it: '에어컨 (벽걸이)',   notes: '' },

  // ============================================
  // 공간별 — 방2
  // ============================================
  { sg: '방2', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥재',         notes: '' },
  { sg: '방2', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '도배 (벽/천장)', notes: '' },
  { sg: '방2', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '조명',           notes: '남영전구 권장' },
  { sg: '방2', sub: '조명·전기',    kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '방2', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '방문 + 문틀 필름', notes: '' },
  { sg: '방2', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼박스 (목공)', notes: '' },
  { sg: '방2', sub: '도어·창·커튼', kind: 'FINISH', ess: true,  it: '커튼 / 블라인드', notes: '' },
  { sg: '방2', sub: '가구·가전',    kind: 'FINISH',    ess: false, it: '붙박이장 / 책상장', notes: '' },
  { sg: '방2', sub: '가구·가전',    kind: 'APPLIANCE', ess: false, it: '에어컨 (벽걸이)',   notes: '' },

  // ============================================
  // 공간별 — 욕실 (공용)
  // ============================================
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '벽 타일',         notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥 타일',       notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '방수 (이중)',     notes: '' },
  { sg: '욕실 (공용)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '천장재 / 환풍기', notes: '' },
  { sg: '욕실 (공용)', sub: '문',           kind: 'FINISH', ess: true,  it: '욕실 도어 + 문틀 필름', notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '세면대 + 수전',   notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '변기',           notes: '' },
  { sg: '욕실 (공용)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '샤워 수전 / 샤워바', notes: '' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '거울장 + 간접조명', notes: '내부 콘센트 추가' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '수건걸이',        notes: '' },
  { sg: '욕실 (공용)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '휴지걸이',        notes: '' },
  { sg: '욕실 (공용)', sub: '전기·기타',     kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '욕실 (공용)', sub: '전기·기타',     kind: 'FINISH', ess: true,  it: '실리콘 코킹',     notes: '' },

  // ============================================
  // 공간별 — 욕실 (안방)
  // ============================================
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '벽 타일',         notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '바닥 타일',       notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '방수 (이중)',     notes: '' },
  { sg: '욕실 (안방)', sub: '바닥·벽·천장', kind: 'FINISH', ess: true,  it: '천장재 / 환풍기', notes: '' },
  { sg: '욕실 (안방)', sub: '문',           kind: 'FINISH', ess: true,  it: '욕실 도어 + 문틀 필름', notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '세면대 + 수전',   notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '변기',           notes: '' },
  { sg: '욕실 (안방)', sub: '위생도기',     kind: 'FINISH', ess: true,  it: '샤워 수전 / 샤워바', notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '거울장 + 간접조명', notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '수건걸이',        notes: '' },
  { sg: '욕실 (안방)', sub: '수납·액세서리', kind: 'FINISH', ess: true,  it: '휴지걸이',        notes: '' },
  { sg: '욕실 (안방)', sub: '전기·기타',     kind: 'FINISH', ess: true,  it: '스위치 / 콘센트', notes: '' },
  { sg: '욕실 (안방)', sub: '전기·기타',     kind: 'FINISH', ess: true,  it: '실리콘 코킹',     notes: '' },

  // ============================================
  // 공간별 — 다용도실 / 베란다
  // ============================================
  { sg: '다용도실', sub: '바닥·벽·천장', kind: 'FINISH',    ess: true,  it: '베란다 도장 (방수)', notes: '' },
  { sg: '다용도실', sub: '설비·수전',    kind: 'FINISH',    ess: true,  it: '세탁기 수전',       notes: '' },
  { sg: '다용도실', sub: '설비·수전',    kind: 'FINISH',    ess: true,  it: '베란다 배수구',     notes: '' },
  { sg: '다용도실', sub: '수납·건조',    kind: 'FINISH',    ess: true,  it: '천장형 빨래건조대', notes: '' },
  { sg: '다용도실', sub: '가전·전기',    kind: 'APPLIANCE', ess: true,  it: '세탁기',            notes: '' },
  { sg: '다용도실', sub: '가전·전기',    kind: 'APPLIANCE', ess: false, it: '건조기',            notes: '직배관/콘덴서 방식 확인' },
  { sg: '다용도실', sub: '가전·전기',    kind: 'FINISH',    ess: true,  it: '스위치 / 콘센트',   notes: '' },

  // ============================================
  // 옵션 공간 — 디폴트 비활성 권장 (active=false)
  // ============================================
  { sg: '드레스룸', sub: '기본',  kind: 'FINISH',    ess: false, it: '바닥재',                 notes: '', optional: true },
  { sg: '드레스룸', sub: '기본',  kind: 'FINISH',    ess: false, it: '도배',                  notes: '', optional: true },
  { sg: '드레스룸', sub: '기본',  kind: 'FINISH',    ess: false, it: '조명 (메인 + 보조)',     notes: '', optional: true },
  { sg: '드레스룸', sub: '가구',  kind: 'FINISH',    ess: false, it: '시스템 행거 / 붙박이장', notes: '', optional: true },
  { sg: '드레스룸', sub: '가구',  kind: 'FINISH',    ess: false, it: '화장대 / 거울',          notes: '', optional: true },

  { sg: '파우더룸', sub: '기본',  kind: 'FINISH',    ess: false, it: '바닥재',                 notes: '', optional: true },
  { sg: '파우더룸', sub: '기본',  kind: 'FINISH',    ess: false, it: '도배',                  notes: '', optional: true },
  { sg: '파우더룸', sub: '위생도기·조명', kind: 'FINISH', ess: false, it: '조명 (화장용 무영등)', notes: '', optional: true },
  { sg: '파우더룸', sub: '위생도기·조명', kind: 'FINISH', ess: false, it: '세면대 + 수전',       notes: '', optional: true },
  { sg: '파우더룸', sub: '위생도기·조명', kind: 'FINISH', ess: false, it: '거울 / 거울장',       notes: '', optional: true },
  { sg: '파우더룸', sub: '위생도기·조명', kind: 'FINISH', ess: false, it: '콘센트 (드라이기용)', notes: '', optional: true },

  { sg: '알파룸 / 서재', sub: '기본', kind: 'FINISH', ess: false, it: '바닥재',         notes: '', optional: true },
  { sg: '알파룸 / 서재', sub: '기본', kind: 'FINISH', ess: false, it: '도배',          notes: '', optional: true },
  { sg: '알파룸 / 서재', sub: '기본', kind: 'FINISH', ess: false, it: '조명',          notes: '', optional: true },
  { sg: '알파룸 / 서재', sub: '기본', kind: 'FINISH', ess: false, it: '스위치 / 콘센트', notes: '', optional: true },
];

function buildSeedRows() {
  return ROWS.map((r, idx) => ({
    kind: r.kind,
    spaceGroup: r.sg,
    subgroup: r.sub,
    itemName: r.it,
    defaultSiteNotes: r.notes || null,
    essential: r.ess,
    orderIndex: idx,
    active: r.optional ? false : true, // 옵션 공간은 디폴트 비활성
  }));
}

module.exports = { buildSeedRows };
