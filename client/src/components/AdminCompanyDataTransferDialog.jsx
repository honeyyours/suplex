// 어드민 콘솔용 회사 데이터 전송(export/import) 다이얼로그.
// 회사 OWNER 가 카톡·메일로 요청 → 봉기님이 어드민 콘솔에서 회사 선택 후 처리.
// 4종: 자산 export / 전체 export / 자산 import(Seed) / 전체 import(빈 회사 한정)
import { useRef, useState } from 'react';
import { companyAssetsApi, downloadCompanyAssets, downloadFullCompany } from '../api/companyAssets';

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

export default function AdminCompanyDataTransferDialog({ company, onClose }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [fullResult, setFullResult] = useState(null);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const fullFileRef = useRef(null);

  async function handleExport() {
    setBusy(true); setErr(''); setResult(null); setFullResult(null);
    try {
      await downloadCompanyAssets(company.id);
    } catch (e) {
      setErr(e.message || '내보내기 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleExportFull() {
    setBusy(true); setErr(''); setResult(null); setFullResult(null);
    try {
      await downloadFullCompany(company.id);
    } catch (e) {
      setErr(e.message || '내보내기 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErr(''); setResult(null); setFullResult(null);
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setErr('JSON 파싱 실패: 올바른 회사 자산 파일인지 확인하세요');
      return;
    }
    if (parsed.kind !== 'company-assets') {
      setErr('회사 자산 JSON이 아닙니다. (전체 데이터 파일은 "전체 가져오기" 버튼 사용)');
      return;
    }

    const counts = parsed.counts || {};
    const summary = Object.entries(SECTION_LABELS)
      .map(([k, label]) => `· ${label}: ${counts[k] ?? (parsed[k]?.length || 0)}개`)
      .join('\n');
    const sourceName = parsed.sourceCompanyName ? `\n원본 회사: ${parsed.sourceCompanyName}` : '';
    if (!confirm(
      `[${company.name}] 회사 자산을 임포트합니다. (Seed 모드 — 기존 데이터는 그대로 두고 비어있는 자리에만 채웁니다)${sourceName}\n\n${summary}\n\n진행할까요?`
    )) return;

    setBusy(true);
    try {
      const res = await companyAssetsApi.import(company.id, parsed, 'seed');
      setResult(res.report);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || '임포트 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleFullFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErr(''); setResult(null); setFullResult(null);
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setErr('JSON 파싱 실패: 올바른 전체 데이터 파일인지 확인하세요');
      return;
    }
    if (parsed.kind !== 'company-full') {
      setErr('전체 데이터 JSON 이 아닙니다. ("전체 데이터 내보내기" 로 만든 파일 사용)');
      return;
    }

    const counts = parsed.counts || {};
    const projCount = counts.projects ?? (parsed.projects?.length || 0);
    const sourceName = parsed.sourceCompanyName ? `\n원본 회사: ${parsed.sourceCompanyName}` : '';
    if (!confirm(
      `⚠️ [${company.name}] 전체 데이터 가져오기는 빈 회사에서만 가능합니다.${sourceName}\n\n프로젝트 ${projCount}개 + 회사 자산 9종 + 모든 하위 데이터(견적·마감재·지출·발주·일정·체크리스트·메모·사진 등)를 통째로 가져옵니다.\n\n진행할까요?`
    )) return;

    setBusy(true);
    try {
      const res = await companyAssetsApi.importFull(company.id, parsed);
      setFullResult(res.report);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || '전체 가져오기 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-navy-800">📦 {company.name} — 데이터 전송</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            회사 OWNER 의 요청을 받아 어드민이 처리하는 통로입니다. 자산만(거래처·템플릿·룰·견적가이드·회계 9종)
            또는 전체(자산 + 모든 프로젝트 데이터) 단위로 내보내거나 가져올 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-navy-200 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
              title="거래처·템플릿·룰·견적가이드 등 9종 회사 자산만"
            >
              💾 자산만 내보내기
            </button>
            <button
              onClick={handleExportFull}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-navy-300 bg-navy-50 text-navy-800 rounded hover:bg-navy-100 disabled:opacity-50 font-medium"
              title="자산 9종 + 모든 프로젝트(견적·마감재·일정·지출·메모·발주·사진 등) 통째 백업"
            >
              📦 전체 데이터 내보내기
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-navy-200 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
            >
              📥 자산 가져오기 (Seed)
            </button>
            <button
              onClick={() => fullFileRef.current?.click()}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100 disabled:opacity-50 font-medium"
              title="빈 회사에서만 사용 가능. 프로젝트 통째로 가져옴"
            >
              🌱 전체 데이터 가져오기 (빈 회사 한정)
            </button>
            {busy && <span className="text-xs text-gray-400 self-center">처리 중... (큰 데이터는 1-2분 걸릴 수 있어요)</span>}
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
          <input ref={fullFileRef} type="file" accept=".json,application/json" onChange={handleFullFile} className="hidden" />

          {err && (
            <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2 whitespace-pre-line">
              {err}
            </div>
          )}

          {result && (
            <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              <div className="font-medium mb-1">✅ 자산 가져오기 완료</div>
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

          {fullResult && (
            <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              <div className="font-medium mb-1">🌱 전체 데이터 가져오기 완료</div>
              <ul className="text-xs space-y-0.5">
                <li>· 회사 메타: {fullResult.company ? '업데이트' : '변경 없음'}</li>
                <li>· 거래처: <b>{fullResult.vendors?.inserted || 0}개</b></li>
                <li>· 마감재 템플릿: <b>{fullResult.materialTemplates || 0}개</b></li>
                <li>· 견적 라인: <b>{fullResult.quoteLineItemTemplates || 0}개</b></li>
                <li>· 공정 룰 4종: 키워드 {fullResult.phaseKeywordRules}, 데드라인 {fullResult.phaseDeadlineRules}, 어드바이스 {fullResult.phaseAdvices}, 가이드 {fullResult.companyPhaseTips}</li>
                <li>· 회계: 계정과목 {fullResult.accountCodes}, 자동분류 룰 {fullResult.expenseCategoryRules}</li>
                <li className="pt-1 border-t border-emerald-200">· <b>프로젝트 {fullResult.projects}개</b></li>
                <li>· 견적: 상세 {fullResult.quotes}({fullResult.quoteLines}줄) · 간편 {fullResult.simpleQuotes}({fullResult.simpleQuoteLines}줄)</li>
                <li>· 마감재 {fullResult.materials} · 발주 {fullResult.purchaseOrders} · 지출 <b>{fullResult.expenses}</b></li>
                <li>· 일정 {fullResult.dailyScheduleEntries} · 체크 {fullResult.checklists} · 메모 {fullResult.projectMemos} · 사진 {fullResult.photos}</li>
                <li>· 변경 이력 {fullResult.scheduleChanges} · 공정메모 {fullResult.phaseNotes} · 정산메모 {fullResult.settlementNotes}</li>
                <li>· 현장보고 {fullResult.dailyReports} · 수량 {fullResult.measurements} · 자재요청 {fullResult.materialRequests}</li>
              </ul>
            </div>
          )}

          <div className="text-[11px] text-gray-400 mt-4 leading-relaxed space-y-1">
            <p>
              <b>자산만</b>: 거래처·템플릿·룰 9종. Seed 모드는 기존 데이터를 절대 덮어쓰지 않고 비어있는 자리에만 추가합니다.
            </p>
            <p>
              <b>전체 데이터</b>: 자산 9종 + 모든 프로젝트(견적·마감재·일정·지출·메모·발주·사진) 통째.
              가져오기는 <b>빈 회사에서만 가능</b>합니다 (기존 프로젝트가 있으면 거부). 전체 import 는 대상 회사에 OWNER 가 1명 이상 있어야 합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
