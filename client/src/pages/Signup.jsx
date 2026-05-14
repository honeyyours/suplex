import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordPolicy } from '../utils/passwordPolicy';

// 가입 흐름 (2026-05-14 분기):
// step=0: 가입 유형 선택 (회사 대표 / 일반회원)
// step=1: 개인 정보 + 약관 동의 (양쪽 공통, 회사 가입은 회사명 입력으로 이어짐)
// step=2: 회사 정보 (회사 대표 가입만)
export default function Signup() {
  const { signup, signupGeneral } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(null); // 'owner' | 'general'
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: '', password: '', name: '', nickname: '', phone: '',
    companyName: '',
    companyBizNumber: '',
    companyRepresentative: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function chooseType(type) {
    setAccountType(type);
    setStep(1);
    setErr('');
  }

  function validatePersonal() {
    if (!form.email.trim() || !form.password || !form.name.trim() || !form.nickname.trim()) {
      return '이메일·비밀번호·이름·닉네임을 모두 입력해주세요';
    }
    if (!/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(form.nickname.trim())) {
      return '닉네임은 2~20자의 한글·영문·숫자·_·-만 가능합니다';
    }
    const passwordErr = checkPasswordPolicy(form.password);
    if (passwordErr) return passwordErr;
    if (!agreedTerms || !agreedPrivacy) return '이용약관과 개인정보처리방침에 모두 동의해주세요';
    return null;
  }

  async function submitGeneral(e) {
    e.preventDefault();
    setErr('');
    const v = validatePersonal();
    if (v) return setErr(v);
    setBusy(true);
    try {
      await signupGeneral({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim() || undefined,
      });
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || '회원가입 실패');
    } finally {
      setBusy(false);
    }
  }

  function goStep2(e) {
    e.preventDefault();
    setErr('');
    const v = validatePersonal();
    if (v) return setErr(v);
    setStep(2);
  }

  async function submitOwner(e) {
    e.preventDefault();
    setErr('');
    if (!form.companyName.trim()) {
      setErr('회사명을 입력해주세요');
      return;
    }
    setBusy(true);
    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim() || undefined,
        companyName: form.companyName.trim(),
        companyBizNumber: form.companyBizNumber.trim() || null,
        companyRepresentative: form.companyRepresentative.trim() || null,
        companyAddress: form.companyAddress.trim() || null,
        companyPhone: form.companyPhone.trim() || null,
        companyEmail: form.companyEmail.trim() || null,
      });
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || '회원가입 실패');
    } finally {
      setBusy(false);
    }
  }

  const totalSteps = accountType === 'owner' ? 2 : 1;

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow dark:ring-1 dark:ring-white/5 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200">회원가입</h1>
          {step > 0 && <span className="text-xs text-gray-400">{step}/{totalSteps}</span>}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {step === 0 && '가입 유형을 선택해주세요'}
          {step === 1 && (accountType === 'owner' ? '대표 개인 정보를 입력해주세요' : '개인 정보를 입력해주세요')}
          {step === 2 && '회사 정보를 입력해주세요 (견적서 갑지에 자동 사용)'}
        </p>

        {/* 진행 표시 — step 1 이상에서만 */}
        {step > 0 && (
          <div className="flex gap-1 mb-6">
            <div className="flex-1 h-1 bg-navy-700 rounded" />
            {totalSteps >= 2 && (
              <div className={`flex-1 h-1 rounded transition ${step >= 2 ? 'bg-navy-700' : 'bg-gray-200'}`} />
            )}
          </div>
        )}

        {/* 0단계 — 가입 유형 선택 */}
        {step === 0 && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => chooseType('owner')}
              className="w-full text-left px-5 py-4 border-2 border-navy-200 dark:border-navy-800 hover:border-navy-700 dark:hover:border-navy-500 rounded-lg transition group"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏢</div>
                <div className="flex-1">
                  <div className="font-bold text-navy-800 dark:text-navy-200 group-hover:text-navy-900">
                    회사 대표로 가입
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    인테리어 회사를 만들고 견적·일정·마감재 등 모든 기능 사용
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => chooseType('general')}
              className="w-full text-left px-5 py-4 border-2 border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 rounded-lg transition group"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">👤</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-900">
                    일반회원으로 가입
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    라운지·루비 공유 커뮤니티만 이용. 추후 회사 대표로 전환 가능
                  </div>
                </div>
              </div>
            </button>

            <p className="text-sm text-gray-600 mt-6 text-center">
              이미 계정이 있나요?{' '}
              <Link to="/login" className="text-navy-700 font-medium hover:underline">로그인</Link>
            </p>
          </div>
        )}

        {/* 1단계 — 개인 정보 (양쪽 공통) */}
        {step === 1 && (
          <form onSubmit={accountType === 'owner' ? goStep2 : submitGeneral} className="space-y-4">
            <Field label="이메일 *" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
            <Field label="비밀번호 (8자 이상) *" type="password" value={form.password} onChange={update('password')} required minLength={8} autoComplete="new-password" />
            <Field label={accountType === 'owner' ? '대표자 이름 *' : '이름 *'} value={form.name} onChange={update('name')} required />
            <Field
              label="닉네임 *"
              value={form.nickname}
              onChange={update('nickname')}
              required
              placeholder="라운지에 표시될 이름 (2~20자)"
              maxLength={20}
            />
            <Field label="연락처 (선택)" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" />

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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep(0); setAccountType(null); setErr(''); }}
                disabled={busy}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50 disabled:opacity-60"
              >
                ← 이전
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
              >
                {busy ? '가입 중...' : (accountType === 'owner' ? '다음 — 회사 정보' : '가입하기')}
              </button>
            </div>
          </form>
        )}

        {/* 2단계 — 회사 정보 (회사 대표만) */}
        {step === 2 && (
          <form onSubmit={submitOwner} className="space-y-4">
            <Field label="회사명 *" value={form.companyName} onChange={update('companyName')} required autoFocus placeholder="(주)리플레이스 디자인" />
            <Field label="사업자등록번호" value={form.companyBizNumber} onChange={update('companyBizNumber')} placeholder="123-45-67890" />
            <Field label="대표자명" value={form.companyRepresentative} onChange={update('companyRepresentative')} placeholder={`비워두면 "${form.name}"으로 자동 입력`} />
            <Field label="회사 주소" value={form.companyAddress} onChange={update('companyAddress')} placeholder="서울시 강남구 ..." />
            <Field label="회사 전화" value={form.companyPhone} onChange={update('companyPhone')} placeholder="02-1234-5678" />
            <Field label="회사 이메일" type="email" value={form.companyEmail} onChange={update('companyEmail')} placeholder={`비워두면 "${form.email}"으로 자동 입력`} />

            <p className="text-xs text-gray-500 leading-relaxed">
              회사명만 필수. 나머지는 건너뛰셔도 되며, 가입 후 <b>설정</b>에서 언제든 수정 가능합니다.
            </p>

            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50 disabled:opacity-60"
              >
                ← 이전
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
              >
                {busy ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </form>
        )}

        {step > 0 && (
          <p className="text-sm text-gray-600 mt-6 text-center">
            이미 계정이 있나요?{' '}
            <Link to="/login" className="text-navy-700 font-medium hover:underline">로그인</Link>
          </p>
        )}
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
