# Suplex (슈플렉스)

소규모 인테리어 업체(1~10인)를 위한 프로젝트 운영 SaaS.

## 구조 (Monorepo)

```
suplex/
├── client/     # React + Vite + Tailwind
├── server/     # Node + Express + Prisma + PostgreSQL
└── docs/       # 문서, DB 스키마 등
```

## 기술 스택

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, Prisma, PostgreSQL, JWT
- **Deploy**: Vercel (client) + Railway (server + DB)
- **알림**: Solapi (카카오 알림톡)

## 로컬 실행

### 1. 백엔드
```bash
cd server
npm install
cp .env.example .env   # DB URL 등 입력
npx prisma migrate dev
npm run dev
```

### 2. 프론트엔드
```bash
cd client
npm install
npm run dev
```

## 사용자 역할
- **대표** — 전체 조회·수정·삭제
- **디자인팀** — 마감재·견적 수정
- **현장팀** — 현장보고·공정 체크
