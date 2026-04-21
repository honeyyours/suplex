import { useRef, useState } from 'react';
import { backupApi, downloadJson } from '../api/backup';

export default function BackupMenu({ projectId, projectName, onRestored }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function exportThis() {
    setBusy(true); setOpen(false);
    try {
      const data = projectId
        ? await backupApi.exportProject(projectId)
        : await backupApi.exportCompany();
      const base = projectId ? projectName : (data.company?.name || 'splex');
      const safe = (base || 'splex').replace(/[^\w가-힣]+/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(data, `splex_${safe}_${date}.json`);
    } catch (e) {
      alert('백업 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  function triggerImport() {
    setOpen(false);
    fileRef.current?.click();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      alert('JSON 파싱 실패: 올바른 백업 파일인지 확인하세요');
      return;
    }

    if (!parsed.version) {
      alert('올바른 SPLEX 백업 파일이 아닙니다');
      return;
    }

    const confirmMsg =
      parsed.type === 'company'
        ? `회사 전체 백업 파일입니다. ${parsed.company?.projects?.length || 0}개 프로젝트를 새로 만듭니다.\n진행할까요?`
        : `프로젝트 "${parsed.project?.name}"을(를) 새 프로젝트로 복원합니다 (이름 뒤 "(복원)" 추가).\n진행할까요?`;

    if (!confirm(confirmMsg)) return;

    setBusy(true);
    try {
      const res = await backupApi.import({ data: parsed, mode: 'new' });
      alert(`✅ 복원 완료: ${res.projects.length}개 프로젝트`);
      onRestored?.(res.projects);
    } catch (e) {
      alert('복원 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? '처리 중...' : '백업 ▾'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border rounded-md shadow-lg z-20">
            <button
              onClick={exportThis}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              💾 JSON 내보내기
            </button>
            <button
              onClick={triggerImport}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t"
            >
              📥 JSON 복원
            </button>
          </div>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
