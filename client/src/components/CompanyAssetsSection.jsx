// 회사 자산 가져오기/내보내기 — OWNER 전용 (Settings 페이지에서 렌더).
// 신규 인테리어 업체 락인 시드 + 자산 백업 용도. 9개 모델 한 번에.
import { useRef, useState } from 'react';
import { companyAssetsApi, downloadCompanyAssets } from '../api/companyAssets';

const SECTION_LABELS = {
  vendors: '거래처',
  materialTemplates: '마감재 템플릿',
  quoteLineItemTemplates: '견적 라인 마스터',
  phaseKeywordRules: '공정 키워드 룰',
  phaseDeadlineRules: '공정 데드라인 룰',
  phaseAdvices: '공정 어드바이스 (체크리스트)',
  companyPhaseTips: '공정별 견적 가이드',
  accountCodes: '회계 계정과목',
  expenseCategoryRules: '지출 자동분류 룰',
};

export default function CompanyAssetsSection() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  async function handleExport() {
    setBusy(true); setErr(''); setResult(null);
    try {
      await downloadCompanyAssets();
    } catch (e) {
      setErr(e.message || '내보내기 실패');
    } finally {
      setBusy(false);
    }
  }

  function triggerImport() {
    fileRef.current?.click();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErr(''); setResult(null);
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setErr('JSON 파싱 실패: 올바른 회사 자산 파일인지 확인하세요');
      return;
    }
    if (parsed.kind !== 'company-assets') {
      setErr('회사 자산 JSON이 아닙니다. 프로젝트 백업·어드민 백업 파일은 임포트할 수 없습니다.');
      return;
    }

    const counts = parsed.counts || {};
    const summary = Object.entries(SECTION_LABELS)
      .map(([k, label]) => `· ${label}: ${counts[k] ?? (parsed[k]?.length || 0)}개`)
      .join('\n');
    const sourceName = parsed.sourceCompanyName ? `\n원본 회사: ${parsed.sourceCompanyName}` : '';
    if (!confirm(
      `회사 자산을 임포트합니다. (Seed 모드 — 기존 데이터는 그대로 두고 비어있는 자리에만 채웁니다)${sourceName}\n\n${summary}\n\n진행할까요?`
    )) return;

    setBusy(true);
    try {
      const res = await companyAssetsApi.import(parsed, 'seed');
      setResult(res.report);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || '임포트 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="text-sm font-semibold text-navy-800 mb-1">회사 자산 가져오기 / 내보내기</div>
      <p className="text-xs text-gray-500 mb-3">
        거래처·마감재 템플릿·공정 룰·견적 가이드·회계 설정 등 9종 회사 자산을 JSON으로 옮깁니다.
        프로젝트·일정·지출 같은 운영 데이터는 포함되지 않습니다.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          disabled={busy}
          className="text-sm px-3 py-1.5 border border-navy-200 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
        >
          💾 JSON 내보내기
        </button>
        <button
          onClick={triggerImport}
          disabled={busy}
          className="text-sm px-3 py-1.5 border border-navy-200 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
        >
          📥 JSON 가져오기 (Seed)
        </button>
        {busy && <span className="text-xs text-gray-400 self-center">처리 중...</span>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
      />

      {err && (
        <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2 whitespace-pre-line">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          <div className="font-medium mb-1">✅ 임포트 완료</div>
          <ul className="text-xs space-y-0.5">
            {Object.entries(SECTION_LABELS).map(([k, label]) => {
              const inserted = result.inserted?.[k];
              const skipped = result.skipped?.[k];
              if (inserted === undefined && skipped === undefined) return null;
              return (
                <li key={k}>
                  · {label}: <b>{inserted || 0}개 추가</b>
                  {skipped ? <span className="text-gray-500"> (중복 {skipped}개 스킵)</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        Seed 모드: 기존 데이터를 절대 덮어쓰지 않고, 비어있는 자리에만 추가합니다.
        같은 거래처·템플릿이 이미 있으면 자동으로 건너뜁니다.
        외부 AI(ChatGPT·Claude 등)에게 양식 문서를 주고 JSON을 만들게 한 뒤 임포트할 수 있습니다.
      </p>
    </div>
  );
}
