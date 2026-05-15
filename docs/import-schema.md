# 회사 자산 JSON 임포트 양식

수플렉스(Suplex)에 신규 인테리어 업체가 가입한 직후, 다른 AI(Claude·ChatGPT 등) 또는 수동으로 만든 JSON을 임포트해 자기 회사 자산을 즉시 채울 수 있도록 만든 양식입니다.

**대상 사용자:** Suplex 가입 회사 대표(OWNER). 다른 AI에게 이 문서를 통째로 주고 "우리 회사에 맞게 JSON을 만들어줘"라고 요청한 뒤, Suplex `설정 > 회사 자산 가져오기/내보내기`에서 업로드합니다.

**Seed 모드 동작:** 기존 데이터를 덮어쓰지 않고, 비어있는 자리에만 추가합니다. 같은 키워드/이름의 거래처·템플릿이 이미 있으면 자동 스킵합니다. 같은 파일을 두 번 임포트해도 데이터가 중복되지 않습니다.

---

## 1. 최상위 구조

```json
{
  "formatVersion": 1,
  "kind": "company-assets",
  "exportedAt": "2026-05-15T10:00:00.000Z",
  "sourceCompanyName": "리플레이스 디자인",
  "company": { ... },
  "vendors": [ ... ],
  "materialTemplates": [ ... ],
  "quoteLineItemTemplates": [ ... ],
  "phaseKeywordRules": [ ... ],
  "phaseDeadlineRules": [ ... ],
  "phaseAdvices": [ ... ],
  "companyPhaseTips": [ ... ],
  "accountCodes": [ ... ],
  "expenseCategoryRules": [ ... ]
}
```

| 필드 | 타입 | 필수 | 의미 |
|------|------|------|------|
| `formatVersion` | number | 권장 | 양식 버전. 현재 `1` |
| `kind` | string | 권장 | 반드시 `"company-assets"`. 다른 값이면 서버가 거부 |
| `exportedAt` | ISO8601 | 선택 | 생성 시각 (기록용) |
| `sourceCompanyName` | string | 선택 | 원본 회사 이름 (임포트 확인 다이얼로그에 표시) |
| 그 외 9개 섹션 | array/object | 모두 선택 | **부분 임포트 허용** — 일부 섹션만 있어도 OK |

**부분 임포트:** 거래처만 있는 JSON, 마감재 템플릿만 있는 JSON 모두 정상 동작합니다. 9개 섹션을 한 번에 다 만들 필요 없습니다.

---

## 2. `company` — 회사 메타 (선택)

> ⚠️ **Seed 모드에서는 무시됩니다.** 회사가 이미 본인의 견적 비율·라벨을 세팅했을 가능성이 높아 보호합니다. 이 섹션은 익스포트 시 참고용으로만 들어가며, 임포트 시에는 적용되지 않습니다.

```json
{
  "phaseLabels": { "WATERPROOF": "방수공사" },
  "hideExpenses": false,
  "rateDesign": "2.00",
  "rateVat": "10.00"
}
```

---

## 3. `vendors` — 거래처 (배열)

```json
[
  {
    "name": "동현타일",
    "category": "타일",
    "contact": "박동현",
    "phone": "010-1234-5678",
    "unitPrice": "150000",
    "unit": "㎡",
    "bankAccount": "국민 123-45-678901 박동현",
    "defaultMeal": "10000",
    "defaultTransport": "5000",
    "memo": "주문 후 3일 배송"
  }
]
```

