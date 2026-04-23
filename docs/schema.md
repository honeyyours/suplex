# Suplex DB 스키마 개요

Prisma schema: `server/prisma/schema.prisma`

## 테이블 목록

| 그룹 | 테이블 | 역할 |
|---|---|---|
| 계정 | `companies` | 회사 계정 |
| | `users` | 사용자 계정 |
| | `memberships` | 사용자-회사 연결 + 역할 (OWNER/DESIGNER/FIELD) |
| | `invitations` | 이메일 초대 토큰 |
| 협력업체 | `vendors` | 협력업체 (공종·단가·이력) |
| 프로젝트 | `projects` | 프로젝트 마스터 |
| | `project_checklists` | 단계별 체크리스트 |
| 마감재 | `materials` | 공간별 마감재 |
| | `material_history` | 변경 이력 |
| 공정 | `schedules` | 공정(묶음) |
| | `schedule_tasks` | 공종별 작업 (간트 단위) |
| | `task_photos` | 작업 사진 |
| 현장보고 | `daily_reports` | 일일 보고 |
| | `report_photos` | 보고 사진 |
| | `issues` | 이슈 등록 |
| 알림 | `notifications` | 카카오 알림톡 로그 |
| 수량 | `measurements` | 공간별 실측 데이터 |

## 역할(Role)
- **OWNER** (대표) — 전체 조회/수정/삭제
- **DESIGNER** (디자인팀) — 마감재/견적 수정
- **FIELD** (현장팀) — 현장보고/공정 체크

## 핵심 관계
- `Company 1 : N Project`
- `Company N : N User` (via `Membership`, with Role)
- `Project 1 : N Material / Schedule / DailyReport / Issue / Measurement`
- `Schedule 1 : N ScheduleTask`
- `Material 1 : N MaterialHistory`

## 중요 설계 결정
1. **멀티테넌시** — 모든 도메인 테이블은 `companyId` 또는 상위 `Project → Company` 경로로 소속 회사를 추적. API 레벨에서 현재 로그인 유저의 소속 회사로 필터링.
2. **cuid** — ID는 cuid 사용 (URL 안전 + 정렬 가능).
3. **연쇄 삭제** — 회사/프로젝트 삭제 시 하위 데이터 모두 `onDelete: Cascade`.
4. **금액/수량** — `Decimal` 사용 (소수점 오차 방지).
5. **이력 추적** — 마감재는 `MaterialHistory`로 모든 변경 기록. (프로젝트 전체 감사 로그는 Phase 2로 보류)
