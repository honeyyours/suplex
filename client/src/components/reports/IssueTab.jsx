import { useEffect, useState } from 'react';
import {
  issuesApi, photosApi,
  ISSUE_TYPE_META, ISSUE_TYPE_KEYS, URGENCY_META, URGENCY_KEYS,
} from '../../api/reports';
import { relativeTime } from '../../utils/date';
import PhotoUploader from '../PhotoUploader';

export default function IssueTab({ projectId }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const { issues } = await issuesApi.list(projectId);
      setIssues(issues);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [projectId]);

  const filtered = filter === 'ALL' ? issues : issues.filter((i) => i.status === filter);

  async function toggleResolved(issue) {
    const newStatus = issue.status === 'OPEN' ? 'RESOLVED' : 'OPEN';
    await issuesApi.update(projectId, issue.id, { status: newStatus });
    reload();
  }

  async function remove(id) {
    if (!confirm('이 이슈를 삭제할까요?')) return;
    await issuesApi.remove(projectId, id);
    reload();
  }

  const openCount = issues.filter((i) => i.status === 'OPEN').length;
  const criticalCount = issues.filter((i) => i.status === 'OPEN' && i.urgency === 'CRITICAL').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            미해결 {openCount}건
            {criticalCount > 0 && <span className="text-red-600 font-semibold ml-2">· 긴급 {criticalCount}</span>}
          </span>
          <div className="flex gap-1 ml-3">
            {[
              { k: 'OPEN', l: '미해결' },
              { k: 'RESOLVED', l: '해결됨' },
              { k: 'ALL', l: '전체' },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className={`text-xs px-2.5 py-1 rounded ${
                  filter === t.k ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >{t.l}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md"
        >
          + 이슈 등록
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          {filter === 'OPEN' ? '미해결 이슈가 없습니다' : '이슈가 없습니다'}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onToggle={() => toggleResolved(issue)} onDelete={() => remove(issue.id)} />
        ))}
      </div>

      {showForm && (
        <IssueFormModal
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}

function IssueCard({ issue, onToggle, onDelete }) {
  const type = ISSUE_TYPE_META[issue.type] || ISSUE_TYPE_META.OTHER;
  const urgency = URGENCY_META[issue.urgency] || URGENCY_META.NORMAL;
  const resolved = issue.status === 'RESOLVED';

  return (
    <div className={`bg-white border rounded-lg p-4 ${resolved ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${urgency.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${urgency.color}`}>{urgency.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${type.color}`}>{type.label}</span>
            {resolved && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">해결됨</span>}
            {issue.notifyOwner && !resolved && <span className="text-xs text-amber-600">🔔 대표 알림</span>}
          </div>
          <div className={`text-base font-medium ${resolved ? 'line-through text-gray-500' : 'text-navy-800'}`}>
            {issue.title}
          </div>
          {issue.memo && <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">{issue.memo}</div>}
          <div className="text-xs text-gray-500 mt-1">
            {issue.author?.name} · {relativeTime(issue.createdAt)}
            {resolved && ` · 해결: ${relativeTime(issue.resolvedAt)}`}
          </div>
          {issue.photos?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {issue.photos.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded overflow-hidden border">
                  <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={onToggle} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">
            {resolved ? '재오픈' : '해결 처리'}
          </button>
          <button onClick={onDelete} className="text-xs px-2 py-1 text-gray-400 hover:text-red-600">삭제</button>
        </div>
      </div>
    </div>
  );
}

function IssueFormModal({ projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    type: 'MATERIAL_DEFECT',
    urgency: 'WARNING',
    memo: '',
    notifyOwner: true,
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (!form.title.trim()) { setErr('제목을 입력하세요'); return; }
    setErr(''); setBusy(true);
    try {
      const { issue } = await issuesApi.create(projectId, {
        title: form.title.trim(),
        type: form.type,
        urgency: form.urgency,
        memo: form.memo || null,
        notifyOwner: form.notifyOwner,
      });
      if (files.length > 0) {
        try {
          await photosApi.upload(projectId, { source: 'ISSUE', sourceId: issue.id, files });
        } catch (e) {
          const msg = e.response?.data?.error || '사진 업로드 실패';
          const hint = e.response?.data?.hint;
          alert(`이슈는 등록됐지만 사진 업로드 실패:\n${msg}${hint ? '\n\n' + hint : ''}`);
        }
      }
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || '저장 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">이슈 등록</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <L label="제목" required>
            <input value={form.title} onChange={upd('title')} placeholder="예: 타일 색상 불량" className="input" />
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L label="긴급도">
              <select value={form.urgency} onChange={upd('urgency')} className="input">
                {URGENCY_KEYS.map((k) => <option key={k} value={k}>{URGENCY_META[k].label}</option>)}
              </select>
            </L>
            <L label="이슈 유형">
              <select value={form.type} onChange={upd('type')} className="input">
                {ISSUE_TYPE_KEYS.map((k) => <option key={k} value={k}>{ISSUE_TYPE_META[k].label}</option>)}
              </select>
            </L>
          </div>
          <L label="상세 설명">
            <textarea rows={3} value={form.memo} onChange={upd('memo')} className="input resize-y" />
          </L>
          <L label="사진">
            <PhotoUploader value={files} onChange={setFiles} max={10} />
          </L>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.notifyOwner}
              onChange={(e) => setForm({ ...form, notifyOwner: e.target.checked })}
              className="w-4 h-4 accent-amber-600"
            />
            🔔 대표에게 즉시 알림
            <span className="text-xs text-gray-400 ml-1">(카카오 알림톡 연동 후 발송)</span>
          </label>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">
            {busy ? '등록 중...' : '이슈 등록'}
          </button>
        </div>
        <style>{`
          .input { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 7px 10px; font-size: 14px; outline: none; background: white; }
          .input:focus { border-color: #1e3a66; box-shadow: 0 0 0 2px rgba(30,58,102,0.15); }
        `}</style>
      </div>
    </div>
  );
}

function L({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
