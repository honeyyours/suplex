import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { teamApi, ROLE_META, ROLE_KEYS } from '../api/team';
import { invitationsApi } from '../api/invitations';
import { vendorsApi } from '../api/vendors';
import {
  TOGGLEABLE_FEATURES,
  TOGGLE_FEATURE_META,
  ROLE_DEFAULTS,
} from '../utils/features';

export default function TeamManagement() {
  const { auth } = useAuth();
  const isOwner = auth?.role === 'OWNER';
  const [tab, setTab] = useState('vendors');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">팀 관리</h1>
      </div>

      <div className="border-b flex gap-1">
        <TabButton active={tab === 'vendors'} onClick={() => setTab('vendors')}>
          🏢 협력업체
        </TabButton>
        <TabButton active={tab === 'members'} onClick={() => setTab('members')}>
          👥 팀원
        </TabButton>
      </div>

      {tab === 'members' && <MembersSection isOwner={isOwner} currentUserId={auth?.user?.id} />}
      {tab === 'vendors' && <VendorsSection isOwner={isOwner} role={auth?.role} />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-navy-700 text-navy-800'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// 팀원 섹션
// ============================================================
function MembersSection({ isOwner, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { members } = await teamApi.list();
      setMembers(members);
    } catch (e) {
      alert('팀원 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(m) {
    if (!confirm(`${m.name}(${m.email})을(를) 회사에서 제거할까요?\n계정 자체는 유지되지만 회사 데이터에 접근할 수 없게 됩니다.`)) return;
    try {
      await teamApi.remove(m.userId);
      load();
    } catch (e) {
      alert('제거 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-navy-800">팀원 목록</div>
          <div className="text-xs text-gray-500 mt-0.5">
            <b>초대 링크</b>: 본인이 비번 설정 (권장) · <b>직접 생성</b>: 임시비번 카톡 공유
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="text-sm px-4 py-2 bg-navy-700 text-white rounded hover:bg-navy-800"
            >
              ✉️ 초대 링크 발송
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm px-4 py-2 border border-navy-700 text-navy-700 rounded hover:bg-navy-50"
            >
              + 직접 생성
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">이름</th>
              <th className="px-4 py-3 text-left">이메일</th>
              <th className="px-4 py-3 text-left">전화</th>
              <th className="px-4 py-3 text-left">역할</th>
              <th className="px-4 py-3 text-left">가입일</th>
              {isOwner && <th className="px-4 py-3 text-right">관리</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isOwner ? 6 : 5} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={isOwner ? 6 : 5} className="px-4 py-8 text-center text-gray-400">팀원이 없습니다</td></tr>
            ) : (
              members.map((m) => (
                <tr key={m.userId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {m.name}
                    {m.userId === currentUserId && (
                      <span className="ml-2 text-xs text-gray-400">(나)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.role} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(m.joinedAt).toLocaleDateString('ko-KR')}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setEditing(m)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setResetting(m)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        비번 리셋
                      </button>
                      {m.userId !== currentUserId && (
                        <button
                          onClick={() => handleRemove(m)}
                          className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                        >
                          제거
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isOwner && <InvitationsPanel />}

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editing && (
        <EditMemberModal
          member={editing}
          isSelf={editing.userId === currentUserId}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {resetting && (
        <ResetPasswordModal
          member={resetting}
          onClose={() => setResetting(null)}
          onSaved={() => setResetting(null)}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { label: role, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function AddMemberModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: genTempPassword(), role: 'FIELD',
  });
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(true);

  async function submit() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      alert('이름, 이메일, 6자 이상 비밀번호를 입력하세요');
      return;
    }
    setBusy(true);
    try {
      await teamApi.create(form);
      alert(
        `${form.name} 계정 생성 완료\n\n` +
        `이메일: ${form.email}\n임시 비밀번호: ${form.password}\n\n` +
        `위 정보를 본인에게 카톡으로 공유하세요.`
      );
      onSaved();
    } catch (e) {
      alert('생성 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="팀원 추가" onClose={onClose}>
      <div className="space-y-3">
        <Field label="이름 *">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
            autoFocus
          />
        </Field>
        <Field label="이메일 *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="example@company.com"
          />
        </Field>
        <Field label="전화">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="010-1234-5678"
          />
        </Field>
        <Field label="역할 *">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          >
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>{ROLE_META[r].label}</option>
            ))}
          </select>
        </Field>
        <Field label="임시 비밀번호 * (6자 이상)">
          <div className="flex gap-1">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="flex-1 px-3 py-2 border rounded text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="px-3 py-2 border rounded text-xs"
            >
              {showPw ? '숨김' : '보기'}
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, password: genTempPassword() })}
              className="px-3 py-2 border rounded text-xs"
            >
              새로 생성
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            본인이 첫 로그인 후 설정에서 변경할 수 있습니다.
          </div>
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '생성중...' : '생성'}
        </button>
      </div>
    </Modal>
  );
}

function EditMemberModal({ member, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone || '',
    role: member.role,
  });
  const [busy, setBusy] = useState(false);

  // 권한 토글 — OWNER 멤버는 토글 불가 (모든 권한 항상 ON)
  const canTogglePerms = member.role !== 'OWNER';
  // 서버에서 받은 명시 토글값 { feature: bool } (저장된 UserPermission)
  const [serverPerms, setServerPerms] = useState({});
  // UI 변경값 — { feature: bool | null } (null = 명시 해제 / 디폴트 복귀)
  const [pendingPerms, setPendingPerms] = useState({});
  const [permsLoading, setPermsLoading] = useState(canTogglePerms);

  useEffect(() => {
    if (!canTogglePerms) return;
    let alive = true;
    teamApi.getPermissions(member.userId)
      .then(({ permissions }) => {
        if (!alive) return;
        setServerPerms(permissions || {});
        setPermsLoading(false);
      })
      .catch(() => { if (alive) setPermsLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.userId]);

  // 현재 effective 체크 상태 (UI에 보여줄 값)
  function isChecked(feature) {
    // pending 값이 명시되어 있으면 그게 우선
    if (Object.prototype.hasOwnProperty.call(pendingPerms, feature)) {
      const v = pendingPerms[feature];
      if (v === null) return ROLE_DEFAULTS[form.role].includes(feature);
      return v;
    }
    // 서버 명시값이 있으면 그것
    if (Object.prototype.hasOwnProperty.call(serverPerms, feature)) {
      return serverPerms[feature];
    }
    // 그 외 = 역할 디폴트
    return ROLE_DEFAULTS[form.role].includes(feature);
  }

  // 명시 토글 상태 (디폴트와 다름 표시용): 'grant' | 'revoke' | null
  function explicitState(feature) {
    const roleDefault = ROLE_DEFAULTS[form.role].includes(feature);
    let value;
    if (Object.prototype.hasOwnProperty.call(pendingPerms, feature)) {
      value = pendingPerms[feature];
      if (value === null) return null; // 명시 해제 예정
    } else if (Object.prototype.hasOwnProperty.call(serverPerms, feature)) {
      value = serverPerms[feature];
    } else {
      return null;
    }
    if (value === roleDefault) return null;
    return value ? 'grant' : 'revoke';
  }

  function toggleFeature(feature) {
    const current = isChecked(feature);
    const next = !current;
    const roleDefault = ROLE_DEFAULTS[form.role].includes(feature);
    setPendingPerms((prev) => ({
      ...prev,
      // 디폴트와 같으면 명시 해제(null), 다르면 명시 토글(true/false)
      [feature]: next === roleDefault ? null : next,
    }));
  }

  // 그룹별로 묶기 ('회사 설정' / '지출관리')
  const grouped = useMemo(() => {
    const g = {};
    for (const f of TOGGLEABLE_FEATURES) {
      const meta = TOGGLE_FEATURE_META[f] || { label: f, group: '기타' };
      if (!g[meta.group]) g[meta.group] = [];
      g[meta.group].push({ feature: f, label: meta.label });
    }
    return g;
  }, []);

  async function submit() {
    setBusy(true);
    try {
      // 1) 이름·전화·역할 업데이트
      await teamApi.update(member.userId, form);

      // 2) 권한 변경 사항이 있으면 PUT
      if (canTogglePerms && Object.keys(pendingPerms).length > 0) {
        // null = 명시 해제 (서버 deleteMany), true/false = 명시 토글 (서버 upsert)
        await teamApi.updatePermissions(member.userId, pendingPerms);
      }

      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${member.name} 정보 수정`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="이름">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </Field>
        <Field label="이메일">
          <input
            value={member.email}
            disabled
            className="w-full px-3 py-2 border rounded text-sm bg-gray-50 text-gray-500"
          />
        </Field>
        <Field label="전화">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </Field>
        <Field label="역할">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            disabled={isSelf}
            className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-50 disabled:text-gray-500"
          >
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>{ROLE_META[r].label}</option>
            ))}
          </select>
          {isSelf && (
            <div className="text-xs text-gray-400 mt-1">본인 역할은 변경할 수 없습니다</div>
          )}
        </Field>

        {/* ============================================
            추가 권한 — OWNER가 직원별로 직접 ON/OFF 가능
            ============================================ */}
        <div className="pt-3 mt-3 border-t">
          <div className="text-sm font-semibold text-navy-800 mb-1">추가 권한</div>
          {!canTogglePerms ? (
            <div className="text-xs text-gray-500 bg-gray-50 border rounded p-2 leading-relaxed">
              대표(OWNER)는 모든 권한을 자동으로 갖습니다. 권한을 회수하려면 먼저 역할을
              디자이너/현장팀으로 변경해주세요.
            </div>
          ) : permsLoading ? (
            <div className="text-xs text-gray-400 py-2">권한 정보 로딩...</div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                역할 기본값과 다른 항목만 직접 부여/회수로 표시됩니다. 다시 클릭하면 기본값으로
                돌아갑니다.
              </div>
              {Object.entries(grouped).map(([groupName, items]) => (
                <div key={groupName}>
                  <div className="text-xs font-medium text-gray-600 mb-1">{groupName}</div>
                  <div className="border rounded divide-y">
                    {items.map(({ feature, label }) => {
                      const checked = isChecked(feature);
                      const roleDefault = ROLE_DEFAULTS[form.role].includes(feature);
                      const ex = explicitState(feature);
                      return (
                        <label
                          key={feature}
                          className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeature(feature)}
                            className="h-4 w-4"
                          />
                          <span className="flex-1">{label}</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            기본: {roleDefault ? 'ON' : 'OFF'}
                          </span>
                          {ex === 'grant' && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                              직접 부여
                            </span>
                          )}
                          {ex === 'revoke' && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap">
                              직접 회수
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '저장중...' : '저장'}
        </button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ member, onClose, onSaved }) {
  const [password, setPassword] = useState(genTempPassword());
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < 6) {
      alert('6자 이상 입력하세요');
      return;
    }
    if (!confirm(`${member.name}의 비밀번호를 새 값으로 리셋할까요?`)) return;
    setBusy(true);
    try {
      await teamApi.resetPassword(member.userId, password);
      alert(`비밀번호 리셋 완료\n\n새 비밀번호: ${password}\n\n본인에게 카톡으로 공유하세요.`);
      onSaved();
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`${member.name} 비밀번호 리셋`} onClose={onClose}>
      <Field label="새 비밀번호 (6자 이상)">
        <div className="flex gap-1">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => setPassword(genTempPassword())}
            className="px-3 py-2 border rounded text-xs"
          >
            새로 생성
          </button>
        </div>
      </Field>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 text-sm bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? '리셋중...' : '리셋'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// 초대 발송 모달 + 발송 이력 패널
// ============================================================
function InviteModal({ onClose }) {
  const [form, setForm] = useState({ email: '', role: 'DESIGNER' });
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null); // { inviteUrl, email, role, expiresAt }
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (!form.email.trim()) {
      setErr('이메일을 입력해주세요');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const { invitation } = await invitationsApi.create({
        email: form.email.trim(),
        role: form.role,
      });
      setIssued({ ...invitation });
    } catch (e) {
      setErr(e.response?.data?.error || '발송 실패');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!issued?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(issued.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // 폴백: textarea select
      const ta = document.getElementById('invite-link-ta');
      if (ta) { ta.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    }
  }

  if (issued) {
    const expDate = new Date(issued.expiresAt).toLocaleDateString('ko-KR');
    return (
      <Modal title="초대 링크 발송 완료" onClose={onClose}>
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-800">
            <b>{issued.email}</b>님에게 보낼 초대 링크가 생성되었습니다.
            <br />
            아래 링크를 복사해서 <b>카톡·문자·이메일</b>로 본인에게 전달해주세요.
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">초대 링크 ({expDate}까지 유효)</div>
            <div className="flex gap-2">
              <textarea
                id="invite-link-ta"
                value={issued.inviteUrl}
                readOnly
                onClick={(e) => e.target.select()}
                rows={2}
                className="flex-1 px-3 py-2 border rounded text-xs font-mono bg-gray-50 break-all"
              />
              <button
                onClick={copyLink}
                className={`px-3 py-2 text-sm rounded whitespace-nowrap ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-navy-700 text-white hover:bg-navy-800'
                }`}
              >
                {copied ? '✓ 복사됨' : '📋 복사'}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            본인이 링크 클릭 → 비밀번호 설정 → 자동으로 회사에 합류합니다.
            <br />
            7일이 지나면 자동 만료되며, 한 번 사용하면 재사용 불가합니다.
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => { setIssued(null); setForm({ email: '', role: 'DESIGNER' }); }}
            className="px-4 py-2 text-sm border rounded"
          >
            다른 사람도 초대
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            완료
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="✉️ 초대 링크 발송" onClose={onClose}>
      <div className="space-y-3">
        <Field label="이메일 *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="designer@company.com"
            className="w-full px-3 py-2 border rounded text-sm"
            autoFocus
          />
        </Field>
        <Field label="역할 *">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="DESIGNER">{ROLE_META.DESIGNER.label}</option>
            <option value="FIELD">{ROLE_META.FIELD.label}</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            대표(OWNER) 권한 부여는 가입 후 "수정"에서 직접 승격해주세요.
          </div>
        </Field>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <div className="text-xs text-gray-500 bg-gray-50 border rounded p-2 leading-relaxed">
          링크가 생성되면 클립보드로 복사해서 본인에게 카톡으로 보내주세요. (메일 자동 발송은 정식 출시 시 추가)
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '발송중...' : '초대 링크 생성'}
        </button>
      </div>
    </Modal>
  );
}

function InvitationsPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { invitations } = await invitationsApi.list();
      setList(invitations);
    } catch (e) {
      // 베타 단계 — 라우트 없으면 무시
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function copyLink(inv) {
    if (!inv.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inv.inviteUrl);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) { /* noop */ }
  }

  async function cancel(inv) {
    if (!confirm(`${inv.email}에게 보낸 초대를 취소할까요?`)) return;
    try {
      await invitationsApi.remove(inv.id);
      load();
    } catch (e) {
      alert('취소 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  const pending = list.filter((i) => !i.acceptedAt && !i.expired);
  const expired = list.filter((i) => !i.acceptedAt && i.expired);
  const accepted = list.filter((i) => i.acceptedAt);

  return (
    <div className="border-t bg-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between"
      >
        <span>📨 초대 발송 이력 {list.length > 0 && <span className="text-gray-500">({list.length})</span>}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-3">
          {loading ? (
            <div className="text-sm text-gray-400 py-4">로딩...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-400 py-4">발송 이력이 없습니다</div>
          ) : (
            <>
              {pending.length > 0 && (
                <Section title={`대기 중 (${pending.length})`}>
                  {pending.map((inv) => (
                    <InvRow key={inv.id} inv={inv} status="pending" copiedId={copiedId} onCopy={copyLink} onCancel={cancel} />
                  ))}
                </Section>
              )}
              {expired.length > 0 && (
                <Section title={`만료됨 (${expired.length})`}>
                  {expired.map((inv) => (
                    <InvRow key={inv.id} inv={inv} status="expired" onCancel={cancel} />
                  ))}
                </Section>
              )}
              {accepted.length > 0 && (
                <Section title={`수락됨 (${accepted.length})`}>
                  {accepted.map((inv) => (
                    <InvRow key={inv.id} inv={inv} status="accepted" />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
      <div className="bg-white border rounded divide-y">{children}</div>
    </div>
  );
}

function InvRow({ inv, status, copiedId, onCopy, onCancel }) {
  const meta = ROLE_META[inv.role] || { label: inv.role, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <div className="px-3 py-2 flex items-center gap-3 text-sm">
      <span className="flex-1 truncate">
        <span className="font-medium">{inv.email}</span>
        <span className={`ml-2 inline-block px-1.5 py-0.5 text-xs rounded border ${meta.color}`}>{meta.label}</span>
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {status === 'accepted'
          ? `${new Date(inv.acceptedAt).toLocaleDateString('ko-KR')} 수락`
          : `${new Date(inv.expiresAt).toLocaleDateString('ko-KR')}${status === 'expired' ? ' 만료' : ' 만료 예정'}`}
      </span>
      {status === 'pending' && (
        <>
          <button
            onClick={() => onCopy(inv)}
            className={`text-xs px-2 py-1 rounded ${
              copiedId === inv.id ? 'bg-emerald-600 text-white' : 'border hover:bg-gray-50'
            }`}
          >
            {copiedId === inv.id ? '✓ 복사됨' : '📋 링크 복사'}
          </button>
          <button
            onClick={() => onCancel(inv)}
            className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
          >
            취소
          </button>
        </>
      )}
      {status === 'expired' && (
        <button
          onClick={() => onCancel(inv)}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
        >
          삭제
        </button>
      )}
    </div>
  );
}

// ============================================================
// 협력업체 섹션
// ============================================================
function VendorsSection({ isOwner, role }) {
  const queryClient = useQueryClient();
  const canEdit = role === 'OWNER' || role === 'DESIGNER';
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (categoryFilter) params.category = categoryFilter;
      const { vendors } = await vendorsApi.list(params);
      setVendors(vendors);
    } catch (e) {
      alert('협력업체 로드 실패');
    } finally {
      setLoading(false);
    }
  }

  function invalidateVendors() {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(vendors.map((v) => v.category).filter(Boolean));
    return [...set].sort();
  }, [vendors]);

  async function handleRemove(v) {
    if (!confirm(`'${v.name}' 협력업체를 삭제할까요?\n관련 일정/지출 기록은 유지됩니다.`)) return;
    try {
      await vendorsApi.remove(v.id);
      invalidateVendors();
      load();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-navy-800">협력업체 목록</div>
          <div className="text-xs text-gray-500 mt-0.5">
            공종별로 등록해두면 견적/지출/일정에서 자동완성으로 끌어다 쓸 수 있습니다 (다음 페이즈).
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm px-4 py-2 bg-navy-700 text-white rounded hover:bg-navy-800"
          >
            + 협력업체 추가
          </button>
        )}
      </div>

      <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="이름·담당자·전화·메모 검색 (Enter)"
          className="flex-1 min-w-[200px] px-3 py-1.5 border rounded text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm"
        >
          <option value="">전체 공종</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="text-xs px-3 py-1.5 border rounded">검색</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">업체명</th>
              <th className="px-4 py-3 text-left">공종</th>
              <th className="px-4 py-3 text-left">담당자</th>
              <th className="px-4 py-3 text-left">전화</th>
              <th className="px-4 py-3 text-right">단가</th>
              <th className="px-4 py-3 text-left">계좌</th>
              <th className="px-4 py-3 text-left">메모</th>
              {canEdit && <th className="px-4 py-3 text-right">관리</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-gray-400">
                협력업체가 없습니다. 위 "+ 협력업체 추가"로 첫 업체를 등록하세요.
              </td></tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-sky-50 text-sky-700 border border-sky-200">
                      {v.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.contact || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.phone || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                    {v.unitPrice
                      ? `${Number(v.unitPrice).toLocaleString('ko-KR')}${v.unit ? ` / ${v.unit}` : ''}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate">
                    {v.bankAccount || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[240px] truncate">
                    {v.memo || '-'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setEditing(v)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        수정
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleRemove(v)}
                          className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <VendorModal
          existingCategories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); invalidateVendors(); load(); }}
        />
      )}
      {editing && (
        <VendorModal
          vendor={editing}
          existingCategories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); invalidateVendors(); load(); }}
        />
      )}
    </div>
  );
}

