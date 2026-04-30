import { useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import { teamApi, ROLE_META } from '../api/team';
import { useAuth } from '../contexts/AuthContext';

// 프로젝트 멤버(LEAD/MEMBER) 관리 모달 — 오픈 디폴트 (2026-04-30)
// 정책: 같은 회사 멤버는 모든 프로젝트 보기·작업 가능 (오픈 디폴트).
// 이 모달은 "LEAD 지정"과 "DELETE/멤버관리 권한 부여"용. LEAD가 같은 회사 멤버를 추가/제거/역할 변경.
// OWNER는 행 없어도 자동 풀권한(우회 룰). 정식 출시 후 팀 단위 분리 시 진화.
export default function ProjectMembersModal({ projectId, onClose }) {
  const { auth } = useAuth();
  const [members, setMembers] = useState([]);
  const [companyMembers, setCompanyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('MEMBER');

  const myUserId = auth?.user?.id;
  const isOwner = auth?.role === 'OWNER';
  const myMembership = members.find((m) => m.userId === myUserId);
  const isLead = isOwner || myMembership?.role === 'LEAD';

  async function load() {
    setLoading(true);
    try {
      const [{ members: ms }, { members: cms }] = await Promise.all([
        projectsApi.listMembers(projectId),
        teamApi.list().catch(() => ({ members: [] })),
      ]);
      setMembers(ms || []);
      setCompanyMembers(cms || []);
    } catch (e) {
      alert('멤버 목록을 불러올 수 없습니다: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId]);

  async function add() {
    if (!newUserId) { alert('추가할 멤버를 선택하세요'); return; }
    setBusy(true);
    try {
      await projectsApi.addMember(projectId, { userId: newUserId, role: newRole });
      setAdding(false);
      setNewUserId('');
      setNewRole('MEMBER');
      load();
    } catch (e) {
      alert('추가 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  async function changeRole(userId, role) {
    setBusy(true);
    try {
      await projectsApi.updateMember(projectId, userId, { role });
      load();
    } catch (e) {
      alert('변경 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  async function remove(userId, name) {
    if (!confirm(`${name || '이 멤버'}를 프로젝트에서 제거할까요?`)) return;
    setBusy(true);
    try {
      await projectsApi.removeMember(projectId, userId);
      load();
    } catch (e) {
      alert('제거 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  // teamApi.list() 응답 필드는 { userId, name, email, role, ... } — `id`가 아님
  // 회사 OWNER들 — ProjectMember 행 없어도 풀권한(우회 룰)이라 항상 표시
  const memberUserIds = new Set(members.map((m) => m.userId));
  const virtualOwners = companyMembers
    .filter((cm) => cm.role === 'OWNER' && !memberUserIds.has(cm.userId))
    .map((o) => ({
      userId: o.userId,
      role: '__OWNER_AUTO__',
      user: { id: o.userId, name: o.name, email: o.email },
      _virtual: true,
    }));
  const displayMembers = [...virtualOwners, ...members];

  // 추가 후보 = 회사 멤버 중 아직 프로젝트 멤버 아닌 사람 (가상 OWNER 포함해서 제외)
  const allDisplayUserIds = new Set(displayMembers.map((m) => m.userId));
  const candidates = companyMembers.filter((cm) => !allDisplayUserIds.has(cm.userId));

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">프로젝트 팀</h2>
          <div className="text-xs text-gray-500 mt-1">
            회사 멤버 모두 모든 프로젝트를 볼 수 있습니다. 이 화면에서 지정한 LEAD는 해당 프로젝트의 멤버 추가·제거와 삭제 권한을 갖습니다. 회사 대표(OWNER)는 자동 풀권한.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

          {!loading && displayMembers.length === 0 && (
            <div className="text-sm text-gray-400 py-6 text-center">멤버가 없습니다.</div>
          )}

          {!loading && displayMembers.length > 0 && (
            <ul className="divide-y">
              {displayMembers.map((m) => {
                const isVirtualOwner = m._virtual === true;
                const cm = companyMembers.find((x) => x.userId === m.userId);
                const roleMeta = cm ? (ROLE_META[cm.role] || ROLE_META.DESIGNER) : null;
                const canRemove = !isVirtualOwner && isLead && m.userId !== myUserId;
                const canDemote = !isVirtualOwner && isLead && m.role === 'LEAD' && members.filter((x) => x.role === 'LEAD').length > 1;
                const canPromote = !isVirtualOwner && isLead && m.role === 'MEMBER';
                return (
                  <li key={m.userId} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-800 truncate">{m.user?.name || m.user?.email || m.userId}</span>
                        {isVirtualOwner && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200" title="회사 대표는 모든 프로젝트에 자동 풀권한이 있습니다">
                            👑 회사 대표 (자동 풀권한)
                          </span>
                        )}
                        {!isVirtualOwner && m.role === 'LEAD' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200">👑 LEAD</span>
                        )}
                        {!isVirtualOwner && roleMeta && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${roleMeta.color}`}>{roleMeta.label}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{m.user?.email}</div>
                    </div>
                    {isLead && !isVirtualOwner && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {canPromote && (
                          <button onClick={() => changeRole(m.userId, 'LEAD')} disabled={busy}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">
                            LEAD로
                          </button>
                        )}
                        {canDemote && (
                          <button onClick={() => changeRole(m.userId, 'MEMBER')} disabled={busy}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">
                            MEMBER로
                          </button>
                        )}
                        {canRemove && (
                          <button onClick={() => remove(m.userId, m.user?.name)} disabled={busy}
                            className="text-xs px-2 py-1 border rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                            제거
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isLead && (
            <div className="mt-4 border-t pt-4">
              {!adding && (
                <button onClick={() => setAdding(true)}
                  className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">
                  + 멤버 추가
                </button>
              )}
              {adding && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">추가할 회사 멤버 선택</div>
                  <select value={newUserId} onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm">
                    <option value="">선택…</option>
                    {candidates.map((cm) => (
                      <option key={cm.userId} value={cm.userId}>
                        {cm.name} ({ROLE_META[cm.role]?.label || cm.role}) · {cm.email}
                      </option>
                    ))}
                  </select>
                  {candidates.length === 0 && (
                    <div className="text-xs text-gray-400">추가 가능한 멤버가 없습니다.</div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">역할</span>
                    <label className="text-sm flex items-center gap-1">
                      <input type="radio" checked={newRole === 'MEMBER'} onChange={() => setNewRole('MEMBER')} /> MEMBER
                    </label>
                    <label className="text-sm flex items-center gap-1">
                      <input type="radio" checked={newRole === 'LEAD'} onChange={() => setNewRole('LEAD')} /> LEAD
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setAdding(false); setNewUserId(''); setNewRole('MEMBER'); }}
                      className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">
                      취소
                    </button>
                    <button onClick={add} disabled={busy || !newUserId}
                      className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50">
                      {busy ? '추가 중...' : '추가'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border rounded hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
