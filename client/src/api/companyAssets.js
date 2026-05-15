// 회사 자산 JSON 임포트/익스포트 — OWNER 전용. 락인 시드 + 자산 백업 용.
// 양식·운영 정책은 메모리 `수플렉스_운영_TODO목록.md` 6-F 참조.

import api from './client';

export const companyAssetsApi = {
  // export 는 다운로드 URL — 토큰을 헤더로 보내야 해서 fetch 직접 호출
  exportUrl: () => '/api/company-assets/export',
  import: (payload, mode = 'seed') =>
    api.post('/company-assets/import', { payload, mode }).then((r) => r.data),
  importFull: (payload) =>
    api.post('/company-assets/import-full', { payload }, { timeout: 5 * 60 * 1000 }).then((r) => r.data),
};

// 다운로드는 axios 가 아닌 fetch 직접 호출(Blob 받기 위해). baseURL 은 axios 와 동일하게 맞춰야
// Vercel rewrite 가 API 요청을 SPA index.html 로 잡지 않음. axios.defaults.baseURL 재사용.
async function downloadFrom(path, fallbackName) {
  const token = localStorage.getItem('suplex_token') || localStorage.getItem('splex_token');
  const base = (api.defaults.baseURL || '/api').replace(/\/$/, '');
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `내보내기 실패 (${res.status})`);
  }
  // Content-Type 검증 — Vercel SPA fallback 같은 비정상 응답 거부
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`서버 응답이 JSON 이 아닙니다 (${ct}). API 경로 또는 배포 상태를 확인해주세요.`);
  }
  const blob = await res.blob();
  let filename = fallbackName;
  const cd = res.headers.get('content-disposition');
  if (cd) {
    const m = cd.match(/filename="?([^"]+)"?/);
    if (m) filename = decodeURIComponent(m[1]);
  }
  const dlUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = dlUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(dlUrl);
}

export function downloadCompanyAssets() {
  return downloadFrom(
    '/company-assets/export',
    `suplex_assets_${new Date().toISOString().slice(0, 10)}.json`
  );
}

export function downloadFullCompany() {
  return downloadFrom(
    '/company-assets/export-full',
    `suplex_full_${new Date().toISOString().slice(0, 10)}.json`
  );
}
