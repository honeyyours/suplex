import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { crewApi } from '../api/vendors';

// 시공팀 초대 토큰 수락 화면. URL: /crew/invite/:token
//
// 흐름 분기:
// 1) 미로그인  → 회사명 노출 + "가입 후 수락" / "로그인 후 수락" 버튼
// 2) CREW 로그인  → 1-탭 수락 → /crew로 이동
// 3) COMPANY 로그인  → 차단 안내 (회사 계정으론 시공팀 초대 수락 X). 로그아웃 후 시공팀 가입 안내.

export default function CrewInviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null); // { vendor, company }
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    crewApi.getInvitation(token)
      .then((data) => { if (alive) { setInvite(data); setLoading(false); } })
      .catch((e) => {
        if (!alive) return;
        setErr(e.response?.data?.error || '초대 정보를 불러올 수 없습니다');
        setLoading(false);
      });
    return () => { alive = false; };
  }, [token]);

  async function handleAccept() {
    setBusy(true); setErr('');
    try {
      await crewApi.acceptInvitation(token);
      navigate('/crew');
    } catch (e) {
      setErr(e.response?.data?.error || '수락 실패');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <CenterCard><div className="text-center text-gray-500">불러오는 중...</div></CenterCard>;
  }

  if (err && !invite) {
    return (
      <CenterCard>
        <div className="text-rose-600 font-semibold mb-2">초대를 확인할 수 없습니다</div>
        <div className="text-sm text-gray-600 mb-4">{err}</div>
        <Link to="/" className="text-sm text-navy-700 hover:underline">홈으로</Link>
      </CenterCard>
    );
  }

  const isCrew = auth?.user?.accountType === 'CREW';
  const isCompany = auth && !isCrew && !auth.isSuperAdmin;

  return (
    <CenterCard>
      <h1 className="text-xl font-bold text-navy-800 dark:text-navy-200 mb-1">시공팀 초대</h1>
      <p className="text-sm text-gray-500 mb-4">
        {invite.company.name}이(가) 시공팀으로 초대했습니다.
      </p>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 mb-5">
        <div className="font-semibold mb-1">{invite.company.name}</div>
        <div className="text-xs text-amber-700">
          거래처 등록: {invite.vendor.name}{invite.vendor.category ? ` · ${invite.vendor.category}` : ''}
        </div>
      </div>

      {/* 분기 1: 미로그인 */}
      {!auth && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            수락하려면 시공팀 계정이 필요합니다.
          </p>
          <Link
            to={`/crew/signup?next=${encodeURIComponent('/crew/invite/' + token)}`}
            className="block w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md text-center"
          >
            시공팀으로 가입하고 수락
          </Link>
          <Link
            to={`/login?next=${encodeURIComponent('/crew/invite/' + token)}`}
            className="block w-full border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md text-center hover:bg-gray-50"
          >
            로그인하고 수락
          </Link>
        </div>
      )}

      {/* 분기 2: CREW 로그인 */}
      {isCrew && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <b>{auth.user.name}</b> 계정으로 수락합니다.
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button
            onClick={handleAccept}
            disabled={busy}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
          >
            {busy ? '수락 중...' : '✓ 수락'}
          </button>
          <button
            onClick={() => { logout(); }}
            className="w-full text-xs text-gray-500 hover:underline"
          >
            다른 계정으로 수락하려면 로그아웃
          </button>
        </div>
      )}

      {/* 분기 3: COMPANY/슈퍼어드민 로그인 — 차단 */}
      {isCompany && (
        <div className="space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-900">
            현재 인테리어 회사 계정({auth.user.email})으로 로그인되어 있어요.
            시공팀 초대 수락은 <b>시공팀 계정</b>으로만 가능합니다.
          </div>
          <button
            onClick={() => { logout(); }}
            className="w-full border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50"
          >
            로그아웃하고 시공팀으로 가입
          </button>
        </div>
      )}
    </CenterCard>
  );
}

function CenterCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        {children}
      </div>
    </div>
  );
}
