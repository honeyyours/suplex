// PlanGuide — 등급별 잠긴 기능 가시화 컴포넌트
// 봉기님 핵심 발견(2026-05-17): 유료 전환 동기 형성의 진짜 레버.
// 사용자가 자기 등급보다 위 등급의 기능을 매 화면에서 자연 인식.
// FeatureGate(차단)와 별도 역할(유혹). 다크모드 옆 토글로 가시성 켜고 끔.
//
// 사용 예:
//   <PlanGuide tier="STARTER" mode="inline" />
//     → "STARTER에서 사용 가능" 작은 칩
//   <PlanGuide tier="PRO" mode="block"
//     title="회사 마감재 라이브러리"
//     desc="다른 프로젝트의 같은 공정 자재를 한 번에 끌어옵니다"
//   />
//     → 잠긴 영역 슬롯 (자물쇠 + 설명 + 등급 칩 + 업그레이드 버튼)
//   <PlanGuide tier="ENTERPRISE" mode="empty"
//     title="AI비서로 자연어 질문"
//     desc="역삼동 102동 마감재 미정 뭐 남았어?"
//   />
//     → 빈 상태 안내
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlanGuide } from '../contexts/PlanGuideContext';

const PLAN_RANK = { FREE: 0, STARTER: 1, PRO: 2, ENTERPRISE: 3 };

const TIER_META = {
  STARTER:    { label: 'STARTER',    chipClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  PRO:        { label: '프로',        chipClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  ENTERPRISE: { label: '엔터프라이즈', chipClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

export default function PlanGuide({ tier = 'PRO', mode = 'inline', title, desc, className = '' }) {
  const { auth } = useAuth();
  const { visible } = usePlanGuide();

  // 토글 OFF → 안 보임
  if (!visible) return null;

  // 자기 plan이 tier 이상이면 안 보임 (이미 사용 가능)
  const myPlan = auth?.company?.plan || 'PRO';
  const myRank = PLAN_RANK[myPlan] ?? 2;
  const tierRank = PLAN_RANK[tier] ?? 2;
  if (myRank >= tierRank) return null;

  const meta = TIER_META[tier] || TIER_META.PRO;

  if (mode === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.chipClass} ${className}`}>
        🔒 {meta.label} 기능
      </span>
    );
  }

  if (mode === 'empty') {
    return (
      <div className={`text-center py-8 px-4 ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 text-2xl mb-2">🔒</div>
        {title && <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</div>}
        {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">{desc}</div>}
        <Link
          to="/settings"
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${meta.chipClass} hover:opacity-80 transition`}
        >
          {meta.label}에서 사용 가능
        </Link>
      </div>
    );
  }

  // mode === 'block'
  return (
    <div className={`relative border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-gray-400 dark:text-gray-500 text-lg leading-none mt-0.5">🔒</div>
        <div className="flex-1 min-w-0">
          {title && <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{title}</div>}
          {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{desc}</div>}
          <Link
            to="/settings"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${meta.chipClass} hover:opacity-80 transition`}
          >
            {meta.label}에서 사용 가능 →
          </Link>
        </div>
      </div>
    </div>
  );
}