function VendorModal({ vendor, existingCategories = [], onClose, onSaved }) {
  const isEdit = !!vendor;
  const [form, setForm] = useState({
    name: vendor?.name || '',
    category: vendor?.category || '',
    contact: vendor?.contact || '',
    phone: vendor?.phone || '',
    unitPrice: vendor?.unitPrice != null ? String(vendor.unitPrice) : '',
    unit: vendor?.unit || '',
    bankAccount: vendor?.bankAccount || '',
    memo: vendor?.memo || '',
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!form.name.trim() || !form.category.trim()) {
      alert('업체명과 공종은 필수입니다');
      return;
    }
    const payload = {
      name: form.name,
      category: form.category,
      contact: form.contact || null,
      phone: form.phone || null,
      unitPrice: form.unitPrice ? Number(form.unitPrice.replace(/[^\d.]/g, '')) : null,
      unit: form.unit || null,
      bankAccount: form.bankAccount || null,
      memo: form.memo || null,
    };
    setBusy(true);
    try {
      if (isEdit) await vendorsApi.update(vendor.id, payload);
      else await vendorsApi.create(payload);
      onSaved();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isEdit ? '협력업체 수정' : '협력업체 추가'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="업체명 *">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
            autoFocus
          />
        </Field>
        <Field label="공종 *">
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            list="vendor-categories"
            placeholder="전기, 설비, 타일 등"
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <datalist id="vendor-categories">
            {existingCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="담당자">
          <input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </Field>
        <Field label="전화">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="010-1234-5678"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </Field>
        <Field label="단가">
          <input
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            placeholder="원 단위 숫자"
            className="w-full px-3 py-2 border rounded text-sm tabular-nums"
          />
        </Field>
        <Field label="단위">
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="m², 개, 일 등"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </Field>
        <div className="col-span-2">
          <Field label="계좌">
            <input
              value={form.bankAccount}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
              placeholder='예: "국민 123-45-678901 김OO" — 인건비 정산 카톡 복사용'
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="메모">
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded">취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 text-sm bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '저장중...' : (isEdit ? '저장' : '추가')}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// 공통 컴포넌트
// ============================================================
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-navy-800">{title}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function genTempPassword() {
  // 영문 + 숫자 8자 (헷갈리는 0/O/I/l 제외)
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
