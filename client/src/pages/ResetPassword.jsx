import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordPolicy } from '../utils/passwordPolicy';
import api from '../api/client';

// 토큰 사전 검증 결과 상태:
// 'checking' — /reset-password/check 호출 중
// 'valid'    — 입력 가능
// 'invalid'  — 만료·사용됨·미존재
const REASON_MESSAGES = {
  missing: '링크에 토큰이 없습니다. 비밀번호 찾기를 다시 진행해주세요.',
  not_found: '유효하지 않은 링크입니다. 비밀번호 찾기를 다시 진행해주세요.',
  used: '이미 사용된 링크입니다. 비밀번호 찾기를 다시 진행해주세요.',
  expired: '만료된 링크입니다. 비밀번호 찾기를 다시 진행해주세요. (링크는 1시간 동안 유효합니다)',
};

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [checkStatus, setCheckStatus] = useState('checking');
  const [checkReason, setCheckReason] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setCheckStatus('invalid');
      setCheckReason('missing');
      return;
    }
    api.get('/auth/reset-password/check', { params: { token } })
      .then((r) => {
        if (!alive) return;
        if (r.data?.valid) {
          setCheckStatus('valid');
        } else {
          setCheckStatus('invalid');
          setCheckReason(r.data?.reason || 'not_found');
        }
      })
      .catch(() => {
        if (alive) {
          setCheckStatus('invalid');
          setCheckReason('not_found');
        }
      });
    return () => { alive = false; };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (newPassword !== confirm) {
      setErr('비밀번호 확인이 일치하지 않습니다');
      return;
    }
    const policyErr = checkPasswordPolicy(newPassword);
    if (policyErr) {
      setErr(policyErr);
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setErr(e.response?.data?.error || '비밀번호 변경에 실패했습니다');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200 mb-1">비밀번호 재설정</h1>
        <p className="text-sm text-gray-500 mb-6">새로 사용할 비밀번호를 입력해주세요 (8자 이상)</p>

        {checkStatus === 'checking' && (
          <p className="text-sm text-gray-500 text-center py-8">링크 확인 중...</p>
        )}

        {checkStatus === 'invalid' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 leading-relaxed">
              {REASON_MESSAGES[checkReason] || REASON_MESSAGES.not_found}
            </div>
            <Link
              to="/forgot-password"
              className="block w-full text-center bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md no-underline"
            >
              비밀번호 찾기 다시 진행
            </Link>
            <p className="text-sm text-gray-600 text-center">
              <Link to="/login" className="text-navy-700 font-medium hover:underline">← 로그인으로</Link>
            </p>
          </div>
        )}

        {checkStatus === 'valid' && done && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 leading-relaxed">
              <div className="font-semibold mb-1">비밀번호가 변경되었습니다</div>
              <div>잠시 후 로그인 화면으로 이동합니다.</div>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md no-underline"
            >
              지금 로그인하기
            </Link>
          </div>
        )}

        {checkStatus === 'valid' && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">새 비밀번호 (8자 이상)</label>
              <input
                type="password"
                required
                minLength={8}
                autoFocus
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
              />
            </div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button
              type="submit"
              disabled={busy || !newPassword || !confirm}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
            >
              {busy ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