| 필드 | 타입 | 필수 | 의미 |
|------|------|------|------|
| `name` | string | **필수** | 업체명 또는 작업자 본명 |
| `category` | string | **필수** | 공종(예: 타일, 도배, 목공, 전기, 설비) |
| `contact` | string | 선택 | 담당자명 |
| `phone` | string | 선택 | 전화번호 |
| `unitPrice` | number/string | 선택 | 단가(예: 일당, ㎡당) |
| `unit` | string | 선택 | 단위(㎡, 평, 개, 일 등) |
| `bankAccount` | string | 선택 | 계좌 1줄(인건비 정산 카톡 복사용. "은행 계좌번호 예금주" 형식) |
| `defaultMeal` | number/string | 선택 | 인건비 정산 시 기본 식비(1일) |
| `defaultTransport` | number/string | 선택 | 인건비 정산 시 기본 교통비(1일) |
| `memo` | string | 선택 | 자유 메모 |

**중복 키:** `(category, name)`이 같으면 스킵. 같은 회사가 두 명 있으면 둘 다 등록되지만, 같은 카테고리의 같은 이름이면 한 번만 들어갑니다.

---

## 4. `materialTemplates` — 마감재 템플릿 (배열)

```json
[
  {
    "kind": "FINISH",
    "spaceGroup": "거실",
    "subgroup": "바닥",
    "itemName": "강마루",
    "formKey": null,
    "defaultSiteNotes": "재단 후 폐기물 정리 필수",
    "essential": false,
    "orderIndex": 0,
    "active": true
  }
]
```

| 필드 | 타입 | 필수 | 의미 |
|------|------|------|------|
| `kind` | `"FINISH"` \| `"APPLIANCE"` | 선택 (기본 FINISH) | 마감재 / 가전 |
| `spaceGroup` | string | **필수** | 공간 그룹(거실, 안방, 주방, 욕실 등) |
| `subgroup` | string | 선택 | 세부 그룹(바닥, 벽, 천장, 조명 등) |
| `itemName` | string | **필수** | 항목명(강마루, 페인트, 타일 등) |
| `formKey` | string | 선택 | 폼 매핑 키(고급 기능, 비워두면 됨) |
| `defaultSiteNotes` | string | 선택 | 시공 특이사항 기본 조언 |
| `essential` | boolean | 선택 | 필수 항목 여부(legacy) |
| `orderIndex` | number | 선택 | 표시 순서 |
| `active` | boolean | 선택 | 활성 여부 |

**중복 키:** `(kind, spaceGroup, itemName)`이 같으면 스킵.

---

## 5. `quoteLineItemTemplates` — 견적 라인 마스터 (배열)

자주 쓰는 자재/단가를 저장해두고 견적 작성 시 가져와 사용합니다.

```json
[
  {
    "workType": "TILE",
    "itemName": "포세린 600x600",
    "spec": "유광/무광 선택",
    "unit": "㎡",
    "defaultQuantity": "1",
    "defaultMaterialPrice": "45000",
    "defaultLaborPrice": "30000",
    "defaultExpensePrice": "5000",
    "active": true,
    "orderIndex": 0
  }
]
```

| 필드 | 타입 | 필수 | 의미 |
|------|------|------|------|
| `workType` | string | **필수** | 공종 코드(아래 표 참고) |
| `itemName` | string | **필수** | 자재명 |
| `spec` | string | 선택 | 규격 |
| `unit` | string | 선택 | 단위 |
| `defaultQuantity` | number/string | 선택 | 기본 수량 (기본 1) |
| `defaultMaterialPrice` | number/string | 선택 | 자재비 |
| `defaultLaborPrice` | number/string | 선택 | 노무비 |
| `defaultExpensePrice` | number/string | 선택 | 경비 |
| `active` | boolean | 선택 | 활성 |
| `orderIndex` | number | 선택 | 순서 |

**workType 코드:** `DEMOLITION` 철거 / `WATERPROOF` 방수 / `CARPENTRY` 목공 / `ELECTRIC` 전기 / `PLUMBING` 설비 / `TILE` 타일 / `WALLPAPER` 도배 / `FLOORING` 마루 / `PAINT` 도장 / `KITCHEN` 주방 / `BATHROOM` 욕실 / `WINDOW` 창호 / `FURNITURE` 가구 / `APPLIANCE` 가전 / `LIGHTING` 조명 / `CLEANING` 청소 / `ETC` 기타. (정확한 25공정 enum은 운영팀에 문의)

