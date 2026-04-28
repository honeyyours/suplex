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
      </div>

      {tab === 'companies' && <CompaniesTab />}
      {tab === 'users' && <UsersTab currentUserId={auth?.user?.id} />}
      {tab === 'stats' && <StatsTab />}
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
              <th className="px-4 py-3 text-left">가입일</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">로딩...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">사용자가 없습니다</td></tr>
            ) : users.map((u) => (
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
            ))}
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="전체 회사" value={stats.total.companies} />
        <Card label="전체 사용자" value={stats.total.users} />
        <Card label="전체 프로젝트" value={stats.total.projects} />
        <Card label="전체 지출 거래" value={stats.total.expenses} />
        <Card label="신규 사용자 (30일)" value={stats.last30Days.newUsers} accent />
        <Card label="신규 회사 (30일)" value={stats.last30Days.newCompanies} accent />
      </div>

      {stats.last30Days.daily && stats.last30Days.daily.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm font-semibold text-navy-800 mb-3">📈 일별 가입 추세 (지난 30일)</div>
          <SignupChart daily={stats.last30Days.daily} />
        </div>
      )}
    </div>
  );
}

function SignupChart({ daily }) {
  const maxVal = Math.max(1, ...daily.map((d) => Math.max(d.users, d.companies)));
  const W = 800;
  const H = 200;
  const pad = 30;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const barWidth = innerW / daily.length / 2.5;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
        {/* y축 grid */}
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
        {/* 막대 */}
        {daily.map((d, i) => {
          const x = pad + (innerW / daily.length) * i;
          const userH = (d.users / maxVal) * innerH;
          const companyH = (d.companies / maxVal) * innerH;
          return (
            <g key={d.date}>
              <rect
                x={x + 2} y={pad + innerH - userH} width={barWidth} height={userH}
                fill="#1e3a5f" rx="1"
              >
                <title>{d.date}: 신규 사용자 {d.users}명</title>
              </rect>
              <rect
                x={x + 2 + barWidth + 1} y={pad + innerH - companyH} width={barWidth} height={companyH}
                fill="#fbbf24" rx="1"
              >
                <title>{d.date}: 신규 회사 {d.companies}곳</title>
              </rect>
              {/* x축 라벨 — 5일마다 */}
              {i % 5 === 0 && (
                <text x={x + barWidth} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7280">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
        {/* 범례 */}
        <g transform={`translate(${W - 200}, 8)`}>
          <rect x="0" y="2" width="10" height="10" fill="#1e3a5f" rx="1" />
          <text x="14" y="11" fontSize="10" fill="#374151">신규 사용자</text>
          <rect x="80" y="2" width="10" height="10" fill="#fbbf24" rx="1" />
          <text x="94" y="11" fontSize="10" fill="#374151">신규 회사</text>
        </g>
      </svg>
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
