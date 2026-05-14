// 베타 준비중 안내 — 회사가 APPROVED 외일 때 라운지 외 메뉴 접근 시 표시.
// 2026-05-14 정책: 미승인 회사도 내부 진입·라운지 활동 OK. 본 페이지는 라운지 외 메뉴 차단용.
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PendingApproval() {
  const { auth, logout, switchCompany, memberships } = useAuth();
  const [switching, setSwitching] = useState(null);

  // 60초마다 me 새로 받아 approvalStatus 변경 시 자동 진입
  useEffect(() => {
    const id = setInterval(() => { window.location.reload(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  // 다른 승인된 회사가 있으면 그쪽으로 전환 가능
  const otherApproved = (memberships || []).filter(
    (m) => m.companyId !== auth?.company?.id && m.approvalStatus === 'APPROVED'
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border rounded-xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h1 className="text-xl font-bold text-navy-800 mb-2">베타 준비중입니다</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          이 메뉴는 <b>회사 승인 후</b> 사용 가능합니다.<br/>
          관리자가 회사 가입을 검토하는 동안<br/>
          <b className="text-navy-700">라운지</b>에서 동료 인테리어 분들과<br/>
          노하우·루비·스케치업 자료를 자유롭게 즐겨보세요.
        </p>

        <Link
          to="/lounge"
          className="inline-block w-full text-sm font-medium px-4 py-2.5 bg-navy-700 text-white rounded hover:bg-navy-800 mb-3"
        >
          → 라운지로 이동
        </Link>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 leading-relaxed mb-4">
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