**중복 키:** `(workType, itemName)`이 같으면 스킵.

---

## 6. `phaseKeywordRules` — 공정 키워드 룰 (배열)

일정 입력 시 키워드를 발견하면 자동으로 공종(phase)을 부여합니다.

```json
[
  { "keyword": "벽지", "phase": "도배", "active": true },
  { "keyword": "걸레받이", "phase": "목공", "active": true }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `keyword` | **필수** | 매칭 키워드(대소문자 무관, 부분 일치) |
| `phase` | **필수** | 부여할 공종(예: 도배, 목공, 타일) |
| `active` | 선택 | 활성 여부 |

**중복 키:** `(companyId, keyword)`가 같으면 스킵.

---

## 7. `phaseDeadlineRules` — 공정 데드라인 룰 (배열)

자재가 공정 시작 며칠 전에 도착해야 하는지(발주 데드라인).

```json
[
  { "phase": "타일", "daysBefore": 3, "active": true },
  { "phase": "마루", "daysBefore": 2, "active": true }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `phase` | **필수** | 공종명 |
| `daysBefore` | **필수** | 며칠 전(정수) |
| `active` | 선택 | 활성 여부 |

**중복 키:** `(companyId, phase)`가 같으면 스킵.

---

## 8. `phaseAdvices` — 공정별 사전 어드바이스 (배열)

일정 등록 시 시작일 며칠 전에 자동으로 체크리스트가 생성됩니다.

```json
[
  {
    "phase": "철거",
    "ruleType": "STANDARD",
    "daysBefore": 7,
    "title": "관리실 보양·소음 양해 협의",
    "description": "엘리베이터 보양 신청 + 인접 세대 사전 안내",
    "category": "관리실 협의",
    "requiresPhoto": false,
    "active": true
  }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `phase` | **필수** | 공종명 |
| `ruleType` | 선택 (기본 STANDARD) | 항상 `"STANDARD"`. `UNCONFIRMED_CHECK` 시스템 룰은 임포트 거부 |
| `daysBefore` | **필수** | 시작 며칠 전 (음수면 시작 후, 0이면 당일) |
| `title` | **필수** | 체크리스트 항목 제목 |
| `description` | 선택 | 상세 설명 |
| `category` | 선택 | 분류(안전, 자재, 관리실 협의, 사전 준비 등) |
| `requiresPhoto` | 선택 | 사진 첨부 필수 여부 |
| `active` | 선택 | 활성 여부 |

**중복 키:** `(phase, daysBefore, title)`이 같으면 스킵.

---

## 9. `companyPhaseTips` — 공정별 견적 가이드 (배열)

견적 작성 시 공종별로 회사 내부 메모(견적 기준·주의사항)를 표시합니다.

```json
[
  {
    "phase": "타일",
    "body": "포세린 600x600 기준 ㎡당 자재 45,000원 / 시공비 30,000원. 1.5룸 평균 8평."
  },
  {
    "phase": "GENERAL",
    "body": "기본 견적 정책: 부가세 별도, 견적 유효기간 30일"
  }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `phase` | **필수** | 공종명 또는 `"GENERAL"`(공통) |
| `body` | **필수** | 가이드 본문(여러 줄 OK) |

**중복 키:** `(companyId, phase)`가 같으면 스킵.

---

## 10. `accountCodes` — 회계 계정과목 (배열)

```json
[
  { "id": "acc_001", "code": "[현장] 자재비", "groupName": "현장", "active": true, "orderIndex": 0 },
  { "id": "acc_002", "code": "[본사] 복리후생비", "groupName": "본사", "active": true, "orderIndex": 1 }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `id` | 선택 | 임포트 시 내부 매핑용 임시 ID. 다음 섹션 `expenseCategoryRules.accountCodeId`가 이 값을 참조하면 자동 연결됩니다 |
| `code` | **필수** | 계정과목명(예: "[본사] 복리후생비", "[현장] 자재비") |
| `groupName` | 선택 | 분류(본사 / 현장 / 대표 / 매출 / 자금 / 기타) |
| `active` | 선택 | 활성 여부 |
| `orderIndex` | 선택 | 표시 순서 |

**중복 키:** `(companyId, code)`가 같으면 스킵.

> ℹ️ 회계 영역은 정책상 향후 폐기 검토 중입니다. 추가가 필수는 아닙니다.

---

## 11. `expenseCategoryRules` — 지출 자동분류 룰 (배열)

CSV 통장 가져오기 시 키워드로 계정/현장/공종 자동 설정.

```json
[
  {
    "keyword": "동현타일",
    "accountCodeId": "acc_001",
    "siteCode": null,
    "workCategory": "타일",
    "priority": 10,
    "active": true
  }
]
```

| 필드 | 필수 | 의미 |
|------|------|------|
| `keyword` | **필수** | 매칭 키워드(대소문자 무관, contains) |
| `accountCodeId` | 선택 | 위 `accountCodes`의 `id` 값을 그대로 적으면 임포트 시 자동 연결 |
| `siteCode` | 선택 | 자동 설정할 현장(Project.siteCode) |
| `workCategory` | 선택 | 자동 설정할 공종 |
| `priority` | 선택 | 충돌 시 우선순위(높을수록 우선) |
| `active` | 선택 | 활성 여부 |

**중복 키:** `(companyId, keyword)`가 같으면 스킵.

---

## 12. 데이터 타입 가이드

- **숫자:** 문자열 또는 number 둘 다 허용. `"150000"` 또는 `150000` 모두 OK
- **불리언:** `true` / `false` 또는 생략 (생략 시 기본값 적용)
- **null:** 선택 필드는 `null` 또는 생략 가능
- **줄바꿈:** `body`·`description` 등 긴 텍스트는 `\n`으로 줄바꿈

---

## 13. 자주 묻는 질문

**Q. 같은 파일을 두 번 임포트하면 데이터가 두 배가 되나요?**
A. 아닙니다. 모든 섹션이 중복 검사를 거치므로 두 번째는 모두 스킵됩니다.

**Q. 일부 섹션만 만들어도 되나요?**
A. 네. 거래처만 있는 JSON, 마감재 템플릿만 있는 JSON 모두 정상 동작합니다.

**Q. 견적 비율(rate*)을 임포트로 덮어쓸 수 있나요?**
A. Seed 모드에서는 보호됩니다. 회사가 본인의 설정값을 갖고 있을 가능성이 높기 때문입니다. 직접 변경은 `설정 > 견적 기본 비율`에서 하세요.

**Q. 프로젝트·일정·지출 같은 데이터는 왜 안 들어가나요?**
A. 이 양식은 "회사 자산"(반복 사용되는 설정·템플릿)만 다룹니다. 프로젝트·일정·지출 같은 운영 데이터는 사용자 ID에 묶여 있어 다른 회사에 그대로 옮길 수 없습니다.

**Q. 양식을 어떻게 외부 AI에게 줘야 하나요?**
A. 이 문서 전체를 복사해 ChatGPT/Claude에 붙여넣고 "이 양식대로 우리 회사용 회사 자산 JSON을 만들어줘. 회사 정보: 회사명 ○○, 주력 분야 ○○, 자주 쓰는 거래처 ..." 식으로 추가 정보만 주시면 됩니다.

---

## 14. 샘플 JSON

`docs/sample-company-seed.json` 파일을 참고하세요. 인테리어 회사 1곳을 가정한 더미 데이터입니다. 외부 AI에 같이 첨부하시면 형식 일치율이 더 높아집니다.
