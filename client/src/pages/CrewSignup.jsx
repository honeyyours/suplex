import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordPolicy } from '../utils/passwordPolicy';
import api from '../api/client';

// 시공팀(CREW) 별도 가입 — 회사 없이 시공팀 계정만 생성. (2026-05-17 양면 플랫폼 1차)
// Wedge·Lock·Moat 전략의 Moat(해자) 축. paying side 아님 — 풀 무료.
// 가입 후 다중 인테리어 회사 일정 통합 캘린더로 진입. 라우팅 분기는 후속 Step에서 처리.

async function checkAvailability(field, value) {
  try {
    const { data } = await api.get('/auth/check-availability', { params: { [field]: value } });
    if (data.reason === 'invalid_format') return 'invalid';
    return data.available ? 'available' : 'taken';
  } catch {
    return 'idle';
  }
}

export default function CrewSignup() {
  const { signupCrew } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', name: '', nickname: '', phone: '',
    crewCategory: '',
    crewBankAccount: '',
    crewDefaultUnitPrice: '',
    crewDefaultMeal: '',
    crewDefaultTransport: '',
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState('idle');
  const [nicknameStatus, setNicknameStatus] = useState('idle');

  const update = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (k === 'email') setEmailStatus('idle');
    if (k === 'nickname') setNicknameStatus('idle');
  };

  async function onBlurEmail() {
    const v = form.email.trim();
    if (!v) return setEmailStatus('idle');
    setEmailStatus('checking');
    setEmailStatus(await checkAvailability('email', v));
  }
  async function onBlurNickname() {
    const v = form.nickname.trim();
    if (!v) return setNicknameStatus('idle');
    setNicknameStatus('checking');
    setNicknameStatus(await checkAvailability('nickname', v));
  }

  function validate() {
    if (!form.email.trim() || !form.password || !form.name.trim() || !form.nickname.trim()) {
      return '이메일·비밀번호·이름·닉네임을 모두 입력해주세요';
    }
    if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(form.nickname.trim())) {
      return '닉네임은 2~20자의 한글·영문·숫자·_·-만 가능합니다';
    }
    if (emailStatus === 'taken') return '이미 가입된 이메일입니다';
    if (emailStatus === 'invalid') return '이메일 형식이 올바르지 않습니다';
    if (nicknameStatus === 'taken') return '이미 사용 중인 닉네임입니다';
    const passwordErr = checkPasswordPolicy(form.password);
    if (passwordErr) return passwordErr;
    if (!form.crewCategory.trim()) return '주 공종을 입력해주세요';
    if (!agreedTerms || !agreedPrivacy) return '이용약관과 개인정보처리방침에 모두 동의해주세요';
    return null;
  }

  function toNumberOrNull(s) {
    const v = String(s).trim();
    if (!v) return null;
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const v = validate();
    if (v) return setErr(v);
    setBusy(true);
    try {
      await signupCrew({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim() || undefined,
        crewCategory: form.crewCategory.trim(),
        crewBankAccount: form.crewBankAccount.trim() || null,
        crewDefaultUnitPrice: toNumberOrNull(form.crewDefaultUnitPrice),
        crewDefaultMeal: toNumberOrNull(form.crewDefaultMeal),
        crewDefaultTransport: toNumberOrNull(form.crewDefaultTransport),
      });
      // URL ?next= 가 있으면 그쪽으로 (초대 토큰 수락 흐름). 없으면 /crew.
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      navigate(next || '/crew');
    } catch (e) {
      setErr(e.response?.data?.error || '회원가입 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200 mb-1">시공팀 가입</h1>
        <p className="text-sm text-gray-500 mb-6">목수·타일·도배·전기 등 시공 작업자 전용</p>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed space-y-2">
          <div className="font-semibold text-sm">시공팀 계정 안내</div>
          <div>거래하는 인테리어 회사들이 잡아준 일정을 한 화면에서 확인합니다.</div>
          <div>팀 계정으로 가입하셔서 팀원과 공유하셔도 됩니다.</div>
          <div>광고·구독 결제 없습니다. 풀 무료로 사용하세요.</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="이메일 *"
            type="email"
            value={form.email}
            onChange={update('email')}
            onBlur={onBlurEmail}
            required
            autoComplete="email"
            status={emailStatus}
            statusMessage={availabilityMessage('email', emailStatus)}
          />
          <Field label="비밀번호 (8자 이상) *" type="password" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
          <Field label="이름 *" value={form.name} onChange={update('name')} required />
          <Field
            label="닉네임 *"
            value={form.nickname}
            onChange={update('nickname')}
            onBlur={onBlurNickname}
            required
            placeholder="라운지에 표시될 이름 (2~20자)"
            maxLength={20}
            status={nicknameStatus}
            statusMessage={availabilityMessage('nickname', nicknameStatus)}
          />
          <Field label="연락처 (선택)" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" />

          <div className="pt-3 border-t">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">시공팀 정보</div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              아래 4개(계좌·일당·식비·교통비)는 <b>비워두셔도 됩니다</b> — 나중에 본인 또는 거래 회사가 채울 수 있어요.
            </p>
            <div className="space-y-4">
              <Field
                label="주 공종 *"
                value={form.crewCategory}
                onChange={update('crewCategory')}
                required
                placeholder="예: 타일, 전기, 도배"
              />
              <Field
                label="계좌 (선택)"
                value={form.crewBankAccount}
                onChange={update('crewBankAccount')}
                placeholder="국민 123-45-678901 김반장"
              />
              <Field
                label="기본 일당 (선택)"
                value={form.crewDefaultUnitPrice}
                onChange={update('crewDefaultUnitPrice')}
                placeholder="250000"
                inputMode="numeric"
              />
              <Field
                label="식비 / 일 (선택)"
                value={form.crewDefaultMeal}
                onChange={update('crewDefaultMeal')}
                placeholder="10000"
                inputMode="numeric"
              />
              <Field
                label="교통비 / 일 (선택)"
                value={form.crewDefaultTransport}
                onChange={update('crewDefaultTransport')}
                placeholder="10000"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-gray-700">
                <Link to="/terms" target="_blank" className="text-navy-700 underline">이용약관</Link>에 동의합니다 <span className="text-rose-500">(필수)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-gray-700">
                <Link to="/privacy" target="_blank" className="text-navy-700 underline">개인정보처리방침</Link>에 동의합니다 <span className="text-rose-500">(필수)</span>
              </span>
            </label>
          </div>

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
        <p className="text-xs text-gray-500 mt-2 text-center">
          인테리어 회사 대표신가요?{' '}
          <Link to="/signup" className="text-navy-700 hover:underline">회사 대표로 가입</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, status, statusMessage, ...rest }) {
  const tone =
    status === 'available' ? 'text-emerald-600 dark:text-emerald-400' :
    status === 'taken' || status === 'invalid' ? 'text-rose-600 dark:text-rose-400' :
    'text-gray-400';
  const borderTone =
    status === 'available' ? 'border-emerald-400 focus:ring-emerald-400' :
    status === 'taken' || status === 'invalid' ? 'border-rose-400 focus:ring-rose-400' :
    'border focus:ring-navy-500';
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          {...rest}
          className={`w-full rounded-md px-3 py-2 outline-none focus:ring-2 ${borderTone}`}
        />
        {status && status !== 'idle' && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${tone}`}>
            {status === 'checking' ? '확인 중…' :
             status === 'available' ? '✓ 사용 가능' :
             status === 'taken' ? '✗ 사용 중' :
             status === 'invalid' ? '✗ 형식 오류' : ''}
          </span>
        )}
      </div>
      {statusMessage && (
        <p className={`mt-1 text-xs ${tone}`}>{statusMessage}</p>
      )}
    </div>
  );
}

function availabilityMessage(field, status) {
  if (status === 'taken') {
    return field === 'email'
      ? '이미 가입된 이메일입니다. 로그인하시거나 다른 이메일을 사용해주세요.'
      : '이미 사용 중인 닉네임입니다.';
  }
  if (status === 'invalid') {
    return field === 'email'
      ? '올바른 이메일 형식이 아닙니다.'
      : '닉네임은 2~20자의 한글·영문·숫자·_·- 만 가능합니다.';
  }
  return '';
}
