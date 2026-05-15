// 회사 자산 JSON 임포트/익스포트 — OWNER 전용. 락인 시드 + 자산 백업 용.
// 양식·운영 정책은 메모리 `수플렉스_운영_TODO목록.md` 6-F 참조.

import api from './client';

export const companyAssetsApi = {
  // export 는 다운로드 URL — 토큰을 헤더로 보내야 해서 fetch 직접 호출
  exportUrl: () => '/api/company-assets/export',
  import: (payload, mode = 'seed') =>
    api.post('/company-assets/import', { payload, mode }).then((r) => r.data),
};

export async function downloadCompanyAssets() {
  const token = localStorage.getItem('suplex_token');
  const res = await fetch('/api/company-assets/export', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `내보내기 실패 (${res.status})`);
  }
  const blob = await res.blob();
  // filename 은 헤더에서 가져옴 — Content-Disposition 파싱
  let filename = `suplex_assets_${new Date().toISOString().slice(0, 10)}.json`;
  const cd = res.headers.get('content-disposition');
  if (cd) {
    const m = cd.match(/filename="?([^"]+)"?/);
    if (m) filename = decodeURIComponent(m[1]);
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
