# Suplex 디자인 시스템 적용률 감사

생성일: 2026-04-26  
대상: client/src/**/*.{jsx,css}, tailwind.config.js  
기준: Figma "Suplex Design System v1" — 52 컬러 / 7 spacing / 7 radius / 9 텍스트 스타일

> **정정 (2026-04-26)**: 초기 집계에서 Navy·Gray의 shade 200/300/400/800이 orphan으로 잘못 분류됨. Primitives에는 navy/gray 둘 다 50~900 전체 10단계가 정의되어 있으므로 해당 459건을 매칭으로 재분류. 아래 표·항목은 정정 후 수치임.

## 종합 적용률

| 카테고리 | 매칭 / 전체 | 적용률 |
|---|---|---|
| HEX 색상 | 24/26 | 92.3% |
| Tailwind 컬러 클래스 | 1390/1586 | 87.7% |
| Spacing | 1813/2469 | 73.4% |
| Radius | 451/462 | 97.6% |
| Typography 조합 | 701/782 | 89.6% |
| **종합 평균** | — | **88.1%** |

## 1. HEX 색상

전체 사용: 26건 / 매칭: 24건 (92.3%)

### Top 30 (빈도순)

| Hex | 사용 횟수 | 매칭 |
|---|---|---|
| `#1e3a66` | 8 | ✅ navy/700 |
| `#d1d5db` | 7 | ✅ gray/300 |
| `#cbd5e1` | 1 | ❌ orphan |
| `#f1f5f9` | 1 | ❌ orphan |
| `#f0f4fa` | 1 | ✅ navy/50 |
| `#d9e2f0` | 1 | ✅ navy/100 |
| `#b3c5e1` | 1 | ✅ navy/200 |
| `#8da8d2` | 1 | ✅ navy/300 |
| `#5a7fb8` | 1 | ✅ navy/400 |
| `#3a5f9e` | 1 | ✅ navy/500 |
| `#2a4a80` | 1 | ✅ navy/600 |
| `#15294a` | 1 | ✅ navy/800 |
| `#0c1a33` | 1 | ✅ navy/900 |

### 고아 hex (Figma primitives 미매칭)

- `#cbd5e1` × 1 — index.css
- `#f1f5f9` × 1 — index.css

## 2. Tailwind 컬러 클래스

전체 사용: 1586건 / 매칭: 1390건 (87.7%)

### Top 40 (빈도순)

| 클래스 | 사용 횟수 | 매칭 |
|---|---|---|
| `text-gray-400` | 170 | ✅ in-system |
| `text-gray-500` | 163 | ✅ in-system |
| `bg-gray-50` | 154 | ✅ in-system |
| `text-navy-800` | 107 | ✅ in-system |
| `bg-navy-700` | 73 | ✅ in-system |
| `text-gray-600` | 70 | ✅ in-system |
| `text-gray-700` | 63 | ✅ in-system |
| `text-navy-700` | 49 | ✅ in-system |
| `bg-gray-100` | 45 | ✅ in-system |
| `bg-navy-800` | 43 | ✅ in-system |
| `border-navy-700` | 33 | ✅ in-system |
| `text-red-600` | 32 | ❌ orphan |
| `bg-navy-50` | 31 | ✅ in-system |
| `text-gray-300` | 31 | ✅ in-system |
| `text-red-500` | 28 | ❌ orphan |
| `border-gray-200` | 28 | ✅ in-system |
| `text-emerald-700` | 26 | ✅ in-system |
| `border-navy-400` | 22 | ✅ in-system |
| `bg-emerald-50` | 21 | ✅ in-system |
| `text-gray-800` | 16 | ✅ in-system |
| `border-gray-300` | 15 | ✅ in-system |
| `bg-amber-100` | 13 | ✅ in-system |
| `bg-gray-200` | 13 | ✅ in-system |
| `bg-red-50` | 13 | ❌ orphan |
| `bg-emerald-100` | 12 | ✅ in-system |
| `text-amber-700` | 11 | ✅ in-system |
| `text-sky-700` | 10 | ✅ in-system |
| `text-amber-800` | 10 | ❌ orphan (amber 800 미정의) |
| `border-navy-500` | 10 | ✅ in-system |
| `bg-amber-50` | 10 | ✅ in-system |
| `bg-sky-100` | 9 | ✅ in-system |
| `text-red-700` | 9 | ❌ orphan |
| `ring-navy-500` | 9 | ✅ in-system |
| `border-emerald-300` | 9 | ❌ orphan (emerald 300 미정의) |
| `bg-red-100` | 8 | ❌ orphan |
| `text-emerald-600` | 8 | ✅ in-system |
| `accent-navy-700` | 8 | ✅ in-system |
| `text-navy-600` | 8 | ✅ in-system |
| `text-violet-700` | 8 | ✅ in-system |
| `bg-navy-100` | 7 | ✅ in-system |

