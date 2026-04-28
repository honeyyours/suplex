import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invitationsApi } from '../api/invitations';
import { ROLE_META } from '../api/team';

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { auth, acceptInvite, joinByInvite, logout } = useAuth();

  const [info, setInfo] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState({ name: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  useEffect(() => {
    let alive = true;
    invitationsApi.byToken(token)
      .then((data) => { if (alive) setInfo(data); })
      .catch((e) => {
        if (alive) setLoadErr(e.response?.data?.error || '초대 정보를 불러오지 못했습니다');
      });
    return () => { alive = false; };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitErr('');
    if (form.password.length < 8) {
      setSubmitErr('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (!form.name.trim()) {
      setSubmitErr('이름을 입력해주세요');
      return;
    }
    setBusy(true);
    try {
      await acceptInvite({
        token,
        name: form.name.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
      });
      navigate('/');
    } catch (e) {
      setSubmitErr(e.response?.data?.error || '가입 실패');
    } finally {
      setBusy(false);
    }
  }

  // 이미 로그인된 상태로 초대 링크 들어옴 — 이메일 일치 시 합류 흐름
  if (auth) {
    return <LoggedInJoinFlow info={info} loadErr={loadErr} auth={auth} token={token} joinByInvite={joinByInvite} logout={logout} navigate={navigate} />;
  }

  if (loadErr) {
    return (
      <Wrap>
        <h1 className="text-2xl font-bold text-rose-700 mb-2">초대 링크 사용 불가</h1>
        <p className="text-sm text-gray-600 mb-6">{loadErr}</p>
        <Link to="/login" className="block w-full text-center bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md">
          로그인으로
        </Link>
      </Wrap>
    );
  }

  if (!info) {
    return <Wrap><p className="text-sm text-gray-500">초대 정보 확인 중...</p></Wrap>;
  }

  const roleLabel = ROLE_META[info.role]?.label || info.role;

  return (
    <Wrap>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">👋</div>
        <h1 className="text-2xl font-bold text-navy-800 mb-1">
          <span className="text-navy-700">{info.companyName}</span>에 합류하세요
        </h1>
        <p className="text-sm text-gray-500">
          <b>{roleLabel}</b> 역할로 초대받으셨습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="이메일">
          <input
            value={info.email}
            disabled
            className="w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-500"
          />
        </Field>
        <Field label="이름 *">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
            autoFocus
            required
          />
        </Field>
        <Field label="비밀번호 (8자 이상) *">
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
            minLength={8}
            required
          />
        </Field>
        <Field label="연락처 (선택)">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="010-1234-5678"
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
          />
        </Field>

        {submitErr && <p className="text-sm text-rose-600">{submitErr}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
        >
          {busy ? '가입 중...' : '가입하고 합류하기'}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-6 text-center">
        이 초대 링크는 7일간 유효하며, 한 번 사용 후 자동으로 만료됩니다.
      </p>
    </Wrap>
  );
}

// 이미 로그인된 사용자가 초대 링크를 클릭한 경우의 합류 흐름
function LoggedInJoinFlow({ info, loadErr, auth, token, joinByInvite, logout, navigate }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (loadErr) {
    return (
      <Wrap>
        <h1 className="text-2xl font-bold text-rose-700 mb-2">초대 링크 사용 불가</h1>
        <p className="text-sm text-gray-600 mb-6">{loadErr}</p>
        <Link to="/" className="block w-full text-center bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md">
          홈으로
        </Link>
      </Wrap>
    );
  }
  if (!info) {
    return <Wrap><p className="text-sm text-gray-500">초대 정보 확인 중...</p></Wrap>;
  }

  const emailMatches = auth.user?.email?.toLowerCase() === info.email.toLowerCase();
  const roleLabel = ROLE_META[info.role]?.label || info.role;

  // 이메일 불일치 — 로그아웃 안내
  if (!emailMatches) {
    return (
      <Wrap>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">⚠️ 다른 이메일로 로그인 중</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          이 초대 링크는 <b>{info.email}</b>으로 발송됐습니다.
          현재 <b>{auth.user?.email}</b>로 로그인되어 있어요.
          <br /><br />
          초대받은 이메일로 가입·합류하려면 먼저 로그아웃해주세요.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => logout()}
            className="flex-1 bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md"
          >
            로그아웃
          </button>
          <Link
            to="/"
            className="flex-1 text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
      </Wrap>
    );
  }

  // 이메일 일치 — 합류 확인 화면
  async function handleJoin() {
    setBusy(true);
    setErr('');
    try {
      await joinByInvite(token);
      // 새 회사 컨텍스트로 이동 (Layout에서 회사 전환 드롭다운으로 다시 돌아갈 수 있음)
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || '합류 실패');
      setBusy(false);
    }
  }

  return (
    <Wrap>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🤝</div>
        <h1 className="text-2xl font-bold text-navy-800 mb-1">
          <span className="text-navy-700">{info.companyName}</span>에 합류하시겠어요?
        </h1>
        <p className="text-sm text-gray-500">
          <b>{roleLabel}</b> 역할로 초대받으셨습니다.
        </p>
      </div>

      <div className="bg-gray-50 border rounded p-4 mb-4 text-sm text-gray-700 leading-relaxed">
        합류하시면 <b>{auth.user?.name}</b>님은 <b>{info.companyName}</b>의 멤버가 되어
        그 회사 데이터에 접근할 수 있습니다. 기존 회사 소속은 그대로 유지되며,
        상단 회사명 옆 ▼ 버튼으로 회사를 전환할 수 있습니다.
      </div>

      {err && <p className="text-sm text-rose-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <Link
          to="/"
          className="flex-1 text-center border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50"
        >
          나중에
        </Link>
        <button
          onClick={handleJoin}
          disabled={busy}
          className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
        >
          {busy ? '합류 중...' : `${info.companyName}에 합류하기`}
        </button>
      </div>
    </Wrap>
  );
}

function Wrap({ children }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
