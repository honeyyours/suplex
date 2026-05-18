import { useState, useEffect, useRef } from 'react';

// 베타 검증 중 기능에 부착하는 작은 인라인 배지.
// 클릭 시 피드백 입력 팝오버 — 봉기님 4단계 분류 중 B(70~90% 완성도) 표준 컴포넌트.
// 기능 노출 점검 메모리 + 가격정책 v8 4-bis 정합.
export default function BetaLabel({ feature, tone = 'amber', size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  const ref = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toneClass = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    gray: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200',
    navy: 'bg-navy-50 text-navy-700 border-navy-200 hover:bg-navy-100',
  }[tone];

  const sizeClass = size === 'xs'
    ? 'text-[9px] px-1 py-px'
    : 'text-[10px] px-1.5 py-0.5';

  function send() {
    if (!feedback.trim()) return;
    // 1차 시안: console 출력. 정식 구현은 BetaFeedback API 신설 후.
    // 향후 라운지 어드민 모더 시스템 또는 별도 BetaFeedback 모델로 통합.
    console.info(`[BETA feedback / ${feature}]`, feedback);
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setFeedback('');
      setSent(false);
    }, 1500);
  }

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
        className={`inline-flex items-center font-medium rounded-full border leading-none ml-1.5 transition ${toneClass} ${sizeClass}`}
        title={`${feature} — 베타 검증 중. 피드백 보내기`}
      >
        BETA
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            {feature} — 베타 검증 중
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
            이 기능은 완성도를 끌어올리는 중입니다. 사용해보시고 불편한 점·아이디어 보내주세요.
          </div>
          {sent ? (
            <div className="text-xs text-emerald-600 text-center py-3">피드백 전송 완료</div>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="피드백을 적어주세요"
                rows={3}
                className="w-full text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-navy-300"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs px-2.5 py-1 rounded text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={!feedback.trim()}
                  className="text-xs px-2.5 py-1 rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  보내기
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
