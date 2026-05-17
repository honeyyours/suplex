import { useState } from 'react';
import { vendorsApi } from '../api/vendors';
import { useEscape } from '../hooks/useEscape';

// Vendor의 시공팀 연동 관리 모달. 상태에 따라 자동 분기:
// - 연결됨: 시공팀 정보 + 해제 버튼
// - 초대됨(미수락): 토큰 링크 다시 보기 + 폐기 + 재발급
// - 미연결: "새 시공팀 초대" / "기존 시공팀 연결" 두 액션

export default function CrewLinkModal({ vendor, onClose, onChanged }) {
  const [mode, setMode] = useState(null); // null | 'invite' | 'link'
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [linkForm, setLinkForm] = useState({ email: '', nickname: '' });
  const [copied, setCopied] = useState(false);

  useEscape(true, onClose);

  const linked = vendor.linkedCrewUserId && vendor.linkedCrew;
  const hasPendingInvite = !linked && vendor.crewInviteToken;

  async function handleInvite() {
    setBusy(true); setErr('');
    try {
      const { vendor: updated, inviteUrl: relativeUrl } = await vendorsApi.inviteCrew(vendor.id);
      const absoluteUrl = `${window.location.origin}${relativeUrl}`;
      setInviteUrl(absoluteUrl);
      onChanged?.();
    } catch (e) {
      setErr(e.response?.data?.error || '초대 발급 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const payload = {};
      if (linkForm.email.trim()) payload.email = linkForm.email.trim();
      else if (linkForm.nickname.trim()) payload.nickname = linkForm.nickname.trim();
      else { setErr('이메일 또는 닉네임을 입력하세요'); setBusy(false); return; }
      await vendorsApi.linkCrew(vendor.id, payload);
      onChanged?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || '연결 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    if (!confirm('시공팀 연결을 해제하시겠습니까?\n일정 자동 동기화가 중단됩니다.')) return;
    setBusy(true); setErr('');
    try {
      await vendorsApi.unlinkCrew(vendor.id);
      onChanged?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || '해제 실패');
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 폴백
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:ring-1 dark:ring-white/5 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-navy-800 dark:text-navy-200">시공팀 연동</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="text-sm text-gray-500 mb-5">
          {vendor.name} · <span className="text-xs">{vendor.category}</span>
        </div>

        {/* 연결됨 상태 */}
        {linked && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-xs text-emerald-700 mb-1">🔧 시공팀 동기화 중</div>
              <div className="font-semibold text-emerald-900">{vendor.linkedCrew.name}</div>
              {vendor.linkedCrew.nickname && (
                <div className="text-xs text-emerald-700 mt-0.5">@{vendor.linkedCrew.nickname}</div>
              )}
              <div className="text-xs text-emerald-700 mt-0.5">{vendor.linkedCrew.email}</div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              이 거래처로 잡힌 일정이 시공팀 캘린더에 자동 노출됩니다.
              목공팀처럼 한 반장에 여러 거래처(기공·조공 등)를 묶으시려면,
              다른 거래처에서 "기존 시공팀 연결"로 같은 계정을 지정하세요.
            </p>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button
              onClick={handleUnlink}
              disabled={busy}
              className="w-full border border-rose-300 text-rose-600 font-medium py-2 rounded-md hover:bg-rose-50 disabled:opacity-60 text-sm"
            >
              {busy ? '처리 중...' : '연결 해제'}
            </button>
          </div>
        )}

        {/* 초대됨 (미수락) 또는 신규 발급 직후 */}
        {!linked && (hasPendingInvite || inviteUrl) && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-700 mb-2 font-semibold">✉️ 초대 링크 발급됨 (7일 유효)</div>
              {inviteUrl ? (
                <div className="bg-white border border-amber-300 rounded p-2 text-xs break-all font-mono text-amber-900">
                  {inviteUrl}
                </div>
              ) : (
                <div className="text-xs text-amber-700">
                  링크를 다시 보려면 아래 "재발급"으로 새 토큰을 생성하세요.
                </div>
              )}
            </div>
            {inviteUrl && (
              <button
                onClick={() => copyToClipboard(inviteUrl)}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2 rounded-md text-sm"
              >
                {copied ? '✓ 복사됨 — 카톡으로 전달하세요' : '📋 링크 복사'}
              </button>
            )}
            <p className="text-xs text-gray-500 leading-relaxed">
              이 링크를 시공팀(반장)에게 카톡으로 전달하세요. 미가입이면 가입 후 자동 수락,
              이미 가입한 시공팀이면 1-탭으로 수락합니다.
            </p>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button
              onClick={handleUnlink}
              disabled={busy}
              className="w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50 disabled:opacity-60 text-sm"
            >
              {busy ? '처리 중...' : '초대 폐기'}
            </button>
          </div>
        )}

        {/* 미연결 — 두 액션 선택 */}
        {!linked && !hasPendingInvite && !inviteUrl && mode === null && (
          <div className="space-y-3">
            <button
              onClick={handleInvite}
              disabled={busy}
              className="w-full text-left px-4 py-3 border-2 border-amber-200 hover:border-amber-400 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔧</div>
                <div className="flex-1">
                  <div className="font-bold text-amber-900">새 시공팀 초대</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    초대 링크 발급 → 카톡으로 전달 → 시공팀이 가입·수락
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setMode('link')}
              disabled={busy}
              className="w-full text-left px-4 py-3 border-2 border-gray-200 hover:border-gray-400 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔗</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">기존 시공팀 연결</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    이미 가입한 반장 계정을 이메일·닉네임으로 검색해 연결
                  </div>
                </div>
              </div>
            </button>
            {err && <p className="text-sm text-rose-600">{err}</p>}
          </div>
        )}

        {/* 기존 시공팀 검색 폼 */}
        {!linked && !hasPendingInvite && !inviteUrl && mode === 'link' && (
          <form onSubmit={handleLink} className="space-y-3">
            <p className="text-sm text-gray-600">
              시공팀 반장의 이메일 또는 닉네임을 입력하세요.
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">이메일</label>
              <input
                type="email"
                value={linkForm.email}
                onChange={(e) => setLinkForm({ ...linkForm, email: e.target.value, nickname: '' })}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="crew@example.com"
              />
            </div>
            <div className="text-center text-xs text-gray-400">— 또는 —</div>
            <div>
              <label className="block text-xs font-medium mb-1">닉네임</label>
              <input
                value={linkForm.nickname}
                onChange={(e) => setLinkForm({ ...linkForm, nickname: e.target.value, email: '' })}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="김반장"
              />
            </div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMode(null); setErr(''); }}
                disabled={busy}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50 disabled:opacity-60 text-sm"
              >
                ← 이전
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-medium py-2 rounded-md disabled:opacity-60 text-sm"
              >
                {busy ? '연결 중...' : '연결'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
