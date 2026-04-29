import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';

const ROLE_LABEL = { OWNER: '대표', DESIGNER: '디자이너', FIELD: '현장팀' };

function relativeTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR');
}

function lastSeenColor(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = diff / (24 * 60 * 60 * 1000);
  if (days < 1) return 'text-emerald-700 font-medium';   // 24시간 이내 = 활성
  if (days < 7) return 'text-gray-700';                  // 1주일 이내 = 정상
  return 'text-gray-400';                                 // 1주일+ = 휴면
}

export default function Admin() {
  const { auth } = useAuth();
  const [tab, setTab] = useState('companies');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">🛡️ 관리자 콘솔</h1>
          <div className="text-xs text-gray-500 mt-1">
            슈퍼 어드민: <b>{auth?.user?.email}</b> · 회사 데이터 직접 조회는 멀티테넌시 격리로 차단되며 메타 정보만 노출됩니다.
          </div>
        </div>
      </div>

      <div className="border-b flex gap-1">
        <TabBtn active={tab === 'companies'} onClick={() => setTab('companies')}>🏢 회사</TabBtn>
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>👥 사용자</TabBtn>
        <TabBtn active={tab === 'stats'} onClick={() => setTab('stats')}>📊 통계</TabBtn>
        <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}>📜 로그</TabBtn>
      </div>

      {tab === 'companies' && <CompaniesTab />}
      {tab === 'users' && <UsersTab currentUserId={auth?.user?.id} />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >{children}</button>
  );
}

