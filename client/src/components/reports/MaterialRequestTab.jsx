import { useEffect, useState } from 'react';
import { materialRequestsApi, photosApi, REQUEST_STATUS_META, REQUEST_STATUS_KEYS } from '../../api/reports';
import { relativeTime, formatDateDot } from '../../utils/date';
import PhotoUploader from '../PhotoUploader';

export default function MaterialRequestTab({ projectId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const { requests } = await materialRequestsApi.list(projectId);
      setRequests(requests);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [projectId]);

  async function setStatus(r, status) {
    await materialRequestsApi.update(projectId, r.id, { status });
    reload();
  }

  async function remove(id) {
    if (!confirm('이 요청을 삭제할까요?')) return;
    await materialRequestsApi.remove(projectId, id);
    reload();
  }

  const pending = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">
          대기 중 {pending}건 · 전체 {requests.length}건
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-md"
        >
          + 자재 발주 요청
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && requests.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">발주 요청이 없습니다</div>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} onSetStatus={setStatus} onDelete={() => remove(r.id)} />
        ))}
      </div>

      {showForm && (
        <RequestFormModal
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}

function RequestCard({ request, onSetStatus, onDelete }) {
  const status = REQUEST_STATUS_META[request.status] || REQUEST_STATUS_META.PENDING;
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
            {request.neededDate && (
              <span className="text-xs text-gray-500">
                필요일: {formatDateDot(request.neededDate)}
              </span>
            )}
            {request.notifyOwner && request.status === 'PENDING' && (
              <span className="text-xs text-amber-600">🔔 발주 요청됨</span>
            )}
          </div>
          <div className="text-base font-medium text-navy-800">
            {request.materialName}
            {request.quantity && (
              <span className="ml-2 text-sm text-gray-500">
                {request.quantity}{request.unit ? ` ${request.unit}` : ''}
              </span>
            )}
          </div>
          {request.memo && <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">{request.memo}</div>}
          <div className="text-xs text-gray-500 mt-1">
            {request.requestedBy?.name} · {relativeTime(request.createdAt)}
          </div>
          {request.photos?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {request.photos.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded overflow-hidden border">
                  <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0 text-xs">
          {REQUEST_STATUS_KEYS.filter((k) => k !== request.status).map((k) => (
            <button
              key={k}
              onClick={() => onSetStatus(request, k)}
              className="px-2 py-1 border rounded hover:bg-gray-50"
            >
              → {REQUEST_STATUS_META[k].label}
            </button>
          ))}
          <button onClick={onDelete} className="px-2 py-1 text-gray-400 hover:text-rose-600">삭제</button>
        </div>
      </div>
    </div>
  );
}

function RequestFormModal({ projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    materialName: '',
    quantity: '',
    unit: '',
    neededDate: '',
    memo: '',
    notifyOwner: true,
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (!form.materialName.trim()) { setErr('자재명을 입력하세요'); return; }
    setErr(''); setBusy(true);
    try {
      const { request } = await materialRequestsApi.create(projectId, {
        materialName: form.materialName.trim(),
        quantity: form.quantity === '' ? null : Number(form.quantity),
        unit: form.unit.trim() || null,
        neededDate: form.neededDate || null,
        memo: form.memo || null,
        notifyOwner: form.notifyOwner,
      });
      if (files.length > 0) {
        try {
          await photosApi.upload(projectId, { source: 'MATERIAL_REQUEST', sourceId: request.id, files });
        } catch (e) {
          const msg = e.response?.data?.error || '사진 업로드 실패';
          const hint = e.response?.data?.hint;
          alert(`요청은 등록됐지만 사진 업로드 실패:\n${msg}${hint ? '\n\n' + hint : ''}`);
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
          <h2 className="text-lg font-bold text-navy-800">자재 발주 요청</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <L label="필요 자재" required>
            <input value={form.materialName} onChange={upd('materialName')} placeholder="예: LX 강마루 모로칸 크림" className="input" />
          </L>
          <div className="grid grid-cols-3 gap-3">
            <L label="수량">
              <input type="number" value={form.quantity} onChange={upd('quantity')} className="input" step="0.01" />
            </L>
            <L label="단위">
              <input value={form.unit} onChange={upd('unit')} placeholder="m² / 롤 / 개" className="input" />
            </L>
            <L label="필요 날짜">
              <input type="date" value={form.neededDate} onChange={upd('neededDate')} className="input" />
            </L>
          </div>
          <L label="메모">
            <textarea rows={2} value={form.memo} onChange={upd('memo')} placeholder="모델번호 / 색상 / 설치 위치 등" className="input resize-y" />
          </L>
          <L label="사진 (품번 사진 등)">
            <PhotoUploader value={files} onChange={setFiles} max={10} />
          </L>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.notifyOwner}
              onChange={(e) => setForm({ ...form, notifyOwner: e.target.checked })}
              className="w-4 h-4 accent-amber-600"
            />
            🔔 대표에게 발주 요청 알림
            <span className="text-xs text-gray-400 ml-1">(카카오 알림톡 연동 후 발송)</span>
          </label>
          {err && <div className="text-sm text-rose-600">{err}</div>}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">취소</button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 bg-amber-600 text-white rounded-md text-sm disabled:opacity-50">
            {busy ? '요청 중...' : '발주 요청'}
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
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
