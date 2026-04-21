import { useEffect, useState } from 'react';
import { reportsApi, photosApi, CATEGORIES } from '../../api/reports';
import { relativeTime, toDateKey, formatDateDisplay } from '../../utils/date';
import PhotoUploader from '../PhotoUploader';

export default function ReportTab({ projectId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const { reports } = await reportsApi.list(projectId);
      setReports(reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [projectId]);

  async function remove(id) {
    if (!confirm('이 보고를 삭제할까요?')) return;
    await reportsApi.remove(projectId, id);
    reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">
          총 {reports.length}건
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-navy-700 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-md"
        >
          + 오늘 작업 보고
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && reports.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          아직 작성된 보고가 없습니다
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} onDelete={() => remove(r.id)} />
        ))}
      </div>

      {showForm && (
        <ReportFormModal
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}

function ReportCard({ report, onDelete }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-navy-100 text-navy-700">
              {report.category}
            </span>
            <span className="text-sm font-semibold text-navy-800">
              진행률 {report.progress}%
            </span>
            {report.workerCount != null && (
              <span className="text-xs text-gray-500">· 작업 {report.workerCount}명</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDateDisplay(report.reportDate.slice(0, 10))} · {report.author?.name} · {relativeTime(report.createdAt)}
          </div>
        </div>
        <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-600">삭제</button>
      </div>

      {report.memo && (
        <div className="text-sm text-gray-700 whitespace-pre-line mt-2">
          <span className="text-xs text-gray-500">특이사항</span>
          <div>{report.memo}</div>
        </div>
      )}
      {report.nextDayPlan && (
        <div className="text-sm text-gray-700 whitespace-pre-line mt-2">
          <span className="text-xs text-gray-500">내일 예정</span>
          <div>{report.nextDayPlan}</div>
        </div>
      )}

      {report.photos?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {report.photos.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded overflow-hidden border">
              <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportFormModal({ projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    reportDate: toDateKey(new Date()),
    category: '목공',
    progress: 50,
    workerCount: '',
    memo: '',
    nextDayPlan: '',
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const { report } = await reportsApi.create(projectId, {
        reportDate: form.reportDate,
        category: form.category,
        progress: Number(form.progress) || 0,
        workerCount: form.workerCount === '' ? null : Number(form.workerCount),
        memo: form.memo || null,
        nextDayPlan: form.nextDayPlan || null,
      });
      if (files.length > 0) {
        try {
          await photosApi.upload(projectId, {
            source: 'REPORT',
            sourceId: report.id,
            files,
          });
        } catch (e) {
          const msg = e.response?.data?.error || '사진 업로드 실패';
          const hint = e.response?.data?.hint;
          alert(`보고는 저장됐지만 사진 업로드 실패:\n${msg}${hint ? '\n\n' + hint : ''}`);
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
          <h2 className="text-lg font-bold text-navy-800">오늘 작업 보고</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <L label="보고 날짜">
              <input type="date" value={form.reportDate} onChange={upd('reportDate')} className="input" />
            </L>
            <L label="공종">
              <select value={form.category} onChange={upd('category')} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </L>
            <L label="진행률 (%)">
              <input type="number" min="0" max="100" value={form.progress} onChange={upd('progress')} className="input" />
            </L>
            <L label="작업 인원 수">
              <input type="number" min="0" value={form.workerCount} onChange={upd('workerCount')} placeholder="예: 3" className="input" />
            </L>
          </div>
          <L label="특이사항 / 메모">
            <textarea rows={3} value={form.memo} onChange={upd('memo')} className="input resize-y" />
          </L>
          <L label="내일 예정 작업">
            <textarea rows={2} value={form.nextDayPlan} onChange={upd('nextDayPlan')} placeholder="예: 목공 마감 + 전기 타공" className="input resize-y" />
          </L>
          <L label="사진">
            <PhotoUploader value={files} onChange={setFiles} max={10} />
          </L>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 bg-navy-700 text-white rounded-md text-sm disabled:opacity-50">
            {busy ? '저장 중...' : '보고 올리기'}
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

function L({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