### 고아 Tailwind 컬러 클래스 (정정 후)

> Navy·Gray는 50~900 전체 정의되어 있어 모두 매칭. 진짜 orphan은 (a) **status 컬러의 미정의 shade 200/300/400/800**, (b) **시스템에 없는 hue (red/blue/yellow/indigo/orange/pink/teal)** 두 종류임.

#### A. 미정의 hue (시스템 색상으로 치환 권장)

| 클래스 | 횟수 | 권장 치환 |
|---|---|---|
| `text-red-600` | 32 | `text-rose-600` |
| `text-red-500` | 28 | `text-rose-500` |
| `bg-red-50` | 13 | `bg-rose-50` |
| `text-red-700` | 9 | `text-rose-700` |
| `bg-red-100` | 8 | `bg-rose-100` |
| `border-red-300` | 6 | `border-rose-300` (단, rose-300은 미정의 → 검토) |
| `text-blue-500` | 5 | `text-sky-500` |
| `text-red-800` | 4 | `text-rose-800` |
| `bg-yellow-100` | 4 | `bg-amber-100` |
| `bg-yellow-50` | 2 | `bg-amber-50` |
| `bg-indigo-100` | 2 | `bg-violet-100` |
| `text-indigo-800` | 2 | `text-violet-800` (800 미정의) |
| `text-orange-700` | 2 | `text-amber-700` |
| `bg-blue-100` | 1 | `bg-sky-100` |
| `text-blue-800` | 1 | `text-sky-800` (800 미정의) |
| `bg-pink-100` | 1 | `bg-rose-100` |
| `text-pink-800` | 1 | `text-rose-800` |
| `text-yellow-800` | 1 | `text-amber-800` (800 미정의) |
| `bg-teal-100` | 1 | `bg-emerald-100` |
| `text-teal-800` | 1 | `text-emerald-800` (800 미정의) |
| `bg-orange-50` | 1 | `bg-amber-50` |
| `text-orange-600` | 1 | `text-amber-600` |
| `border-red-200` | 1 | `border-rose-200` (200 미정의) |
| `ring-red-400` | 1 | `ring-rose-400` (400 미정의) |
| `bg-red-600` | 1 | `bg-rose-600` |
| `bg-red-700` | 1 | `bg-rose-700` |

소계: 약 **127건** — 5종 hue (rose/sky/amber/violet/emerald) 안에서 모두 흡수 가능.

#### B. Status 컬러의 미정의 shade (200/300/400/800)

