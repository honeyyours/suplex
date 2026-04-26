# 가전 규격 DB 계획서

생성일: 2026-04-26
대상: 냉장고·식기세척기 (Phase 1) — LG·삼성
목표: 모델명 입력 → 검증된 사이즈 자동 채움 / 100%에 가까운 정확도

## 0. 정확도 정의

수치적 100%가 아니라 **"디자이너가 신뢰하고 발주에 사용할 수 있는 수준"**.

| 잘못된 100% | 올바른 100% |
|---|---|
| 모든 모델 자동 채움 | 사용자가 모델 선택까지만 자동, 치수는 검증된 데이터만 표시 |
| 단일 소스로 끝 | 2개 이상 출처 일치 + 사용자 정정 가능 |
| 한 번 입력하고 끝 | 6개월마다 재검증, 단종 추적 |

핵심 명제: "자동 채움"이 아니라 "검증된 후보 선택" 모델로 가야 100% 가능.

## 1. 데이터 소스 (신뢰도 순)

| Tier | 소스 | 장점 | 단점 |
|---|---|---|---|
| 1. 제조사 공식 | LG.com/kr, Samsung.com/sec | 권위 있음, 단위 정확 | 단종 모델 X |
| 2. 제조사 PDF 카탈로그 | 대리점용 PDF (도면 포함) | 설치 도면 = 진실의 원천 | PDF 파싱 어려움 |
| 3. 다나와 | danawa.com 사양 비교표 | 단종 모델 포함 | 가끔 오기재 |
| 4. 쿠팡·11번가 | 상품 상세 페이지 | 인기 모델 신속 반영 | 판매자 입력 → 오기재 多 |
| 5. 사용 매뉴얼 PDF | 모델별 user manual | 설치 간극·콘센트 위치까지 정확 | 모델별 수집 부담 |

**전략:** Tier 1 + Tier 2 합의 → 골드 데이터. Tier 3로 단종 모델 보강.

## 2. 데이터 스키마 (Prisma)

```prisma
model ApplianceSpec {
  id             String   @id @default(cuid())
  category       String   // REFRIGERATOR | DISHWASHER | ...
  brand          String   // "LG" | "삼성"
  modelCode      String   @unique
  modelAliases   String[]
  productName    String

  widthMm        Int
  heightMm       Int
  depthMm        Int

  hingeOpenWidthMm  Int?
  ventTopMm         Int?
  ventSideMm        Int?
  ventBackMm        Int?

  doorType       String?
  capacityL      Int?
  builtIn        Boolean   @default(false)
  releaseYear    Int?
  discontinued   Boolean   @default(false)

  sources        Json
  consensusCount Int       @default(0)
  verifyStatus   String    // VERIFIED | PENDING | DISPUTED | USER_CORRECTED
  lastVerifiedAt DateTime?
  correctedById  String?
  correctedAt    DateTime?
  correctionNote String?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

핵심: `sources` JSON에 모든 출처 URL과 측정값 보존. 분쟁 시 추적 가능.

## 3. 100% 정확도 5가지 가드레일

### 가드레일 1: 다중 출처 합의 강제
- 3개 일치 → VERIFIED (높은 신뢰)
- 2개 일치 → VERIFIED (낮은 신뢰)
- 1개만 → PENDING (UI 경고)
- ±3mm 이상 차이 → DISPUTED (모든 출처 노출)

### 가드레일 2: 자동 채움 ≠ 자동 적용
- 모델명 타이핑 → 후보 5개 dropdown
- 선택 → 사이즈 미리보기 + 검증 chip
- 명시적 "이 사이즈로 채우기" 클릭해야 입력란 채움

### 가드레일 3: 사용자 정정 = 최고 우선순위
- 디자이너가 실측치 정정 → USER_CORRECTED (verified보다 위)
- 정정 사유 메모 보존
- 정정 즉시 반영 (글로벌 DB 정책)

### 가드레일 4: 출처 만료
- 6개월 경과 → 재검증 플래그
- 12개월 경과 → 자동 PENDING 강등

### 가드레일 5: 신뢰도 UI 노출
- ✅ VERIFIED (3출처) — 초록
- ✅ VERIFIED (2출처) — 초록
- ⚠️ PENDING — 노랑
- ❌ DISPUTED — 빨강 + 모든 후보 노출
- 🛠️ USER_CORRECTED — 파랑

→ 디자이너에게 출처와 신뢰도 항상 노출. 블랙박스 X.

## 4. 단계별 실행 계획

### Phase 1 — 인프라 구축 + 시드 50개 (1주)
- Prisma schema 추가
- API routes (CRUD + 검색 + 정정)
- Settings 어드민 UI (목록·추가·수정·검증)
- Material 입력 화면 통합 (APPLIANCE 그룹에서 모델 dropdown)
- 인기 모델 50개 수동 입력 (냉장고 30 + 식세기 20, LG 25 + 삼성 25)

### Phase 2 — 스크래퍼 자동 수집 (2주)
- LG·Samsung 공식사이트 스크래퍼
- 다나와 cross-check
- 자동 합의 알고리즘
- Disputed 항목 admin queue
- (선택) PDF 카탈로그 OCR

### Phase 3 — 자가증식 + 사용자 정정 루프 (지속)
- DB에 없는 모델 입력 → AI비서 검색 → 후보 제시
- 디자이너 검증 → PENDING 등록
- 다른 디자이너 사용 → cross-check → VERIFIED 승급
- 정정은 즉시 반영

## 5. 의사결정 사항 (확정)

1. **공유 정책**: 글로벌 DB (모든 회사 공유, 정정 이력 user 추적)
2. **단종 모델**: 포함하고 `discontinued` 플래그 표시
3. **빌트인/프리스탠딩**: 둘 다 지원, `builtIn` 플래그로 구분
4. **브랜드 Phase 1**: LG·삼성만
5. **데이터 출처 Phase 1**: 수동 입력만 (스크래핑 보류 — 법적 리스크 평가 후 Phase 2)

## 6. 시연 임팩트가 가장 큰 첫 화면

마감재 입력 (APPLIANCE 그룹) 안에서:

```
[가전 규격 자동 채움]
모델명: ┌─────────────────────────────────┐
        │ LG 디오스 매직스페이스 ▼          │
        ├─────────────────────────────────┤
        │ S634S30Q  양문형 800L  ✅검증됨   │
        │ S835S30Q  4도어 800L   ✅검증됨   │
        │ S634SB35  양문형 매직 ✅검증됨    │
        └─────────────────────────────────┘

선택 후 미리보기:
  가로: 832mm / 높이: 1850mm / 깊이: 738mm
  문 열림 폭: 1180mm
  통풍: 측면 50mm / 상부 30mm / 후면 60mm
  ✅ 검증됨 (LG공식 + 다나와 일치)

[이 사이즈로 채우기]  [출처 보기]  [내가 정정]
```

## 7. Phase 1 시작 순서

1. ✅ 계획서 저장 (이 파일)
2. ⏳ Prisma schema + 마이그레이션
3. ⏳ API routes (CRUD + 검색 + 정정)
4. ⏳ Settings 어드민 UI
5. ⏳ Material 입력 화면 통합
6. ⏳ 시드 50개 수동 입력 (도메인 전문가 작업)
