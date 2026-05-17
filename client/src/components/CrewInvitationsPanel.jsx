import { useEffect, useState } from 'react';
import { crewInvitationsApi } from '../api/vendors';
import { useEscape } from '../hooks/useEscape';

// 협력업체 탭 상단 — 회사 단위 시공팀 초대 발급·진행 중 목록.
// OWNER 전용. 클릭 시 새 초대 모달 + 진행 중 카드 인라인.

export default function CrewInvitationsPanel({ isOwner }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { invitations: list } = await crewInvitationsApi.list();
      setInvitations(list);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pending = invitations.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date());
  const expired = invitations.filter((i) => !i.acceptedAt && new Date(i.expiresAt) <= new Date());

  return (
    <div className="mb-6 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">🔧 시공팀 초대</div>
          <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            링크를 시공팀 반장에게 전달하면 가입·수락 즉시 협력업체로 자동 등록됩니다.
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowNew(true)}
            className="text-sm bg-navy-700 hover:bg-navy-800 text-white font-medium px-3 py-1.5 rounded-md"
          >
            + 시공팀 초대
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-500">불러오는 중...</div>
      ) : pending.length === 0 && expired.length === 0 ? (
        <div className="text-xs text-gray-500">진행 중인 초대가 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {pending.map((inv) => (
            <InvitationCard key={inv.id} invitation={inv} isOwner={isOwner} onChanged={load} />
          ))}
          {expired.map((inv) => (
            <InvitationCard key={inv.id} invitation={inv} isOwner={isOwner} expired onChanged={load} />
          ))}
        </ul>
      )}

      {showNew && (
        <NewInvitationModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}

function InvitationCard({ invitation, isOwner, expired, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/crew/invite/${invitation.token}`;
  const daysLeft = expired
    ? 0
    : Math.max(0, Math.ceil((new Date(invitation.expiresAt) - Date.now()) / (24 * 60 * 60 * 1000)));

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function remove() {
    if (!confirm('이 초대를 폐기하시겠습니까?')) return;
    setBusy(true);
    try { await crewInvitationsApi.remove(invitation.id); onChanged?.(); }
    catch (e) { alert(e.response?.data?.error || '폐기 실패'); }
    finally { setBusy(false); }
  }

  return (
    <li className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded p-3 flex items-center gap-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {expired ? (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500 border">만료</span>
          ) : (
            <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-800 border border-amber-300">
              D-{daysLeft}
            </span>
          )}
          <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
            {invitation.note || '(메모 없음)'}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mono truncate mt-0.5">{url}</div>
      </div>
      {!expired && (
        <button
          onClick={copy}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {copied ? '✓ 복사됨' : '📋 복사'}
        </button>
      )}
      {isOwner && (
        <button
          onClick={remove}
          disabled={busy}
          className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50 disabled:opacity-60"
        >
          폐기
        </button>
      )}
    </li>
  );
}

function NewInvitationModal({ onClose, onCreated }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null); // { invitation, inviteUrl }
  const [copied, setCopied] = useState(false);

  useEscape(true, onClose);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const data = await crewInvitationsApi.create({ note: note.trim() || null });
      const absoluteUrl = `${window.location.origin}${data.inviteUrl}`;
      setResult({ invitation: data.invitation, url: absoluteUrl });
    } catch (e) {
      setErr(e.response?.data?.error || '초대 발급 실패');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.url; document.body.appendChild(ta); ta.select();
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
          <h2 className="text-lg font-bold text-navy-800 dark:text-navy-200">시공팀 초대</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          링크를 카톡으로 보내면, 시공팀이 가입·수락 즉시 협력업체로 등록됩니다.
        </p>

        {!result ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">메모 (선택)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 타일 김반장"
                maxLength={80}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">누구에게 보냈는지 기억하기 위한 라벨. 시공팀에겐 보이지 않습니다.</p>
            </div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md disabled:opacity-60"
            >
              {busy ? '발급 중...' : '초대 링크 발급 (7일 유효)'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <div className="text-xs text-amber-700 mb-2 font-semibold">✉️ 초대 링크 발급됨</div>
              <div className="bg-white border border-amber-300 rounded p-2 text-xs break-all font-mono text-amber-900">
                {result.url}
              </div>
            </div>
            <button
              onClick={copy}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md"
            >
              {copied ? '✓ 복사됨 — 카톡으로 전달하세요' : '📋 링크 복사'}
            </button>
            <button
              onClick={onCreated}
              className="w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-50 text-sm"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
