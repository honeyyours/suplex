// 사진 외부 보관 (Partial Archive) 다이얼로그.
// 3단계: ZIP 다운로드 → 외부 저장 확인 체크 → 클라우드에서 영구 제거.
// 메타데이터·메모·견적은 그대로 유지. 재업로드 시 동일 출처에 다시 올리면 자연 복원.
import { useEffect, useState } from 'react';
import { photoArchiveApi } from '../api/photoArchive';

export default function PhotoArchiveModal({ project, onClose, onArchived }) {
  const [summary, setSummary] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    photoArchiveApi
      .summary(project.id)
      .then(setSummary)
      .catch((e) => setLoadErr(e.response?.data?.error || '사진 정보를 불러올 수 없습니다'));
  }, [project.id]);

  const photoCount = summary?.photoCount ?? 0;

  async function handleDownload() {
    setBusy(true);
    setErr('');
    try {
      const safe = (project.name || 'project').replace(/[^\w가-힣]+/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      await photoArchiveApi.download(project.id, `suplex_photos_${safe}_${date}.zip`);
      setDownloaded(true);
    } catch (e) {
      setErr('다운로드 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  async function handlePurge() {
    if (!confirm(`사진 ${photoCount}장을 클라우드에서 영구 제거합니다.\n\n메모·견적·체크리스트 등 다른 데이터는 그대로 유지됩니다.\n진행하시겠습니까?`)) {
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const res = await photoArchiveApi.purge(project.id);
      setDone(res);
      onArchived?.(res);
    } catch (e) {
      setErr('삭제 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b">
          <h3 className="text-lg font-bold text-navy-800">📦 사진 외부 보관</h3>
          <p className="text-sm text-gray-600 mt-1">
            사진을 ZIP으로 내려받은 후 클라우드에서 제거합니다. 메모·견적·체크리스트·일정 등 다른 데이터는 그대로 유지됩니다.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {loadErr ? (
            <div className="text-rose-600 text-sm">{loadErr}</div>
          ) : !summary ? (
            <div className="text-sm text-gray-500">불러오는 중...</div>
          ) : done ? (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                ✅ 사진 {done.deleted}장이 클라우드에서 제거되었습니다.
                {done.cloudFailed > 0 && (
                  <span className="block text-amber-700 text-xs mt-1">
                    (Cloudinary 삭제 실패 {done.cloudFailed}장 — DB는 정리됨)
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• ZIP 파일은 외부에 안전히 보관해주세요. Suplex는 더 이상 보유하지 않습니다.</div>
                <div>• A/S·분쟁 시 동일 출처(체크리스트/리포트/자재요청)에 사진을 다시 업로드하면 복원됩니다.</div>
              </div>
            </div>
          ) : photoCount === 0 ? (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              이 프로젝트에는 외부 보관할 사진이 없습니다.
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div>
                  <span className="text-gray-500">현재 사진:</span>{' '}
                  <span className="font-medium tabular-nums">{photoCount}장</span>
                  <span className="text-xs text-gray-400 ml-2">
                    (작업·체크리스트·리포트 {summary.breakdown.project}장 / 공정 작업 {summary.breakdown.task}장)
                  </span>
                </div>
                {summary.photosArchivedAt && (
                  <div className="text-xs text-amber-700">
                    이전 보관 이력: {new Date(summary.photosArchivedAt).toLocaleString('ko-KR')}
                  </div>
                )}
              </div>

              <Step n={1} label="ZIP 다운로드" done={downloaded}>
                <button
                  onClick={handleDownload}
                  disabled={busy || downloaded}
                  className="text-sm px-3 py-1.5 rounded bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {downloaded ? '✓ 다운로드 완료' : busy ? '다운로드 중...' : '다운로드 시작'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  manifest.json이 함께 들어있어 어느 항목 사진인지 추적 가능합니다.
                </p>
              </Step>

              <Step n={2} label="외부 저장 확인" done={confirmed} disabled={!downloaded}>
                <label className={`flex items-start gap-2 text-sm ${!downloaded ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    disabled={!downloaded}
                    className="mt-0.5"
                  />
                  <span>
                    ZIP 파일을 외부 위치(PC·외장하드·드라이브 등)에 안전하게 저장했습니다.
                  </span>
                </label>
              </Step>

              <Step n={3} label="클라우드에서 영구 제거" disabled={!confirmed}>
                <button
                  onClick={handlePurge}
                  disabled={!confirmed || busy}
                  className="text-sm px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {busy ? '처리 중...' : `사진 ${photoCount}장 영구 제거`}
                </button>
                <p className="text-xs text-rose-700 mt-2">
                  ⚠️ 되돌릴 수 없습니다. 외부 ZIP만이 유일한 보관본이 됩니다.
                </p>
              </Step>
            </>
          )}

          {err && <div className="text-rose-600 text-sm">{err}</div>}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            {done ? '닫기' : '취소'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, done, disabled, children }) {
  return (
    <div className={`border rounded-lg p-3 ${disabled ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {done ? '✓' : n}
        </span>
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <div className="ml-8">{children}</div>
    </div>
  );
}
