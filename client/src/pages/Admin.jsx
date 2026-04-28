import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/admin';

const ROLE_LABEL = { OWNER: '대표', DESIGNER: '디자이너', FIELD: '현장팀' };

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
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { companies } = await adminApi.listCompanies();
      setCompanies(companies);
    } catch (e) {
      alert('회사 목록 로드 실패: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

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

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">로딩...</div>;

  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">회사명</th>
            <th className="px-4 py-3 text-left">OWNER</th>
            <th className="px-4 py-3 text-right">멤버</th>
            <th className="px-4 py-3 text-right">프로젝트</th>
            <th className="px-4 py-3 text-left">생성일</th>
            <th className="px-4 py-3 text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {companies.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">회사가 없습니다</td></tr>
          ) : companies.map((c) => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {c.name}
                {c.hideExpenses && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">지출숨김</span>}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {c.owners.length === 0 ? <span className="text-rose-500">없음</span> :
                  c.owners.map((o) => <div key={o.userId}>{o.name} · {o.email}</div>)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{c.memberCount}</td>
              <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{c.projectCount}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(c)}
                  className="text-xs px-2 py-1 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
                >🗑️ 강제 삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card label="전체 회사" value={stats.total.companies} />
      <Card label="전체 사용자" value={stats.total.users} />
      <Card label="전체 프로젝트" value={stats.total.projects} />
      <Card label="전체 지출 거래" value={stats.total.expenses} />
      <Card label="신규 사용자 (30일)" value={stats.last30Days.newUsers} accent />
      <Card label="신규 회사 (30일)" value={stats.last30Days.newCompanies} accent />
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