| 클래스 | 횟수 |
|---|---|
| `text-amber-800` | 10 |
| `border-emerald-300` | 9 |
| `text-emerald-800` | 6 |
| `text-sky-800` | 6 |
| `border-sky-200` | 5 |
| `text-violet-800` | 4 |
| `border-amber-200` | 3 |
| `border-emerald-200` | 3 |
| `border-amber-300` | 3 |
| `border-violet-300` | 2 |
| `bg-emerald-800` | 2 |
| `border-violet-400` | 2 |
| `text-rose-800` | 2 |
| `border-amber-400` | 1 |
| `bg-sky-300` | 1 |
| `bg-amber-300` | 1 |
| `border-violet-200` | 1 |
| `ring-amber-400` | 1 |
| `text-violet-400` | 1 |
| `bg-violet-400` | 1 |
| `bg-violet-800` | 1 |

소계: 약 **65건** — 빈도가 낮아 코드 일괄 치환 또는 Figma에 200/300/400/800 추가 검토.

## 3. Spacing

전체 사용: 2469건 / 매칭: 1813건 (73.4%)  
스케일: `4, 8, 12, 16, 24, 32, 48` px

### Top 30 (빈도순)

| 클래스 | px | 사용 횟수 | 매칭 |
|---|---|---|---|
| `px-2` | 8px | 309 | ✅ |
| `py-1.5` | 6px | 280 | ❌ |
| `py-2` | 8px | 230 | ✅ |
| `px-3` | 12px | 214 | ✅ |
| `py-1` | 4px | 133 | ✅ |
| `gap-2` | 8px | 122 | ✅ |
| `px-4` | 16px | 120 | ✅ |
| `py-0.5` | 2px | 79 | ❌ |
| `px-1.5` | 6px | 79 | ❌ |
| `py-3` | 12px | 71 | ✅ |
| `px-1` | 4px | 63 | ✅ |
| `gap-3` | 12px | 47 | ✅ |
| `p-4` | 16px | 41 | ✅ |
| `px-6` | 24px | 38 | ✅ |
| `mb-3` | 12px | 32 | ✅ |
| `gap-1` | 4px | 29 | ✅ |
| `mb-1` | 4px | 29 | ✅ |
| `py-4` | 16px | 25 | ✅ |
| `px-5` | 20px | 25 | ❌ |
| `py-2.5` | 10px | 23 | ❌ |
| `ml-2` | 8px | 22 | ✅ |
| `px-2.5` | 10px | 22 | ❌ |
| `mb-2` | 8px | 21 | ✅ |
| `gap-1.5` | 6px | 21 | ❌ |
| `mt-0.5` | 2px | 20 | ❌ |
| `mt-1` | 4px | 20 | ✅ |
| `mb-4` | 16px | 17 | ✅ |
| `space-y-4` | 16px | 16 | ✅ |
| `space-y-3` | 12px | 16 | ✅ |
| `py-8` | 32px | 13 | ✅ |

### 고아 spacing (스케일 외)

- `py-1.5` (6px) × 280
- `py-0.5` (2px) × 79
- `px-1.5` (6px) × 79
- `px-5` (20px) × 25
- `py-2.5` (10px) × 23
- `px-2.5` (10px) × 22
- `gap-1.5` (6px) × 21
- `mt-0.5` (2px) × 20
- `p-5` (20px) × 10
- `px-0` (0px) × 9
- `mb-0.5` (2px) × 9
- `py-16` (64px) × 7
- `mt-1.5` (6px) × 6
- `py-px` (1px) × 6
- `py-5` (20px) × 6
- `mb-1.5` (6px) × 5
- `ml-0.5` (2px) × 5
- `gap-0.5` (2px) × 4
- `space-y-5` (20px) × 4
- `mt-5` (20px) × 4
- `px-0.5` (2px) × 3
- `pb-0.5` (2px) × 3
- `gap-px` (1px) × 3
- `pl-0.5` (2px) × 3
- `pr-0` (0px) × 3
- `mx-0` (0px) × 3
- `space-y-0.5` (2px) × 2
- `space-y-1.5` (6px) × 2
- `p-1.5` (6px) × 2
- `pb-1.5` (6px) × 2
- `ml-1.5` (6px) × 1
- `pl-7` (28px) × 1
- `px-7` (28px) × 1
- `p-10` (40px) × 1
- `pb-5` (20px) × 1
- `mb-px` (1px) × 1

