import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordPolicy } from '../utils/passwordPolicy';
import api from '../api/client';

// 가입 폼 가용성 체크 — 이메일/닉네임 단일 필드를 받아 서버에 확인.
// 반환 status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
async function checkAvailability(field, value) {
  try {
    const { data } = await api.get('/auth/check-availability', { params: { [field]: value } });
    if (data.reason === 'invalid_format') return 'invalid';
    return data.available ? 'available' : 'taken';
  } catch {
    return 'idle'; // 네트워크/레이트 리밋 — 가입 시점에 서버가 다시 검사
  }
}

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
    email: '', password: '', passwordConfirm: '', name: '', phone: '',
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
  const [emailStatus, setEmailStatus] = useState('idle');

  // 입력이 바뀌면 가용성 결과 초기화 — 사용자가 다시 blur 할 때까지 신뢰 X
  const update = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (k === 'email') setEmailStatus('idle');
  };

  async function onBlurEmail() {
    const v = form.email.trim();
    if (!v) return setEmailStatus('idle');
    setEmailStatus('checking');
    setEmailStatus(await checkAvailability('email', v));
  }

  function chooseType(type) {
    setAccountType(type);
    setStep(1);
    setErr('');
  }

  function validatePersonal() {
    if (!form.email.trim() || !form.password || !form.name.trim()) {
      return '이메일·비밀번호·이름을 모두 입력해주세요';
    }
    if (emailStatus === 'taken') return '이미 가입된 이메일입니다';
    if (emailStatus === 'invalid') return '이메일 형식이 올바르지 않습니다';
    const passwordErr = checkPasswordPolicy(form.password);
    if (passwordErr) return passwordErr;
    if (form.password !== form.passwordConfirm) return '비밀번호 확인이 일치하지 않습니다';
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
                    회사 직원으로 가입
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    회사 초대를 기다리거나, 라운지·루비 공유 커뮤니티 먼저 이용
                  </div>
                </div>
              </div>
            </button>

            <Link
              to="/crew/signup"
              className="block w-full text-left px-5 py-4 border-2 border-amber-200 dark:border-amber-900 hover:border-amber-400 dark:hover:border-amber-600 rounded-lg transition group no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔧</div>
                <div className="flex-1">
                  <div className="font-bold text-amber-900 dark:text-amber-200 group-hover:text-amber-950">
                    시공팀으로 가입
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    여러 거래 회사 일정을 한 캘린더에 모아 보고 팀과 공유 (무료)
                  </div>
                </div>
              </div>
            </Link>

            <p className="text-sm text-gray-600 mt-6 text-center">
              이미 계정이 있나요?{' '}
              <Link to="/login" className="text-navy-700 font-medium hover:underline">로그인</Link>
            </p>
          </div>
        )}

        {/* 1단계 — 개인 정보 (양쪽 공통) */}
        {step === 1 && (
          <form onSubmit={accountType === 'owner' ? goStep2 : submitGeneral} className="space-y-4">
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
            <Field
              label="비밀번호 확인 *"
              type="password"
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              required
              minLength={8}
              autoComplete="new-password"
              status={form.passwordConfirm && form.password !== form.passwordConfirm ? 'mismatch' : (form.passwordConfirm && form.password === form.passwordConfirm ? 'match' : 'idle')}
            />
            <Field label={accountType === 'owner' ? '대표자 이름 *' : '이름 *'} value={form.name} onChange={update('name')} required />
            <Field label="연락처 (선택)" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" />

            {/* 데이터 안전 약속 — 회사 기밀(견적·거래처·고객 정보)을 운영팀이 들여다본다는 의심이 도입 마찰 1순위 */}
            <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed space-y-3">
              <div className="font-semibold text-emerald-900 text-sm">
                데이터 안전 약속
              </div>
              <div>
                <div className="font-semibold mb-1">데이터 임의 열람 불가</div>
                <div>운영팀은 회사의 핵심 자산인 데이터(견적, 거래처, 고객 정보 등)를 절대 열람하지 않습니다.</div>
              </div>
              <div>
                <div className="font-semibold mb-1">투명한 접근 통제 및 즉시 알림</div>
                <div>CS 지원 요청 등으로 부득이하게 데이터 접근이 필요한 경우, 모든 내역이 감사 로그에 기록됩니다. 더불어 회사 대표자에게 즉시 알림이 발송되어 무단 사칭 접근을 원천 차단합니다.</div>
              </div>
              <div>
                <div className="font-semibold mb-1">철저한 비식별 통계 활용</div>
                <div>시스템 통계는 오직 비식별·총계 형태로만 안전하게 수집됩니다. 특정 기업을 식별할 수 있는 형태의 분석이나 외부 공유는 절대 발생하지 않습니다.</div>
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

function Field({ label, status, statusMessage, ...rest }) {
  const isOk = status === 'available' || status === 'match';
  const isBad = status === 'taken' || status === 'invalid' || status === 'mismatch';
  const tone =
    isOk ? 'text-emerald-600 dark:text-emerald-400' :
    isBad ? 'text-rose-600 dark:text-rose-400' :
    'text-gray-400';
  const borderTone =
    isOk ? 'border-emerald-400 focus:ring-emerald-400' :
    isBad ? 'border-rose-400 focus:ring-rose-400' :
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
             status === 'invalid' ? '✗ 형식 오류' :
             status === 'match' ? '✓ 일치' :
             status === 'mismatch' ? '✗ 불일치' : ''}
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
      : '닉네임은 2~20자의 한글·영문·숫자·공백·_·- 만 가능합니다.';
  }
  return '';
}