// ============================================================
// 회사 탭
// ============================================================
function CompaniesTab() {
  const { startImpersonate } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('created'); // created | name | activity
  const [dormantOnly, setDormantOnly] = useState(false);
  const [transferDlg, setTransferDlg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = { sort };
      if (q.trim()) params.q = q.trim();
      if (dormantOnly) params.dormantOnly = 'true';
      const { companies } = await adminApi.listCompanies(params);
      setCompanies(companies);
    } catch (e) {
      alert('회사 목록 로드 실패: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sort, dormantOnly]);

  async function handleDelete(c) {
    const phrase = `${c.name} 삭제`;
    const input = prompt(
      `⚠️ 회사 "${c.name}"을 영구 삭제합니다.\n` +
      `프로젝트 ${c.projectCount}개·멤버 ${c.memberCount}명을 포함한 모든 데이터가 cascade로 삭제됩니다.\n\n` +
      `확인하려면 다음 문구를 정확히 입력하세요:\n${phrase}`
    );
    if (input !== phrase) return;
    try {
      await adminApi.deleteCompany(c.id);
      alert('삭제 완료');
      load();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleImpersonate(c) {
    if (!confirm(
      `🎭 "${c.name}" OWNER 화면으로 임시 진입합니다.\n\n` +
      `· READ-ONLY (데이터 변경 불가)\n` +
      `· 1시간 자동 만료\n` +
      `· 종료하려면 상단 "어드민 콘솔로 돌아가기" 버튼 클릭\n\n` +
      `계속하시겠습니까?`
    )) return;
    try {
      await startImpersonate(c.id);
      navigate('/', { replace: true });
    } catch (e) {
      alert('사칭 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleSeedDemo(c) {
    if (!confirm(
      `🌱 "${c.name}"에 시연용 데모 프로젝트를 생성합니다.\n\n` +
      `· "데모 - 강남구 32평 아파트 리모델링" 1개\n` +
      `· 견적 + 마감재 + 일정 + 발주 + 체크리스트 + 메모 풍부 데이터\n` +
      `· 공정 현황 표·공정 상세 드로어 시연 가능\n` +
      `· 같은 회사의 기존 데모(siteCode=DEMO_PROJECT)는 삭제 후 재생성\n\n` +
      `계속하시겠습니까?`
    )) return;
    try {
      const r = await adminApi.seedDemoProject(c.id);
      const ct = r.counts || {};
      alert(
        `✅ 데모 프로젝트 생성 완료\n\n` +
        `견적 라인 ${ct.quoteLines}개 · 마감재 ${ct.materials}개\n` +
        `일정 ${ct.schedules}개 · 발주 ${ct.purchaseOrders}개\n` +
        `체크리스트 ${ct.checklists}개 · 메모 ${ct.memos}개`
      );
      load();
    } catch (e) {
      alert('데모 생성 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleTogglePresetDefault(c) {
    const target = !c.isPhasePresetDefault;
    const msg = target
      ? `🌟 "${c.name}"을 시스템 프리셋 표준 회사로 지정합니다.\n\n` +
        `· 다른 모든 회사는 자동으로 표준 해제됩니다 (한 번에 1개만 가능)\n` +
        `· 다음 가입자부터 이 회사의 4묶음(라벨·키워드·데드라인·어드바이스)을 복사받습니다\n` +
        `· 기존 가입한 회사들엔 영향 없습니다 (snapshot 정책)\n\n` +
        `계속하시겠습니까?`
      : `🌟 "${c.name}"의 시스템 프리셋 표준 지정을 해제합니다.\n\n` +
        `· 표준 회사가 없는 상태가 됩니다 (다음 가입자는 코드 기본 시드 사용)\n\n` +
        `계속하시겠습니까?`;
    if (!confirm(msg)) return;
    try {
      await adminApi.setPresetDefault(c.id, target);
      load();
    } catch (e) {
      alert('지정 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleCleanupInvitations() {
    if (!confirm('만료된 초대 링크를 모두 삭제할까요?')) return;
    try {
      const r = await adminApi.cleanupInvitations();
      alert(`만료된 초대 ${r.deletedCount}건 삭제 완료`);
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
    }
  }

  function downloadBackup(c) {
    // 어드민 토큰을 query로 보낼 수 없으니 fetch + blob 다운로드
    const token = localStorage.getItem('suplex_token');
    fetch(adminApi.backupUrl(c.id), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.blob() : r.json().then((j) => Promise.reject(j)))
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suplex-admin-backup-${c.name}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((e) => alert('백업 다운로드 실패: ' + (e?.error || e?.message || '에러')));
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-3 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="회사명 검색 (Enter)"
          className="flex-1 min-w-[200px] px-3 py-1.5 border rounded text-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm"
        >
          <option value="created">최신 가입순</option>
          <option value="name">회사명순</option>
          <option value="activity">활동 많은 순</option>
        </select>
        <label className="text-sm flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={dormantOnly} onChange={(e) => setDormantOnly(e.target.checked)} />
          😴 휴면만 (7일+)
        </label>
        <button onClick={load} className="text-xs px-3 py-1.5 border rounded">검색</button>
        <button onClick={handleCleanupInvitations} className="text-xs px-3 py-1.5 border rounded text-amber-700 border-amber-300 hover:bg-amber-50">
          🧹 만료 초대 정리
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">회사명</th>
              <th className="px-4 py-3 text-left">OWNER</th>
              <th className="px-4 py-3 text-right">멤버 / 프로젝트</th>
              <th className="px-4 py-3 text-left">최근 활동</th>
              <th className="px-4 py-3 text-right">7일 활동</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">회사가 없습니다</td></tr>
            ) : companies.map((c) => (
              <tr key={c.id} className={`border-t hover:bg-gray-50 ${c.isDormant ? 'opacity-70' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {c.name}
                  {c.isPhasePresetDefault && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">🌟 프리셋 표준</span>}
                  {c.isDormant && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-300">😴 휴면</span>}
                  {c.hideExpenses && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">지출숨김</span>}
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    가입 {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {c.owners.length === 0 ? <span className="text-rose-500">⚠️ 없음</span> :
                    c.owners.map((o) => <div key={o.userId}>{o.name} · {o.email}</div>)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums text-xs">
                  멤버 {c.memberCount}<br/>프로젝트 {c.projectCount}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {relativeTime(c.lastActivityAt)}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <span className={`tabular-nums font-semibold ${
                    c.weekActivityScore > 10 ? 'text-emerald-700' :
                    c.weekActivityScore > 0 ? 'text-gray-700' : 'text-gray-400'
                  }`}>{c.weekActivityScore}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                  <button
                    onClick={() => handleImpersonate(c)}
                    title="OWNER로 임시 진입 (READ-ONLY)"
                    className="text-xs px-2 py-1 border rounded hover:bg-violet-50 text-violet-700 border-violet-300"
                  >👁️ 보기</button>
                  <button
                    onClick={() => setTransferDlg(c)}
                    title="OWNER 변경"
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >👑 OWNER</button>
                  <button
                    onClick={() => handleSeedDemo(c)}
                    title="시연용 데모 프로젝트 생성 (기존 데모는 삭제 후 재생성)"
                    className="text-xs px-2 py-1 border rounded hover:bg-emerald-50 text-emerald-700 border-emerald-300"
                  >🌱 데모</button>
                  <button
                    onClick={() => handleTogglePresetDefault(c)}
                    title={c.isPhasePresetDefault ? '시스템 프리셋 표준 해제' : '시스템 프리셋 표준으로 지정 (다른 회사는 자동 해제)'}
                    className={`text-xs px-2 py-1 border rounded ${
                      c.isPhasePresetDefault
                        ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                        : 'border-gray-300 text-gray-600 hover:bg-amber-50'
                    }`}
                  >🌟 표준</button>
                  <button
                    onClick={() => downloadBackup(c)}
                    title="회사 데이터 백업 (JSON)"
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >💾 백업</button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transferDlg && (
        <TransferOwnerDialog
          company={transferDlg}
          onClose={() => setTransferDlg(null)}
          onDone={() => { setTransferDlg(null); load(); }}
        />
      )}
    </div>
  );
}

function TransferOwnerDialog({ company, onClose, onDone }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 어드민 사용자 검색으로 회사 멤버 가져오기 — 회사명 검색 안 되니 backupRef로 회사 백업 잠깐 보고…
    // 단순화: 사용자 탭 검색 활용해 그 회사 소속 사용자 추리기
    adminApi.listUsers('').then(({ users }) => {
      const filtered = users.filter((u) => u.memberships.some((m) => m.companyId === company.id));
      setMembers(filtered);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [company.id]);

  async function transfer(u) {
    if (!confirm(`${u.name}(${u.email})을 ${company.name}의 OWNER로 승격할까요?`)) return;
    setBusy(true);
    try {
      await adminApi.transferOwnership(company.id, u.id);
      alert('OWNER 변경 완료');
      onDone();
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-navy-800">👑 {company.name} — OWNER 변경</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          {loading ? <div className="text-sm text-gray-400">로딩...</div> :
            members.length === 0 ? <div className="text-sm text-gray-400">멤버가 없습니다</div> :
            <div className="space-y-1">
              {members.map((u) => {
                const m = u.memberships.find((mm) => mm.companyId === company.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => transfer(u)}
                    disabled={busy || m?.role === 'OWNER'}
                    className="w-full px-3 py-2 text-left text-sm border rounded hover:bg-navy-50 disabled:opacity-50 disabled:bg-gray-50 flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium">{u.name}</span>
                      <span className="text-gray-500 ml-2">{u.email}</span>
                    </span>
                    <span className="text-xs text-gray-400">{ROLE_LABEL[m?.role] || m?.role}</span>
                  </button>
                );
              })}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 사용자 탭
// ============================================================
function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { users } = await adminApi.listUsers(q.trim());
      setUsers(users);
    } catch (e) {
      alert('사용자 목록 로드 실패: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function handleDelete(u) {
    if (u.id === currentUserId) {
      alert('본인 계정은 어드민 콘솔에서 삭제할 수 없습니다.');
      return;
    }
    const phrase = u.email;
    const input = prompt(
      `⚠️ 사용자 ${u.name} (${u.email})을 영구 삭제합니다.\n` +
      `이 사용자가 OWNER인 회사들의 모든 데이터도 cascade로 삭제됩니다.\n` +
      `소속 회사: ${u.memberships.map((m) => `${m.companyName}(${ROLE_LABEL[m.role] || m.role})`).join(', ') || '없음'}\n\n` +
      `확인하려면 이메일을 정확히 입력하세요:\n${phrase}`
    );
    if (input !== phrase) return;
    try {
      const r = await adminApi.deleteUser(u.id);
      alert(`삭제 완료\n사용자: ${u.email}\n함께 삭제된 회사 수: ${r.deletedCompanyIds?.length || 0}`);
      load();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleReset(u) {
    if (!confirm(`${u.name}(${u.email})의 비밀번호를 임시 비번으로 강제 리셋할까요?`)) return;
    try {
      const r = await adminApi.resetPassword(u.id);
      alert(`임시 비번 발급 완료\n\n이메일: ${r.email}\n임시 비밀번호: ${r.tempPassword}\n\n위 정보를 본인에게 카톡 등으로 전달하세요.`);
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function handleToggleAdmin(u) {
    const next = !u.isSuperAdmin;
    if (!confirm(`${u.name}(${u.email})의 슈퍼 어드민 권한을 ${next ? '부여' : '회수'}할까요?`)) return;
    try {
      await adminApi.patchUser(u.id, { isSuperAdmin: next });
      load();
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-5 py-3 border-b bg-gray-50 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="이메일·이름 검색 (Enter)"
          className="flex-1 px-3 py-1.5 border rounded text-sm"
        />
        <button onClick={load} className="text-xs px-3 py-1.5 border rounded">검색</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">이름</th>
              <th className="px-4 py-3 text-left">이메일</th>
              <th className="px-4 py-3 text-left">소속</th>
              <th className="px-4 py-3 text-left">마지막 접속</th>
              <th className="px-4 py-3 text-right">30일 활동</th>
              <th className="px-4 py-3 text-left">가입일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">사용자가 없습니다</td></tr>
            ) : users.map((u) => {
              const a = u.activity30d || { total: 0 };
              const tooltip = `프로젝트 ${a.projects || 0} · 일정 ${a.schedules || 0} · 보고 ${a.reports || 0} · 체크 ${a.checklistsDone || 0}`;
              return (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}
                    {u.isSuperAdmin && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-800 rounded border border-violet-200">🛡️ ADMIN</span>}
                    {u.id === currentUserId && <span className="ml-2 text-xs text-gray-400">(나)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.memberships.length === 0 ? <span className="italic text-gray-400">— 회사 없음</span> :
                      u.memberships.map((m) => (
                        <div key={m.companyId}>{m.companyName} <span className="text-gray-400">· {ROLE_LABEL[m.role] || m.role}</span></div>
                      ))}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.lastSeenAt ? (
                      <span className={lastSeenColor(u.lastSeenAt)} title={new Date(u.lastSeenAt).toLocaleString('ko-KR')}>
                        {relativeTime(u.lastSeenAt)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">미접속</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs" title={tooltip}>
                    <span className={`tabular-nums font-semibold ${
                      a.total > 10 ? 'text-emerald-700' :
                      a.total > 0 ? 'text-gray-700' : 'text-gray-400'
                    }`}>{a.total}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleReset(u)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >🔒 비번 리셋</button>
                    <button
                      onClick={() => handleToggleAdmin(u)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >{u.isSuperAdmin ? '권한 회수' : '🛡️ 어드민 부여'}</button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                      >🗑️ 삭제</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 통계 탭
// ============================================================
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch((e) => alert('통계 로드 실패: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="text-sm text-gray-400 py-8 text-center">로딩...</div>;

  const t = stats.total;
  const r = stats.last30Days;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="전체 회사" value={t.companies} />
        <Card label="전체 사용자" value={t.users} />
        <Card label="전체 프로젝트" value={t.projects} />
        <Card label="전체 일정" value={t.schedules} />
        <Card label="신규 회사 (30일)" value={r.newCompanies} accent />
        <Card label="신규 사용자 (30일)" value={r.newUsers} accent />
        <Card label="신규 프로젝트 (30일)" value={r.newProjects} accent />
        <Card label="신규 일정 (30일)" value={r.newSchedules} accent />
      </div>

      {r.daily && r.daily.length > 0 && (
        <>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm font-semibold text-navy-800 mb-3">📈 신규 가입 추세 (지난 30일)</div>
            <DailyChart
              daily={r.daily}
              series={[
                { key: 'users', label: '신규 사용자', color: '#1e3a5f' },
                { key: 'companies', label: '신규 회사', color: '#fbbf24' },
              ]}
            />
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm font-semibold text-navy-800 mb-3">🏗️ 신규 활동 추세 (지난 30일)</div>
            <DailyChart
              daily={r.daily}
              series={[
                { key: 'projects', label: '신규 프로젝트', color: '#0ea5e9' },
                { key: 'schedules', label: '신규 일정', color: '#10b981' },
              ]}
            />
          </div>
        </>
      )}

      <PhaseNormalizeAction />
    </div>
  );
}

function PhaseNormalizeAction() {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  async function run(dryRun) {
    if (!dryRun && !confirm(
      '기존 phase 데이터를 표준 25개로 일괄 정규화합니다.\n\n' +
      '대상: PhaseKeywordRule · PhaseDeadlineRule · PhaseAdvice 의 phase\n' +
      '       Material(마감재).spaceGroup · SimpleQuoteLine(그룹 헤더).itemName\n\n' +
      '되돌리기 어렵습니다. 계속하시겠어요?'
    )) return;
    setBusy(true);
    try {
      const r = await adminApi.normalizePhases(dryRun);
      setReport(r);
    } catch (e) {
      alert('실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="text-sm font-semibold text-navy-800 mb-1">🔧 운영 액션 — 기존 phase 데이터 정규화</div>
      <div className="text-xs text-gray-500 mb-3">
        표준 25개 closed enum 정책 적용 전에 입력된 자유 텍스트 데이터를 일괄로 표준 라벨로 변환.
        먼저 미리보기(Dry Run)로 변환 결과 확인 후 실제 적용 권장.
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => run(true)}
          disabled={busy}
          className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
        >🔍 미리보기 (Dry Run)</button>
        <button
          onClick={() => run(false)}
          disabled={busy}
          className="text-xs px-3 py-1.5 border border-rose-300 text-rose-700 bg-rose-50 rounded hover:bg-rose-100 disabled:opacity-50"
        >✏️ 실제 적용</button>
      </div>
      {busy && <div className="text-xs text-gray-400 mt-2">처리 중...</div>}
      {report && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-gray-700">
            결과 ({report.dryRun ? '미리보기' : '✅ 적용 완료'}):
          </div>
          {Object.entries(report.report).map(([area, info]) => (
            <div key={area} className="text-xs border rounded p-2 bg-gray-50">
              <div className="font-medium text-gray-800">{area}</div>
              <div className="text-gray-500">검사 {info.totalChecked}건 / 변경 {info.totalChanged}건</div>
              {Object.entries(info.changes || {}).length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {Object.entries(info.changes).map(([change, count]) => (
                    <div key={change} className="text-gray-600">· {change} <span className="text-gray-400">({count}건)</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyChart({ daily, series }) {
  const maxVal = Math.max(1, ...daily.flatMap((d) => series.map((s) => d[s.key] || 0)));
  const W = 800;
  const H = 200;
  const pad = 30;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const barWidth = innerW / daily.length / (series.length + 0.5);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = pad + innerH * (1 - p);
          return (
            <g key={p}>
              <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="#e5e7eb" strokeDasharray="2,2" />
              <text x={pad - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
                {Math.round(maxVal * p)}
              </text>
            </g>
          );
        })}
        {daily.map((d, i) => {
          const x = pad + (innerW / daily.length) * i;
          return (
            <g key={d.date}>
              {series.map((s, idx) => {
                const v = d[s.key] || 0;
                const h = (v / maxVal) * innerH;
                return (
                  <rect
                    key={s.key}
                    x={x + 2 + idx * (barWidth + 1)}
                    y={pad + innerH - h}
                    width={barWidth}
                    height={h}
                    fill={s.color}
                    rx="1"
                  >
                    <title>{d.date}: {s.label} {v}</title>
                  </rect>
                );
              })}
              {i % 5 === 0 && (
                <text x={x + barWidth * series.length / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        <g transform={`translate(${W - 280}, 8)`}>
          {series.map((s, idx) => (
            <g key={s.key} transform={`translate(${idx * 110}, 0)`}>
              <rect x="0" y="2" width="10" height="10" fill={s.color} rx="1" />
              <text x="14" y="11" fontSize="10" fill="#374151">{s.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// 감사 로그 탭
// ============================================================
const ACTION_META = {
  // auth
  'auth.signup':              { label: '회원가입', icon: '✨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'auth.login':               { label: '로그인',   icon: '🔓', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  'auth.password-change':     { label: '비번 변경', icon: '🔒', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  // member (OWNER)
  'member.create':            { label: '멤버 추가',     icon: '➕', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'member.update':            { label: '멤버 수정',     icon: '✏️', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'member.remove':            { label: '멤버 제거',     icon: '➖', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'member.password-reset':    { label: '멤버 비번리셋', icon: '🔑', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  // invitation
  'invitation.create':        { label: '초대 발송', icon: '✉️', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  'invitation.cancel':        { label: '초대 취소', icon: '✕',  color: 'bg-gray-50 text-gray-600 border-gray-200' },
  'invitation.accept':        { label: '초대 수락(신규)', icon: '🤝', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'invitation.join':          { label: '초대 합류(기존)', icon: '🤝', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // admin
  'admin.user-delete':        { label: '어드민:사용자삭제', icon: '🗑️', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'admin.company-delete':     { label: '어드민:회사삭제',   icon: '🗑️', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'admin.password-reset':     { label: '어드민:비번리셋',   icon: '🔑', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'admin.user-update':        { label: '어드민:사용자수정', icon: '✏️', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  'admin.transfer-ownership': { label: '어드민:OWNER변경',  icon: '👑', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  'admin.impersonate-start':  { label: '어드민:사칭시작',   icon: '🎭', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  'admin.cleanup-invitations':{ label: '어드민:초대정리',   icon: '🧹', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

function actionMeta(action) {
  return ACTION_META[action] || { label: action, icon: '·', color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const { logs } = await adminApi.listAuditLogs(params);
      setLogs(logs);
    } catch (e) {
      alert('로그 로드 실패: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [actionFilter]);

  const filtered = filter
    ? logs.filter((l) =>
        l.actor.email?.includes(filter) ||
        l.actor.name?.includes(filter) ||
        l.company?.name?.includes(filter) ||
        JSON.stringify(l.metadata || '').includes(filter)
      )
    : logs;

  const allActions = Object.keys(ACTION_META);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-3 flex flex-wrap gap-2 items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="이메일·이름·회사·메타 검색 (클라이언트 필터)"
          className="flex-1 min-w-[200px] px-3 py-1.5 border rounded text-sm"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm"
        >
          <option value="">모든 액션</option>
          {allActions.map((a) => <option key={a} value={a}>{ACTION_META[a].label}</option>)}
        </select>
        <button onClick={load} className="text-xs px-3 py-1.5 border rounded">새로고침</button>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}건 / 최대 200건</span>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">시각</th>
              <th className="px-4 py-3 text-left">액션</th>
              <th className="px-4 py-3 text-left">수행자</th>
              <th className="px-4 py-3 text-left">회사</th>
              <th className="px-4 py-3 text-left">대상·메타</th>
              <th className="px-4 py-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">로그가 없습니다</td></tr>
            ) : filtered.map((l) => {
              const meta = actionMeta(l.action);
              return (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={new Date(l.createdAt).toLocaleString('ko-KR')}>
                    {relativeTime(l.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded border ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <div className="font-medium">{l.actor.name}</div>
                    <div className="text-gray-500">{l.actor.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{l.company?.name || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[300px]">
                    {l.metadata ? (
                      <span title={JSON.stringify(l.metadata, null, 2)} className="truncate inline-block max-w-[300px] align-bottom">
                        {Object.entries(l.metadata).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{l.ip || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent ? 'border-navy-300' : ''}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-navy-700' : 'text-gray-800'}`}>
        {value.toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