## 4. Radius

전체 사용: 462건 / 매칭: 451건 (97.6%)  
스케일: `0, 4, 6, 8, 12, 16, 9999` px

### 전체 (빈도순)

| 클래스 | px | 사용 횟수 | 매칭 |
|---|---|---|---|
| `rounded` | 4px | 288 | ✅ |
| `rounded-md` | 6px | 63 | ✅ |
| `rounded-xl` | 12px | 36 | ✅ |
| `rounded-lg` | 8px | 35 | ✅ |
| `rounded-full` | 9999px | 25 | ✅ |
| `rounded-sm` | 2px | 7 | ❌ |
| `rounded-bl-sm` | 2px | 3 | ❌ |
| `rounded-2xl` | 16px | 2 | ✅ |
| `rounded-t-2xl` | 16px | 1 | ✅ |
| `rounded-br-sm` | 2px | 1 | ❌ |
| `rounded-b-lg` | 8px | 1 | ✅ |

### 고아 radius

- `rounded-sm` (2px) × 7
- `rounded-bl-sm` (2px) × 3
- `rounded-br-sm` (2px) × 1

## 5. Typography

전체 사용: 782건 / 매칭: 701건 (89.6%)  
9 스타일: heading/xl(24/700) · heading/lg(20/700) · heading/md(18/600) · heading/sm(16/600) · body/lg(16/400) · body/md(14/400) · body/sm(12/400) · label/md(14/500) · caption(12/500)

### 전체 조합 (빈도순)

| size/weight | 사용 횟수 | 매칭 |
|---|---|---|
| 12/400 | 341 | ✅ body/sm |
| 14/400 | 300 | ✅ body/md |
| 14/500 | 21 | ✅ label/md |
| 18/700 | 19 | ❌ orphan |
| 14/600 | 14 | ❌ orphan |
| 12/600 | 12 | ❌ orphan |
| 12/500 | 11 | ✅ caption |
| 24/700 | 11 | ✅ heading/xl |
| 16/700 | 9 | ❌ orphan |
| 20/700 | 7 | ✅ heading/lg |
| 16/400 | 7 | ✅ body/lg |
| 12/700 | 5 | ❌ orphan |
| 18/600 | 3 | ✅ heading/md |
| 20/400 | 3 | ❌ orphan |
| 30/400 | 3 | ❌ orphan |
| 16/500 | 3 | ❌ orphan |
| 14/700 | 3 | ❌ orphan |
| 18/400 | 3 | ❌ orphan |
| 48/400 | 2 | ❌ orphan |
| 24/400 | 2 | ❌ orphan |
| 30/700 | 2 | ❌ orphan |
| 20/600 | 1 | ❌ orphan |

### 고아 조합

- `18/700` × 19 — 18px는 [600] weight만 정의됨 (700는 미정의)
- `14/600` × 14 — 14px는 [400, 500] weight만 정의됨 (600는 미정의)
- `12/600` × 12 — 12px는 [400, 500] weight만 정의됨 (600는 미정의)
- `16/700` × 9 — 16px는 [600, 400] weight만 정의됨 (700는 미정의)
- `12/700` × 5 — 12px는 [400, 500] weight만 정의됨 (700는 미정의)
- `20/400` × 3 — 20px는 [700] weight만 정의됨 (400는 미정의)
- `30/400` × 3 — size 30px가 디자인 시스템에 없음
- `16/500` × 3 — 16px는 [600, 400] weight만 정의됨 (500는 미정의)
- `14/700` × 3 — 14px는 [400, 500] weight만 정의됨 (700는 미정의)
- `18/400` × 3 — 18px는 [600] weight만 정의됨 (400는 미정의)
- `48/400` × 2 — size 48px가 디자인 시스템에 없음
- `24/400` × 2 — 24px는 [700] weight만 정의됨 (400는 미정의)
- `30/700` × 2 — size 30px가 디자인 시스템에 없음
- `20/600` × 1 — 20px는 [700] weight만 정의됨 (600는 미정의)

