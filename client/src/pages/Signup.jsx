import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', name: '', companyName: '', phone: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || '회원가입 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-1">회원가입</h1>
        <p className="text-sm text-gray-500 mb-6">회사 대표 계정 생성</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="회사명" value={form.companyName} onChange={update('companyName')} required />
          <Field label="대표자 이름" value={form.name} onChange={update('name')} required />
          <Field label="이메일" type="email" value={form.email} onChange={update('email')} required />
          <Field label="비밀번호 (8자 이상)" type="password" value={form.password} onChange={update('password')} required minLength={8} />
          <Field label="연락처 (선택)" value={form.phone} onChange={update('phone')} />

          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
          >
            {busy ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-navy-700 font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...rest}
        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-navy-500 outline-none"
      />
    </div>
  );
}
