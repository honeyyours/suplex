import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invitationsApi } from '../api/invitations';
import { ROLE_META } from '../api/team';

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { auth, acceptInvite, logout } = useAuth();

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

  // 이미 로그인된 상태로 초대 링크 들어옴 — 베타엔 단순 로그아웃 안내
  if (auth) {
    return (
      <Wrap>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">⚠️ 다른 계정으로 로그인 중입니다</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          초대 링크는 새 계정 가입용입니다. 현재 <b>{auth.user?.email}</b>로 로그인되어 있어요.
          새 계정으로 가입하시려면 먼저 로그아웃해주세요.
          <br /><br />
          (정식 출시 후에는 로그인된 상태에서 다른 회사로 합류하는 흐름이 추가될 예정입니다.)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { logout(); }}
            className="flex-1 bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md"
          >
            로그아웃하고 가입 진행
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