## 권고사항 (정정 후)

### 1. Spacing — 6px와 2px가 가장 큰 격차

**`py-1.5` 280회 + `px-1.5` 79회 + `gap-1.5` 21회 + `mt-1.5` 6회 + 기타 = 약 400+ (6px)**  
인라인 편집 셀, 컴팩트 버튼, 칩 등에 6px 패딩이 광범위하게 정착됨. **`6`을 spacing 스케일에 추가** (`4, 6, 8, 12, 16, 24, 32, 48` 8단계) 권장.

**`py-0.5` 79회 + `mt-0.5` 20회 + `mb-0.5` 9회 + 기타 = 약 130+ (2px)**  
초소형 chip, badge 내부 패딩에 2px 사용. 디자인 검토 후 `2`를 추가하거나 `4`로 흡수.

**`px-5` 25회 + `py-2.5` 23회 + `px-2.5` 22회 = 70+ (10·20px)**  
중간 크기 버튼/입력에 사용. `8`/`12` 중 하나로 흡수 또는 `10`/`20` 추가 검토.

→ 6px만 추가해도 spacing 적용률 73.4% → **약 90%** 도달

### 2. Tailwind 컬러 — hue 통일과 200/300/400/800 추가 검토

**A. red/blue/yellow/indigo/orange/pink/teal → 시스템 hue로 치환** (127건)
- `text-red-*` (73회) → `text-rose-*` (다크모드 CSS도 이미 red→rose 매핑 존재)
- `bg-yellow-*`, `bg-orange-*` → `bg-amber-*`
- `bg-blue-*` → `bg-sky-*`
- `bg-indigo-*` → `bg-violet-*`
- `bg-pink-*` → `bg-rose-*`
- `bg-teal-*` → `bg-emerald-*`

**B. status 컬러의 200/300/400/800** (65건)
빈도가 낮아 두 가지 선택지:
- (i) Figma status 컬러에 200/300/400/800 추가 (총 30개 → 50개) — primitives 무거워짐
- (ii) 코드에서 가까운 매칭(50/100/500/600/700)으로 치환 — 권장. 차이가 미미함.

### 3. Radius — 거의 완벽 (97.6%)
- `rounded-sm` (2px) 11건 → `rounded`(4px)로 치환 (시각 차이 미미). 적용 후 100%.

### 4. Typography — 18/700, 14/600, 12/600 등 weight 차이

| 조합 | 빈도 | 권장 |
|---|---|---|
| 18/700 | 19 | `heading/md` (18/600) 으로 weight 다운 — 또는 신규 스타일 추가 |
| 14/600 | 14 | `label/md` (14/500) 또는 신규 추가 |
| 12/600 | 12 | `caption` (12/500) 또는 신규 추가 |
| 16/700 | 9 | `heading/sm` (16/600) 으로 다운 |
| 30/400, 30/700, 48/400 | 7 | 24px / 24px(700) / 24px(700) 으로 흡수 |

→ 14/600, 12/600 같은 라벨 weight는 한국어 환경에서 **600이 가독성 더 좋다**는 판단이 있어 신규 스타일 추가 검토 권장.

### 우선순위 액션 (효과 큰 순)

1. **6px spacing 추가** — 단일 변경으로 spacing 적용률 +17%p
2. **red → rose 일괄 치환** — sed로 가능, 다크모드 정합 ↑
3. **typography 14/600, 12/600 신규 스타일 검토** — 한글 UI에서 자주 쓰는 weight
4. **rounded-sm → rounded 치환** — radius 100% 도달
5. **2px / 10px / 20px** — 빈도 낮으나 결정 필요. 추가 vs 흡수 정책 합의 필요
