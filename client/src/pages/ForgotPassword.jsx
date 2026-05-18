import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setErr(e.response?.data?.error || '요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200 mb-1">비밀번호 찾기</h1>
        <p className="text-sm text-gray-500 mb-6">
          가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 leading-relaxed">
              <div className="font-semibold mb-1">메일을 발송했습니다</div>
              <div>
                <b>{email}</b> 으로 비밀번호 재설정 안내 메일을 보냈습니다. 메일함을 확인해주세요. 메일이 보이지 않으면 스팸함도 함께 확인해주세요. 링크는 1시간 동안 유효합니다.
              </div>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md no-underline"
            >
              로그인 화면으로
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                placeholder="example@suplex.kr"
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
              />
            </div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
            >
              {busy ? '발송 중...' : '재설정 링크 받기'}
            </button>
            <p className="text-sm text-gray-600 text-center pt-2">
              <Link to="/login" className="text-navy-700 font-medium hover:underline">← 로그인으로 돌아가기</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
