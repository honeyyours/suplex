# Suplex 모바일 화면 자동 캡처

Puppeteer로 prod에 자동 로그인 → 9페이지 순회 → HTML + PNG 저장.
디자인 시안 작업 보조용.

## 1회 설정 (처음만)

```bash
cd scripts/screens
npm install   # puppeteer + chromium 다운로드 (약 280MB, 5분)
cp .env.example .env
```

`.env` 편집:
```
EXPORT_EMAIL=1988kbk@gmail.com
EXPORT_PASSWORD=<prod 비번>
EXPORT_BASE_URL=https://splex-mu.vercel.app
```

> `.env`는 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 실행

```bash
# 모바일 (기본, iPhone 14 Pro viewport 393×852)
npm run export

# 데스크톱 (1440×900)
npm run export:web
```

## 출력

`~/Desktop/suplex_screens_mobile_YYYY-MM-DD/` 안에:

- `01_home.html` `01_home.png`
- `02_schedule.html` `02_schedule.png`
- `03_projects.html` `03_projects.png`
- `04_project_internal.html` `04_project_internal.png` (첫 프로젝트 자동 선택)
- `05_orders.html` `05_orders.png`
- `06_expenses.html` `06_expenses.png`
- `07_ai_assistant.html` `07_ai_assistant.png`
- `08_team.html` `08_team.png`
- `09_lounge.html` `09_lounge.png`

## 트러블슈팅

- **로그인 실패** — 2FA가 켜져 있으면 자동 로그인 안 됩니다. 슈퍼어드민 콘솔에서 일시 해제 후 재시도.
- **chromium 다운로드 차단** — 회사 네트워크라면 `PUPPETEER_SKIP_DOWNLOAD=true` 환경변수로 스킵 후 시스템 Chrome 경로 지정 필요.
- **페이지 비어 보임** — `networkidle2` + 2.5초 대기인데, 데이터가 많으면 더 필요할 수 있음. `export-mobile-screens.mjs`의 `setTimeout 2500` 값 늘리기.
