// 기능 노출 점검 4단계 분류 표준 컴포넌트.
// variant: 'comingSoon' (준비 중) / 'planGate' (상위 등급) / 'betaCheck' (베타 검증 중).
// 큰 영역 placeholder + 잠긴 자리 안내 양쪽에 사용.
export default function ComingSoon({
  icon,
  title,
  description,
  items,
  variant = 'comingSoon',
  planLabel,
  ctaLabel,
  onCtaClick,
  compact = false, // true: 페이지 상단 안내 띠 형태(소형). false: 페이지 전체 placeholder(대형)
}) {
  const config = {
    comingSoon: {
      box: 'bg-gray-50 dark:bg-slate-900/40 border-gray-200 dark:border-slate-700 border-dashed',
      badge: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400',
      badgeLabel: '준비 중',
      title: 'text-navy-800 dark:text-navy-200',
      foot: '곧 구현 예정',
    },
    planGate: {
      box: 'bg-navy-50 dark:bg-navy-950/30 border-navy-200 dark:border-navy-800',
      badge: 'bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200',
      badgeLabel: planLabel ? `${planLabel} 기능` : '상위 등급 기능',
      title: 'text-navy-800 dark:text-navy-200',
      foot: '베타 동안 무료, 정식 출시 시 상위 등급 활성',
    },
    betaCheck: {
      box: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-800',
      badgeLabel: '베타 검증 중',
      title: 'text-amber-900 dark:text-amber-200',
      foot: '완성도를 끌어올리는 중입니다',
    },
  }[variant];

  if (compact) {
    return (
      <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${config.box}`}>
        <span className={`flex-shrink-0 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
          {config.badgeLabel}
        </span>
        <div className="flex-1 min-w-0 text-xs leading-relaxed">
          {title && <span className={`font-medium ${config.title}`}>{title}</span>}
          {description && <span className="text-gray-500 dark:text-gray-400 ml-1.5">{description}</span>}
        </div>
        {ctaLabel && (
          <button
            onClick={onCtaClick}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded bg-navy-700 text-white hover:bg-navy-800"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`text-center py-12 px-6 rounded-xl border ${config.box}`}>
      <div className="mb-3">
        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
          {config.badgeLabel}
        </span>
      </div>
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h2 className={`text-lg font-semibold mb-1.5 ${config.title}`}>{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {items && items.length > 0 && (
        <div className="max-w-md mx-auto text-left bg-white/70 dark:bg-slate-950/40 rounded-lg border border-gray-200 dark:border-slate-700 p-3 mb-4">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            {variant === 'planGate' ? '잠긴 기능' : '예정 기능'}
          </div>
          <ul className="space-y-1">
            {items.map((t, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2 leading-relaxed">
                <span className="text-gray-400">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ctaLabel && (
        <button
          onClick={onCtaClick}
          className="text-xs px-3 py-1.5 rounded bg-navy-700 text-white hover:bg-navy-800 mb-2"
        >
          {ctaLabel}
        </button>
      )}

      <div className="text-[11px] text-gray-400 mt-2">{config.foot}</div>
    </div>
  );
}
