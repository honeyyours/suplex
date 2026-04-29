// 회사 구독 등급 배지 — 사용 화면 헤더·설정 페이지에 작은 pill로 표시.
// STARTER / PRO / ENTERPRISE 색상 구분.
const PLAN_META = {
  STARTER:    { label: 'STARTER',    cls: 'bg-gray-200 text-gray-700' },
  PRO:        { label: 'PRO',        cls: 'bg-sky-100 text-sky-700' },
  ENTERPRISE: { label: 'ENTERPRISE', cls: 'bg-violet-100 text-violet-700' },
};

export default function PlanBadge({ plan, size = 'sm', className = '' }) {
  if (!plan) return null;
  const meta = PLAN_META[plan];
  if (!meta) return null;
  const sizeCls = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[11px] px-2 py-0.5';
  return (
    <span
      className={`inline-block rounded font-bold tracking-wider ${meta.cls} ${sizeCls} ${className}`}
      title={`현재 사용 중인 플랜: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}
