import { useState } from 'react';
import { vendorsApi } from '../api/vendors';
import { useEscape } from '../hooks/useEscape';

// Vendor의 시공팀 매핑 관리 모달 (Step 4 정정).
// - 연결됨: 시공팀 정보 + 해제
// - 미연결: 이미 가입된 시공팀 검색·연결 (목공 3:1 케이스 등)
//   * 새 시공팀 초대는 협력업체 탭 상단 "+ 시공팀 초대"(회사 단위)로 이전됨

export default function CrewLinkModal({ vendor, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [linkForm, setLinkForm] = useState({ email: '', nickname: '' });

  useEscape(true, onClose);

  const linked = vendor.linkedCrewUserId && vendor.linkedCrew;

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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:ring-1 dark:ring-white/5 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-navy-800 dark:text-navy-200">시공팀 매핑</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="text-sm text-gray-500 mb-5">
          {vendor.name} · <span className="text-xs">{vendor.category}</span>
        </div>

        {linked ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-xs text-emerald-700 mb-1">시공팀 동기화 중</div>
              <div className="font-semibold text-emerald-900">{vendor.linkedCrew.name}</div>
              {vendor.linkedCrew.nickname && (
                <div className="text-xs text-emerald-700 mt-0.5">@{vendor.linkedCrew.nickname}</div>
              )}
              <div className="text-xs text-emerald-700 mt-0.5">{vendor.linkedCrew.email}</div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              이 거래처로 잡힌 일정이 시공팀 캘린더에 자동 노출됩니다.
              해제하면 동기화가 중단되며 거래처 데이터는 그대로 유지됩니다.
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
        ) : (
          <form onSubmit={handleLink} className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              이미 가입한 시공팀 반장의 이메일·닉네임을 입력해 이 거래처에 연결합니다.
              <br />
              <span className="text-xs text-gray-500">
                ※ 새 시공팀을 초대하려면 협력업체 탭 상단 <b>"+ 시공팀 초대"</b>를 사용하세요.
              </span>
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
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2 rounded-md disabled:opacity-60 text-sm"
            >
              {busy ? '연결 중...' : '연결'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
