import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, verifyTotp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // TOTP 2단계 상태
  const [totpStep, setTotpStep] = useState(null); // { pendingToken, email } | null
  const [totpCode, setTotpCode] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const result = await login(email, password);
      if (result.needsTotp) {
        setTotpStep({ pendingToken: result.pendingToken, email: result.email || email });
        setTotpCode('');
      } else {
        navigate('/');
      }
    } catch (e) {
      setErr(e.response?.data?.error || '로그인 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleTotp(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await verifyTotp(totpStep.pendingToken, totpCode);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || '인증 실패');
    } finally {
      setBusy(false);
    }
  }

  function backToLogin() {
    setTotpStep(null);
    setTotpCode('');
    setErr('');
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        {!totpStep ? (
          <>
            <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200 mb-1">Suplex 로그인</h1>
            <p className="text-sm text-gray-500 mb-6">인테리어 프로젝트 운영 시스템</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
                />
              </div>
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
              >
                {busy ? '로그인 중...' : '로그인'}
              </button>
            </form>
            <p className="text-sm text-gray-600 mt-6 text-center">
              계정이 없나요?{' '}
              <Link to="/signup" className="text-navy-700 font-medium hover:underline">회원가입</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200 mb-1">2단계 인증</h1>
            <p className="text-sm text-gray-500 mb-6">
              {totpStep.email}<br/>
              인증 앱(Google Authenticator 등)에 표시된 6자리 숫자를 입력하세요.
            </p>
            <form onSubmit={handleTotp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">인증 코드</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456 또는 백업 코드"
                  className="w-full border rounded-md px-3 py-2 text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-navy-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">앱이 없으면 백업 코드(xxxxx-xxxxx)도 사용 가능합니다.</p>
              </div>
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <button
                type="submit"
                disabled={busy || !totpCode}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
              >
                {busy ? '확인 중...' : '확인'}
              </button>
              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >← 로그인 다시</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
