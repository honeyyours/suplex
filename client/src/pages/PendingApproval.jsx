// 베타 진입 통제 — 회사가 APPROVED가 아닐 때 표시되는 안내 페이지.
// 정책: PENDING과 REJECTED 모두 동일한 "승인 대기 중" 메시지 (거절 사유 미공개).
// SUSPENDED도 동일 처리.
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function PendingApproval() {
  const { auth, logout, switchCompany, memberships } = useAuth();
  const [switching, setSwitching] = useState(null);

  // 베타 동안에는 자동 폴링으로 승인 상태 갱신 — 어드민이 승인하면 페이지 새로고침 없이 입장
  useEffect(() => {
    const handler = () => window.location.reload();
    const id = setInterval(() => {
      // 60초마다 페이지 reload — me 새로 받아 approvalStatus 변경 시 자동 진입
      handler();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // 다른 승인된 회사가 있으면 그쪽으로 전환 가능
  const otherApproved = (memberships || []).filter(
    (m) => m.companyId !== auth?.company?.id && m.approvalStatus === 'APPROVED'
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white border rounded-xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-navy-800 mb-2">승인 대기 중입니다</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          현재 수플렉스는 <b>클로즈 베타</b> 운영 중입니다.<br/>
          관리자가 회사 가입을 검토하고 있으며, 승인되면 자동으로 입장됩니다.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 leading-relaxed mb-6">
          📞 빠른 승인이 필요하시면<br/>
          <b className="text-amber-900">대표 연락처로 문의</b>해주세요.
        </div>

        {otherApproved.length > 0 && (
          <div className="border-t pt-4 mb-4">
            <div className="text-xs text-gray-500 mb-2">다른 승인된 회사로 전환:</div>
            <div className="space-y-1">
              {otherApproved.map((m) => (
                <button
                  key={m.companyId}
                  onClick={async () => {
                    setSwitching(m.companyId);
                    try {
                      await switchCompany(m.companyId);
                      window.location.href = '/';
                    } catch (e) {
                      alert('전환 실패: ' + (e.response?.data?.error || e.message));
                      setSwitching(null);
                    }
                  }}
                  disabled={switching === m.companyId}
                  className="w-full text-sm px-3 py-2 border rounded hover:bg-navy-50 disabled:opacity-50"
                >
                  {switching === m.companyId ? '전환 중…' : `→ ${m.companyName}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }}
          className="text-xs text-gray-500 hover:text-rose-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
