// 회사 자산/전체 데이터 JSON 임포트·익스포트 — 슈퍼어드민 전용.
// (구) OWNER Settings 자체 호출 → (신) 어드민 콘솔에서 회사 선택 후 호출.
// 라우트: /api/admin/companies/:companyId/data-transfer/*

import api from './client';

const base = (companyId) => `/admin/companies/${companyId}/data-transfer`;

export const companyAssetsApi = {
  import: (companyId, payload, mode = 'seed') =>
    api.post(`${base(companyId)}/import`, { payload, mode }).then((r) => r.data),
  importFull: (companyId, payload) =>
    api.post(`${base(companyId)}/import-full`, { payload }, { timeout: 5 * 60 * 1000 }).then((r) => r.data),
};

// 다운로드는 axios 가 아닌 fetch 직접 호출(Blob 받기 위해). baseURL 은 axios 와 동일하게 맞춰야
// Vercel rewrite 가 API 요청을 SPA index.html 로 잡지 않음.
async function downloadFrom(path, fallbackName) {
  const token = localStorage.getItem('suplex_token') || localStorage.getItem('splex_token');
  const root = (api.defaults.baseURL || '/api').replace(/\/$/, '');
  const url = `${root}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `내보내기 실패 (${res.status})`);
  }
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

export function downloadCompanyAssets(companyId) {
  return downloadFrom(
    `${base(companyId)}/export`,
    `suplex_assets_${new Date().toISOString().slice(0, 10)}.json`
  );
}

export function downloadFullCompany(companyId) {
  return downloadFrom(
    `${base(companyId)}/export-full`,
    `suplex_full_${new Date().toISOString().slice(0, 10)}.json`
  );
}
