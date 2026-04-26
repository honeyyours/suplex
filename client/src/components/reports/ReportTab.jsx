// 현장 보고 — 슬림 (사진 + 진행률 + 한 줄 캡션)
// memo/nextDayPlan은 메모 탭/일정 탭으로 위임 (DB 컬럼은 호환성 유지).
// 사진: 카드별 [📋 카톡 메시지 복사] / [📷 사진 일괄 다운] 버튼.
// 사진 클릭 → 인앱 라이트박스 (좌우 이동, ESC 닫기).
// 업로드: 모달 즉시 닫히고 카드에 진행률 표시 (카톡 패턴).
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { reportsApi } from '../../api/reports';
import { companyApi } from '../../api/company';
import { projectsApi } from '../../api/projects';
import { useAuth } from '../../contexts/AuthContext';
import { relativeTime, toDateKey } from '../../utils/date';
import { useCompanyPhases } from '../../hooks/useCompanyPhases';
import PhotoUploader from '../PhotoUploader';
import ImageLightbox from '../ImageLightbox';

export default function ReportTab({ projectId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // 카드별 업로드 진행 상태: { reportId: { total, done, percent } }
  const [uploadProgress, setUploadProgress] = useState({});

  // 라이트박스: { photos: [...], index: N } | null
  const [lightbox, setLightbox] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'project', projectId],
    queryFn: () => reportsApi.list(projectId),
    enabled: !!projectId,
  });
  const { data: companyData } = useQuery({ queryKey: ['company'], queryFn: () => companyApi.get() });
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });
  const reports = data?.reports || [];
  const company = companyData?.company;
  const project = projectData?.project;
  const loading = isLoading;
  const { auth } = useAuth();

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['reports', 'project', projectId] });
  }

  async function remove(id) {
    if (!confirm('이 보고를 삭제할까요?')) return;
    await reportsApi.remove(projectId, id);
    reload();
  }

  // 사진 업로드 — 카드 등장 후 백그라운드 진행, 진행률 카드에 표시
  async function uploadPhotosForReport(reportId, files) {
    if (!files || files.length === 0) return;
    setUploadProgress((prev) => ({
      ...prev,
      [reportId]: { total: files.length, done: 0, percent: 0 },
    }));
    try {
      const fd = new FormData();
      fd.append('source', 'REPORT');
      fd.append('sourceId', reportId);
      files.forEach((f) => fd.append('photos', f));
      await api.post(`/projects/${projectId}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress((prev) => ({
            ...prev,
            [reportId]: { ...prev[reportId], percent },
          }));
        },
      });
      reload();
    } catch (e) {
      const msg = e.response?.data?.error || '사진 업로드 실패';
      alert(`사진 업로드 실패:\n${msg}`);
    } finally {
      setUploadProgress((prev) => {
        const { [reportId]: _drop, ...rest } = prev;
        return rest;
      });
    }
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
          <ReportCard
            key={r.id}
            report={r}
            project={project}
            company={company}
            user={auth?.user}
            uploadProgress={uploadProgress[r.id]}
            onOpenLightbox={(photos, idx) => setLightbox({ photos, index: idx })}
            onDelete={() => remove(r.id)}
          />
        ))}
      </div>

      {showForm && (
        <ReportFormModal
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onCreated={async (report, files) => {
            // 모달 즉시 닫기 + 보고 카드 등장 + 사진은 백그라운드 업로드
            setShowForm(false);
            await queryClient.invalidateQueries({ queryKey: ['reports', 'project', projectId] });
            uploadPhotosForReport(report.id, files); // await X — 백그라운드
          }}
        />
      )}

      {lightbox && (
        <ImageLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// ============================================
// 카톡 메시지 생성 (B안)
// ============================================
const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];

function buildKakaoMessage({ report, project, company, user }) {
  const d = new Date(report.reportDate);
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()} (${KOR_DOW[d.getDay()]})`;
  const siteName = project?.name || '';
  const status = report.progress >= 100 ? '완료' : `${report.progress}% 진행`;
  const lines = [];
  lines.push(`[${siteName}] ${dateLabel} ${report.category} ${status}`);
  if (report.caption?.trim()) lines.push(report.caption.trim());
  lines.push('사진 첨부드립니다.');
  const sig = [company?.name, user?.name].filter(Boolean).join(' / ');
  if (sig) lines.push(`- ${sig}`);
  return lines.join('\n');
}

// ============================================
// 사진 일괄 다운로드 — fetch + blob, { ok, fail } 반환
// ============================================
async function downloadAllPhotos(photos, baseName) {
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    try {
      const res = await fetch(p.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ext = (p.filename?.split('.').pop() || 'jpg').toLowerCase();
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_${String(i + 1).padStart(2, '0')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      ok += 1;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error('사진 다운로드 실패:', p.url, e);
      fail += 1;
    }
  }
  return { ok, fail };
}

// ============================================
// 카드
// ============================================
function ReportCard({ report, project, company, user, uploadProgress, onOpenLightbox, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const photos = report.photos || [];

  const d = new Date(report.reportDate);
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()} (${KOR_DOW[d.getDay()]})`;
  const status = report.progress >= 100 ? '완료' : `${report.progress}% 진행`;
  const statusBg = report.progress >= 100
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-navy-100 text-navy-700';

  async function copyMessage() {
    const text = buildKakaoMessage({ report, project, company, user });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      alert('복사 실패: ' + e.message);
    }
  }

  async function downloadAll() {
    if (photos.length === 0) return;
    setDownloading(true);
    try {
      const safeSite = (project?.name || 'project').replace(/[^\w가-힣]/g, '_');
      const baseName = `${safeSite}_${toDateKey(d)}_${report.category}`;
      const { ok, fail } = await downloadAllPhotos(photos, baseName);
      if (fail > 0 && ok === 0) {
        alert(`사진 다운로드에 실패했습니다 (${fail}장).\n네트워크 또는 사진 접근 권한을 확인해주세요.`);
      } else if (fail > 0) {
        alert(`사진 ${ok}장 다운로드 완료, ${fail}장 실패.\n실패한 사진은 카드에서 직접 클릭해 받아주세요.`);
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {report.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${statusBg}`}>
              {status}
            </span>
            {report.workerCount != null && (
              <span className="text-xs text-gray-500">· 작업 {report.workerCount}명</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dateLabel} · {report.author?.name} · {relativeTime(report.createdAt)}
          </div>
        </div>
        <button onClick={onDelete} className="text-xs text-gray-400 hover:text-rose-600">삭제</button>
      </div>

      {report.caption && (
        <div className="text-sm text-gray-800 mt-2">
          {report.caption}
        </div>
      )}

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenLightbox(photos, idx)}
              className="block w-20 h-20 rounded overflow-hidden border hover:opacity-80 transition"
            >
              <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {uploadProgress && (
        <div className="mt-3 px-3 py-2 rounded bg-amber-50 border border-amber-200 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="flex-1">
            <div className="text-xs text-amber-800 font-medium">
              📤 사진 {uploadProgress.total}장 업로드 중 ({uploadProgress.percent}%)
            </div>
            <div className="mt-1 h-1.5 bg-amber-100 rounded overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        <button
          onClick={copyMessage}
          className={`text-xs px-3 py-1.5 rounded border transition ${copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-navy-50 border-navy-200 text-navy-700 hover:bg-navy-100'
          }`}
        >
          {copied ? '✓ 복사됨' : '📋 카톡 메시지 복사'}
        </button>
        {photos.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={downloading}
            className="text-xs px-3 py-1.5 rounded border bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            {downloading ? '⏳ 다운로드 중...' : `📷 사진 ${photos.length}장 일괄 다운`}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 작성 모달 — 보고 생성 즉시 닫고 사진은 백그라운드 업로드
// ============================================
function ReportFormModal({ projectId, onClose, onCreated }) {
  const phases = useCompanyPhases();
  const [form, setForm] = useState({
    reportDate: toDateKey(new Date()),
    category: phases[0] || '목공',
    progress: 50,
    workerCount: '',
    caption: '',
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
        caption: form.caption || null,
      });
      // 모달 닫기 + 사진은 부모에서 백그라운드 업로드
      onCreated(report, files);
    } catch (e) {
      setErr(e.response?.data?.error || '저장 실패');
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-lg my-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">오늘 작업 보고</h2>
          <p className="text-xs text-gray-500 mt-1">
            보고 올리면 즉시 카드가 생기고, 사진은 백그라운드에서 업로드됩니다.
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <L label="보고 날짜">
              <input type="date" value={form.reportDate} onChange={upd('reportDate')} className="input" />
            </L>
            <L label="공종">
              <select value={form.category} onChange={upd('category')} className="input">
                {phases.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </L>
            <L label="진행률 (%)">
              <input type="number" min="0" max="100" value={form.progress} onChange={upd('progress')} className="input" />
            </L>
            <L label="작업 인원 수 (선택)">
              <input type="number" min="0" value={form.workerCount} onChange={upd('workerCount')} placeholder="예: 3" className="input" />
            </L>
          </div>
          <L label="한 줄 캡션 (선택)">
            <input
              value={form.caption}
              onChange={upd('caption')}
              placeholder="예: 거실/안방 마감 끝"
              className="input"
            />
          </L>
          <L label="사진">
            <PhotoUploader value={files} onChange={setFiles} max={10} />
          </L>
          {err && <div className="text-sm text-rose-600">{err}</div>}
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
