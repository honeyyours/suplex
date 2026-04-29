import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import BackupMenu from '../components/BackupMenu';
import api from '../api/client';
import { companyApi } from '../api/company';
import { quoteTemplatesApi } from '../api/quoteTemplates';
import { phaseKeywordsApi } from '../api/phaseKeywords';
import { phaseDeadlinesApi, phaseAdvicesApi, phasePresetApi } from '../api/phaseRules';
import { companyPhaseTipsApi, GENERAL_PHASE } from '../api/companyPhaseTips';
import { hasFeature, F } from '../utils/features';
import PlanBadge from '../components/PlanBadge';
import { applianceSpecsApi } from '../api/applianceSpecs';
import { phasesApi } from '../api/phases';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import { RATE_META, WORK_TYPES, WORK_TYPE_LABEL, formatWon, parseWon } from '../api/quotes';
import { toCSV, parseCSV, downloadFile, readFileAsText } from '../utils/csv';
import { normalizePhase, isOther, STANDARD_PHASES } from '../utils/phases';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

// phase 입력 시 표준 25개로 정규화 — 변환되거나 '기타'면 사용자 확인
// 반환: 정규화된 라벨 또는 null(취소)
function confirmPhaseInput(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  const phase = normalizePhase(trimmed);
  if (phase.label === trimmed) return phase.label;
  const msg = isOther(phase.label)
    ? `"${trimmed}"는 표준 25개 공정에 없어 "${phase.label}"으로 저장됩니다.\n` +
      `· 통합 기능(D-N 룰·자동 발주·AI비서 통합 답변)이 작동하지 않습니다.\n계속하시겠어요?`
    : `"${trimmed}" → 표준 공정 "${phase.label}"으로 자동 저장됩니다. 계속하시겠어요?`;
  return confirm(msg) ? phase.label : null;
}

export default function Settings() {
  const { auth, logout, updateMe, patchCompany } = useAuth();
  const isOwner = auth?.role === 'OWNER';
  const [company, setCompany] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    companyApi.get().then((d) => {
      setCompany(d.company);
      // auth.company 와 동기화 (네비/탭/AI비서 가드용)
      if (typeof d.company?.hideExpenses === 'boolean') {
        patchCompany?.({ hideExpenses: d.company.hideExpenses });
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEditName() {
    setNameDraft(auth?.user?.name || '');
    setEditingName(true);
  }
  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      await updateMe({ name: trimmed });
      setEditingName(false);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-navy-800">설정</h1>

      <CompanyInfoSection company={company} onSaved={setCompany} canEdit={isOwner} />

      {/* 지출 숨김 토글 — 베타엔 숨김. 정식 출시 시 권한 시스템(Feature Flag · 직책 디폴트 권한)에 흡수 예정.
          코드는 보존 (FeatureTogglesSection 함수 + companyApi.patch hideExpenses 그대로). */}
      {/* <FeatureTogglesSection company={company} onSaved={setCompany} canEdit={isOwner} /> */}

      <QuoteRatesSection company={company} onSaved={setCompany} canEdit={isOwner} />

      {/* 견적항목 템플릿 — 상세 견적 시스템과 함께 베타엔 숨김. 코드·API·백엔드는 보존
          (메모리 핵심결정: "상세 견적 시스템은 숨김만, 삭제 X"). */}
      {/* <QuoteTemplatesSection /> */}

      <PhaseLabelsSection canEdit={isOwner} />

      <PhaseKeywordsSection />

      <PhaseDeadlineRulesSection />

      <PhaseAdvicesSection />

      <CompanyPhaseTipsSection auth={auth} />

      <ApplianceSpecsSection canEdit={isOwner} />

      <Section title="내 계정">
        <div className="flex items-center py-2 border-b text-sm">
          <span className="w-24 text-gray-500">이름</span>
          {editingName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  else if (e.key === 'Escape') setEditingName(false);
                }}
                autoFocus
                className="flex-1 max-w-xs text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
              />
              <button
                onClick={saveName}
                disabled={savingName || !nameDraft.trim()}
                className="text-sm px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
              >저장</button>
              <button
                onClick={() => setEditingName(false)}
                className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
              >취소</button>
            </div>
          ) : (
            <>
              <span className="text-gray-800 flex-1">
                {auth?.user?.name || <span className="text-gray-400 italic">—</span>}
              </span>
              <button
                onClick={startEditName}
                className="text-xs px-2 py-1 text-navy-700 hover:bg-navy-50 rounded"
              >✏️ 수정</button>
            </>
          )}
        </div>
        <Row label="이메일" value={auth?.user?.email} />
        <Row label="권한" value={roleLabel(auth?.role)} />
        <ChangePasswordRow />
        <div className="pt-3">
          <button
            onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }}
            className="text-sm px-4 py-2 border border-rose-300 text-rose-600 rounded hover:bg-rose-50"
          >
            로그아웃
          </button>
        </div>
      </Section>

      <Section title="데이터 백업">
        <p className="text-sm text-gray-500 mb-3">
          회사 전체 데이터를 JSON으로 내보내거나, 백업 파일에서 프로젝트를 복원합니다.
        </p>
        <BackupMenu />
      </Section>
    </div>
  );
}

// ============================================
// 회사 정보 (견적서 갑지 우측 상단에 표시됨)
// ============================================
function CompanyInfoSection({ company, onSaved, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setForm({
      name: company.name || '',
      phone: company.phone || '',
      address: company.address || '',
      email: company.email || '',
      bizNumber: company.bizNumber || '',
      representative: company.representative || '',
      logoUrl: company.logoUrl || '',
    });
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    try {
      const { company: updated } = await companyApi.update(form);
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  if (!company) return <Section title="회사 정보"><div className="text-sm text-gray-400">불러오는 중...</div></Section>;

  return (
    <Section title="회사 정보 (견적서 갑지에 표시)">
      {!editing ? (
        <>
          <div className="flex items-center py-2 border-b text-sm">
            <span className="w-24 text-gray-500">현재 등급</span>
            <span className="flex items-center gap-2 flex-1">
              <PlanBadge plan={company.plan} size="md" />
              <span className="text-[11px] text-gray-400">사용 중인 구독 등급입니다</span>
            </span>
          </div>
          <Row label="회사명" value={company.name} />
          <Row label="대표자명" value={company.representative} />
          <Row label="사업자번호" value={company.bizNumber} />
          <Row label="주소" value={company.address} />
          <Row label="전화" value={company.phone} />
          <Row label="이메일" value={company.email} />
          {canEdit && (
            <div className="pt-3">
              <button onClick={startEdit} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">✏️ 편집</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="회사명" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FormField label="대표자명" value={form.representative} onChange={(v) => setForm({ ...form, representative: v })} />
            <FormField label="사업자번호" value={form.bizNumber} onChange={(v) => setForm({ ...form, bizNumber: v })} />
            <FormField label="전화" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <FormField label="이메일" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <FormField label="로고 URL (선택)" value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} />
          </div>
          <FormField label="주소" value={form.address} onChange={(v) => setForm({ ...form, address: v })} full />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">취소</button>
            <button onClick={save} disabled={busy} className="px-5 py-2 bg-navy-700 text-white rounded text-sm hover:bg-navy-800 disabled:opacity-50">
              {busy ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// 기능 토글 — 회사 단위 ON/OFF (현재: 지출관리 숨김)
// ============================================
function FeatureTogglesSection({ company, onSaved, canEdit }) {
  const { patchCompany } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!company) return null;

  async function toggleHideExpenses(next) {
    if (busy) return;
    setBusy(true);
    try {
      const { company: updated } = await companyApi.update({ hideExpenses: next });
      onSaved(updated);
      patchCompany?.({ hideExpenses: updated.hideExpenses });
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  const hidden = !!company.hideExpenses;

  return (
    <Section title="기능 표시 설정">
      <div className="flex items-start justify-between gap-4 py-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800">지출관리 기능 숨김</div>
          <div className="text-xs text-gray-500 mt-1 leading-relaxed">
            ON이면 상위 네비의 <b>지출관리·AI비서</b>, 프로젝트의 <b>지출 탭</b>, 홈의 <b>지출 활동</b>이 모두 숨겨집니다.
            데이터는 그대로 보존되며, 토글을 OFF하면 즉시 복구됩니다.
            {' '}직원에게 계정을 공유할 때 회계 데이터를 가리는 용도로 사용하세요.
          </div>
        </div>
        {canEdit ? (
          <button
            onClick={() => toggleHideExpenses(!hidden)}
            disabled={busy}
            className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
              hidden ? 'bg-rose-500' : 'bg-gray-300'
            } disabled:opacity-50`}
            title={hidden ? '클릭해서 표시' : '클릭해서 숨김'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                hidden ? 'translate-x-6' : ''
              }`}
            />
          </button>
        ) : (
          <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${hidden ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
            {hidden ? '숨김 ON' : '표시 중'}
          </span>
        )}
      </div>
    </Section>
  );
}

// ============================================
// 견적 기본 비율 (12개) — 새 견적 작성 시 이 값이 스냅샷됨
// ============================================
function QuoteRatesSection({ company, onSaved, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  function startEdit() {
    const initial = {};
    for (const m of RATE_META) initial[m.key] = String(Number(company[m.key] ?? 0));
    setForm(initial);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {};
      for (const m of RATE_META) {
        const n = Number(form[m.key]);
        if (Number.isFinite(n)) payload[m.key] = n;
      }
      const { company: updated } = await companyApi.update(payload);
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  if (!company) return null;

  return (
    <Section title="견적 기본 비율 (% 단위)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        새 견적 작성 시 이 값이 견적에 스냅샷됩니다. 견적별로 따로 조정 가능.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">항목</th>
              <th className="text-left px-3 py-2">계산식</th>
              <th className="text-right px-3 py-2 w-32">비율 (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {RATE_META.map((m) => (
              <tr key={m.key}>
                <td className="px-3 py-2 text-navy-800 font-medium">{m.label}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{m.formula}</td>
                <td className="px-3 py-2 text-right">
                  {editing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={form[m.key]}
                      onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                      className="w-24 text-right border rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="tabular-nums">{Number(company[m.key]).toFixed(2)}%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <div className="flex justify-end gap-2 pt-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">취소</button>
              <button onClick={save} disabled={busy} className="px-5 py-2 bg-navy-700 text-white rounded text-sm hover:bg-navy-800 disabled:opacity-50">
                {busy ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">✏️ 편집</button>
          )}
        </div>
      )}
    </Section>
  );
}

// ============================================
// 견적 항목 템플릿 (회사 단위 마스터 — 자주 쓰는 자재/단가)
// ============================================
function QuoteTemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('CARPENTRY');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);

  async function reload() {
    setLoading(true);
    try {
      const { templates } = await quoteTemplatesApi.list();
      setTemplates(templates);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  function startAdd() {
    setForm({
      workType: activeType,
      itemName: '',
      spec: '',
      unit: '',
      defaultQuantity: 1,
      defaultMaterialPrice: 0,
      defaultLaborPrice: 0,
      defaultExpensePrice: 0,
    });
    setAdding(true);
    setEditingId(null);
  }

  function startEdit(tpl) {
    setForm({
      workType: tpl.workType,
      itemName: tpl.itemName,
      spec: tpl.spec || '',
      unit: tpl.unit || '',
      defaultQuantity: Number(tpl.defaultQuantity),
      defaultMaterialPrice: Number(tpl.defaultMaterialPrice),
      defaultLaborPrice: Number(tpl.defaultLaborPrice),
      defaultExpensePrice: Number(tpl.defaultExpensePrice),
    });
    setEditingId(tpl.id);
    setAdding(false);
  }

  async function saveForm() {
    try {
      if (editingId) {
        await quoteTemplatesApi.update(editingId, form);
      } else {
        await quoteTemplatesApi.create(form);
      }
      setForm(null);
      setAdding(false);
      setEditingId(null);
      reload();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function remove(id) {
    if (!confirm('이 템플릿을 삭제할까요?')) return;
    await quoteTemplatesApi.remove(id);
    reload();
  }

  const filtered = templates.filter((t) => t.workType === activeType);

  const fileInputRef = useRef(null);

  async function handleSeed() {
    const force = templates.length > 0;
    const msg = force
      ? `이미 ${templates.length}개 템플릿이 있습니다.\n\n전부 삭제하고 PDF 양식 기준 기본 템플릿으로 다시 시드할까요?`
      : 'PDF 견적서(현진에버빌 3차) 기준 기본 템플릿(약 50개)을 일괄 추가할까요?';
    if (!confirm(msg)) return;
    try {
      const { created } = await quoteTemplatesApi.seed(force);
      alert(`✅ ${created}개 템플릿이 추가되었습니다`);
      reload();
    } catch (e) {
      alert('시드 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  function handleExport() {
    if (templates.length === 0) {
      alert('내보낼 템플릿이 없습니다');
      return;
    }
    const header = ['공종', '항목', '규격', '단위', '기본수량', '재료단가', '노무단가', '경비단가'];
    const rows = [header];
    // 공종 enum 순서 → 그 안에서 orderIndex 순서
    const sorted = [...templates].sort((a, b) => {
      const ai = WORK_TYPES.findIndex((w) => w.key === a.workType);
      const bi = WORK_TYPES.findIndex((w) => w.key === b.workType);
      if (ai !== bi) return ai - bi;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });
    for (const t of sorted) {
      rows.push([
        WORK_TYPE_LABEL[t.workType] || t.workType,
        t.itemName,
        t.spec || '',
        t.unit || '',
        Number(t.defaultQuantity),
        Number(t.defaultMaterialPrice),
        Number(t.defaultLaborPrice),
        Number(t.defaultExpensePrice),
      ]);
    }
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(`suplex_quote_templates_${today}.csv`, toCSV(rows));
  }

  async function handleImportFile(file) {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      if (rows.length < 2) {
        alert('CSV에 데이터가 없습니다 (헤더 + 최소 1행 필요)');
        return;
      }

      // 공종 한글/영문 모두 허용
      const labelToKey = {};
      WORK_TYPES.forEach((w) => { labelToKey[w.label] = w.key; labelToKey[w.key] = w.key; });

      // 첫 행을 헤더로 가정. 헤더 위치로 컬럼 매핑.
      const header = rows[0].map((h) => h.trim());
      const idx = (name) => header.findIndex((h) => h === name);
      const cols = {
        workType: idx('공종'),
        itemName: idx('항목'),
        spec: idx('규격'),
        unit: idx('단위'),
        qty: idx('기본수량'),
        mat: idx('재료단가'),
        lab: idx('노무단가'),
        exp: idx('경비단가'),
      };
      if (cols.workType < 0 || cols.itemName < 0) {
        alert('CSV 헤더에 "공종", "항목" 컬럼이 필요합니다');
        return;
      }

      const items = [];
      const skipped = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const wtRaw = (r[cols.workType] || '').trim();
        const wt = labelToKey[wtRaw];
        const itemName = (r[cols.itemName] || '').trim();
        if (!wt || !itemName) {
          skipped.push(`${i + 1}행: 공종("${wtRaw}") 또는 항목 누락`);
          continue;
        }
        items.push({
          workType: wt,
          itemName,
          spec: cols.spec >= 0 ? (r[cols.spec] || '').trim() : null,
          unit: cols.unit >= 0 ? (r[cols.unit] || '').trim() : null,
          defaultQuantity: cols.qty >= 0 ? Number(r[cols.qty]) || 1 : 1,
          defaultMaterialPrice: cols.mat >= 0 ? Number(r[cols.mat]) || 0 : 0,
          defaultLaborPrice: cols.lab >= 0 ? Number(r[cols.lab]) || 0 : 0,
          defaultExpensePrice: cols.exp >= 0 ? Number(r[cols.exp]) || 0 : 0,
        });
      }
      if (items.length === 0) {
        alert('가져올 유효한 행이 없습니다.\n\n' + skipped.slice(0, 5).join('\n'));
        return;
      }

      const summary = `CSV에서 ${items.length}개 항목 발견${skipped.length > 0 ? ` (${skipped.length}개 스킵)` : ''}.\n\n기존 ${templates.length}개에 추가할까요? (기존 항목은 유지됩니다)`;
      if (!confirm(summary)) return;

      const { created } = await quoteTemplatesApi.bulk(items);
      alert(`✅ ${created}개 추가됨`);
      reload();
    } catch (e) {
      alert('가져오기 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <Section title="견적 항목 템플릿 (회사 마스터)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        자주 쓰는 자재/단가를 공종별로 저장. 견적 작성 시 "📋 템플릿에서 가져오기"로 라인 일괄 추가.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={handleSeed}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 PDF 양식 기준 기본 시드 ({templates.length > 0 ? '재시드' : '추가'})
        </button>
        <button
          onClick={handleExport}
          className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          📥 CSV 내보내기 ({templates.length}개)
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          📤 CSV 가져오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleImportFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      <div className="flex flex-wrap gap-1 border-b mb-3 pb-2">
        {WORK_TYPES.map((w) => {
          const cnt = templates.filter((t) => t.workType === w.key).length;
          const active = activeType === w.key;
          return (
            <button
              key={w.key}
              onClick={() => setActiveType(w.key)}
              className={`text-xs px-2.5 py-1 rounded ${
                active ? 'bg-navy-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {w.label} {cnt > 0 && <span className="opacity-70">({cnt})</span>}
            </button>
          );
        })}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && filtered.length === 0 && !adding && (
        <div className="text-center py-6 text-sm text-gray-400">
          {WORK_TYPE_LABEL[activeType]} 공종에 등록된 템플릿이 없습니다.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-2 py-1.5">항목명</th>
                <th className="text-left px-2 py-1.5">규격</th>
                <th className="text-left px-2 py-1.5 w-12">단위</th>
                <th className="text-right px-2 py-1.5 w-16">기본수량</th>
                <th className="text-right px-2 py-1.5 w-24">재료단가</th>
                <th className="text-right px-2 py-1.5 w-24">노무단가</th>
                <th className="text-right px-2 py-1.5 w-24">경비단가</th>
                <th className="px-2 py-1.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 text-navy-800">{t.itemName}</td>
                  <td className="px-2 py-1.5 text-gray-600">{t.spec}</td>
                  <td className="px-2 py-1.5 text-center">{t.unit}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{Number(t.defaultQuantity)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultMaterialPrice)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultLaborPrice)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatWon(t.defaultExpensePrice)}</td>
                  <td className="px-2 py-1.5 text-right text-xs">
                    <button onClick={() => startEdit(t)} className="text-navy-700 hover:underline mr-2">편집</button>
                    <button onClick={() => remove(t.id)} className="text-rose-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(adding || editingId) && form && (
        <div className="mt-3 p-3 bg-gray-50 border rounded space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <FormField label="항목명" value={form.itemName} onChange={(v) => setForm({ ...form, itemName: v })} />
            <FormField label="규격" value={form.spec} onChange={(v) => setForm({ ...form, spec: v })} />
            <FormField label="단위" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
            <FormField label="기본수량" type="number" step="0.01" value={form.defaultQuantity} onChange={(v) => setForm({ ...form, defaultQuantity: Number(v) || 0 })} />
            <FormField label="재료 단가" type="number" value={form.defaultMaterialPrice} onChange={(v) => setForm({ ...form, defaultMaterialPrice: Number(v) || 0 })} />
            <FormField label="노무 단가" type="number" value={form.defaultLaborPrice} onChange={(v) => setForm({ ...form, defaultLaborPrice: Number(v) || 0 })} />
            <FormField label="경비 단가" type="number" value={form.defaultExpensePrice} onChange={(v) => setForm({ ...form, defaultExpensePrice: Number(v) || 0 })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setAdding(false); setEditingId(null); setForm(null); }} className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">취소</button>
            <button onClick={saveForm} className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800">저장</button>
          </div>
        </div>
      )}

      {!adding && !editingId && (
        <div className="pt-3">
          <button onClick={startAdd} className="text-sm px-4 py-2 border rounded hover:bg-gray-50">
            + {WORK_TYPE_LABEL[activeType]} 항목 추가
          </button>
        </div>
      )}
    </Section>
  );
}

// 시스템 프리셋 리셋 버튼 — 4묶음 각 섹션에 공통으로 사용.
// 클릭 → 표준 회사 데이터로 해당 묶음만 갱신 → 페이지 새로고침으로 화면 반영.
// (각 섹션의 reload 패턴이 달라 단순한 풀 리로드가 가장 안전·확실)
const PRESET_BUNDLE_LABELS = {
  phaseLabels: '공정 표시 라벨',
  phaseKeywordRules: '공종 인식 키워드',
  phaseDeadlineRules: '공정별 발주 데드라인',
  phaseAdvices: '공정 어드바이스',
  companyPhaseTips: '공정별 견적 가이드',
};
function PresetResetButton({ bundle }) {
  const [busy, setBusy] = useState(false);
  const label = PRESET_BUNDLE_LABELS[bundle] || bundle;
  async function reset() {
    if (!confirm(
      `🌟 시스템 프리셋: "${label}"을 표준 회사 데이터로 리셋합니다.\n\n` +
      `· 현재 회사의 ${label} 데이터는 모두 삭제 후 표준값으로 갱신됩니다\n` +
      `· 다른 묶음(라벨·키워드·데드라인·어드바이스)은 영향 없습니다\n` +
      `· 표준 회사가 지정돼 있어야 동작합니다\n\n` +
      `계속하시겠습니까?`
    )) return;
    setBusy(true);
    try {
      const r = await phasePresetApi.reset(bundle);
      alert(`✅ 리셋 완료 (${r.count}개 적용). 화면을 새로고침합니다.`);
      window.location.reload();
    } catch (e) {
      alert('리셋 실패: ' + (e.response?.data?.error || e.message));
      setBusy(false);
    }
  }
  return (
    <button
      onClick={reset}
      disabled={busy}
      title={`시스템 프리셋 표준 회사의 ${label}로 리셋`}
      className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-40"
    >🌟 프리셋 리셋</button>
  );
}

function PhaseLabelsSection({ canEdit }) {
  const { phaseLabels, save } = usePhaseLabels();
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...(phaseLabels || {}) });
  }, [phaseLabels]);

  const dirty = STANDARD_PHASES.some((p) => {
    const a = (draft?.[p.key] || '').trim();
    const b = (phaseLabels?.[p.key] || '').trim();
    return a !== b;
  });

  async function handleSave() {
    setSaving(true);
    try {
      await save(draft);
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!confirm('표시 라벨을 모두 초기화할까요? (내부 표준 라벨로 되돌립니다)')) return;
    setDraft({});
  }

  return (
    <Section
      title="공정 표시 라벨 (회사 커스터마이즈)"
      collapsible
      hint="표준 25개 공정의 화면 표시명만 회사 마음대로 바꿀 수 있어요. 매칭/그룹핑은 표준 라벨 기준으로 그대로 유지됩니다."
    >
      <div className="text-xs text-gray-500 mb-3 leading-relaxed">
        💡 예: "마무리(점검, 실리콘)" → "마무리" / "창호·샷시" → "샷시" / "유리·거울" → "유리"<br />
        💡 비워두면 표준 라벨이 표시됩니다. 자동 인식 키워드는 별도 섹션에서 관리하세요.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STANDARD_PHASES.filter((p) => p.key !== 'OTHER').map((p) => {
          const value = draft?.[p.key] || '';
          return (
            <label key={p.key} className="flex items-center gap-2 text-sm">
              <span className="w-32 shrink-0 text-gray-600 tabular-nums">
                <span className="text-gray-400 text-[11px] mr-1">{String(p.order).padStart(2, '0')}</span>
                {p.label}
              </span>
              <input
                type="text"
                value={value}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                placeholder={p.label}
                disabled={!canEdit}
                maxLength={30}
                className="flex-1 text-sm px-2 py-1 border rounded focus:border-navy-700 outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>
          );
        })}
      </div>
      {canEdit && (
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-40"
          >{saving ? '저장 중...' : '저장'}</button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
          >전체 초기화</button>
          <PresetResetButton bundle="phaseLabels" />
          {dirty && <span className="text-xs text-amber-700">변경 사항이 있습니다</span>}
        </div>
      )}
      {!canEdit && (
        <div className="text-xs text-gray-400 mt-3">OWNER만 편집할 수 있습니다.</div>
      )}
    </Section>
  );
}

function PhaseKeywordsSection() {
  const queryClient = useQueryClient();
  const phases = useCompanyPhases();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(phases[0]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newPhaseModal, setNewPhaseModal] = useState(false);
  const [newPhase, setNewPhase] = useState({ name: '', keyword: '' });

  async function reload() {
    setLoading(true);
    try {
      const { rules } = await phaseKeywordsApi.list();
      setRules(rules);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function addNewPhase() {
    const rawName = newPhase.name.trim();
    const keyword = newPhase.keyword.trim();
    if (!rawName || !keyword) {
      alert('공정명과 첫 키워드를 모두 입력해주세요.');
      return;
    }
    const name = confirmPhaseInput(rawName);
    if (!name) return;
    try {
      await phaseKeywordsApi.create({ phase: name, keyword });
      setNewPhaseModal(false);
      setNewPhase({ name: '', keyword: '' });
      await queryClient.invalidateQueries({ queryKey: ['phases'] });
      setActivePhase(name);
      reload();
    } catch (e) {
      alert('공정 추가 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function removeActivePhase() {
    const target = activePhase;
    if (!target) return;
    const msg = `"${target}" 공정을 삭제하시겠습니까?\n\n` +
      `· 이 공정의 키워드 / D-N 룰 / 어드바이스가 모두 삭제됩니다.\n` +
      `· 과거 일정의 공정 표시는 그대로 보존됩니다.\n` +
      `· 신규 일정에서는 더 이상 자동 인식되지 않습니다.`;
    if (!confirm(msg)) return;
    try {
      const { deleted } = await phasesApi.remove(target);
      await queryClient.invalidateQueries({ queryKey: ['phases'] });
      // 첫 번째 남은 phase로 이동 (없으면 fallback 첫 번째)
      const remaining = phases.filter((p) => p !== target);
      setActivePhase(remaining[0] || phases[0]);
      reload();
      alert(`✅ "${target}" 삭제 완료\n키워드 ${deleted.keywords}개, D-N 룰 ${deleted.deadlines}개, 어드바이스 ${deleted.advices}개`);
    } catch (e) {
      alert('공정 삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function add() {
    const k = newKeyword.trim();
    if (!k) return;
    try {
      await phaseKeywordsApi.create({ keyword: k, phase: activePhase });
      setNewKeyword('');
      reload();
    } catch (e) {
      alert('추가 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function remove(id) {
    await phaseKeywordsApi.remove(id);
    reload();
  }

  async function toggleActive(rule) {
    await phaseKeywordsApi.update(rule.id, { active: !rule.active });
    reload();
  }

  async function handleSeed() {
    const force = rules.length > 0;
    const msg = force
      ? `이미 ${rules.length}개 키워드가 있습니다.\n\n전부 삭제하고 기본값으로 다시 시드할까요?`
      : '공종별 기본 키워드 (약 35개) 를 추가할까요?';
    if (!confirm(msg)) return;
    try {
      const { created } = await phaseKeywordsApi.seed(force);
      alert(`✅ ${created}개 키워드가 추가되었습니다`);
      reload();
    } catch (e) {
      alert('시드 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 옛 row(closed 25 정책 이전 시드된 비표준 phase 라벨)도 정규화 기준으로 묶어 표시.
  // 백엔드 unique 제약은 (companyId, keyword) 기반이라, UI 그루핑이 정확 일치만 하면
  // 옛 row가 보이지 않은 채 "이미 등록된 키워드" 가 떠서 사용자가 혼란.
  const phaseEq = (rulePhase, target) => {
    if (!rulePhase) return false;
    if (rulePhase === target) return true;
    return normalizePhase(rulePhase).label === target;
  };
  const filtered = rules.filter((r) => phaseEq(r.phase, activePhase));

  return (
    <Section title="공종 자동 인식 키워드" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        일정 입력 시 내용에 키워드가 포함되면 해당 공종으로 자동 분류 → 체크리스트 자동 생성에 연결됩니다.
        예: "철거" 키워드가 있으면 일정 "거실 철거"는 철거 공종으로 인식.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={handleSeed}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 기본 시드 ({rules.length > 0 ? '재시드' : '추가'})
        </button>
        <PresetResetButton bundle="phaseKeywordRules" />
      </div>

      <div className="flex flex-wrap gap-1 border-b mb-3 pb-2">
        {phases.map((p) => {
          const cnt = rules.filter((r) => phaseEq(r.phase, p)).length;
          const active = activePhase === p;
          return (
            <button
              key={p}
              onClick={() => setActivePhase(p)}
              className={`text-xs px-2.5 py-1 rounded ${
                active ? 'bg-navy-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p} {cnt > 0 && <span className="opacity-70">({cnt})</span>}
            </button>
          );
        })}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {filtered.map((r) => (
          <span
            key={r.id}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${
              r.active ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
            }`}
          >
            <button
              onClick={() => toggleActive(r)}
              title={r.active ? '비활성화' : '활성화'}
              className="hover:text-navy-700"
            >
              {r.keyword}
            </button>
            <button
              onClick={() => remove(r.id)}
              title="삭제"
              className="text-gray-400 hover:text-rose-500"
            >×</button>
          </span>
        ))}
        {!loading && filtered.length === 0 && (
          <span className="text-xs text-gray-400">등록된 키워드가 없습니다</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`"${activePhase}" 공종 키워드 추가`}
          className="flex-1 text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
        />
        <button
          onClick={add}
          className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
        >추가</button>
      </div>
    </Section>
  );
}

// ============================================
// 공정별 발주 데드라인 룰 (D-N)
// ============================================
function PhaseDeadlineRulesSection() {
  const [rules, setRules] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ phase: '', daysBefore: 3 });

  async function reload() {
    setLoading(true);
    try {
      const { rules, defaults } = await phaseDeadlinesApi.list();
      setRules(rules);
      setDefaults(defaults || {});
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function add() {
    const phase = confirmPhaseInput(draft.phase);
    if (!phase) return;
    try {
      await phaseDeadlinesApi.upsert({ phase, daysBefore: Number(draft.daysBefore) });
      setDraft({ phase: '', daysBefore: 3 });
      reload();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  // optimistic active 토글
  async function toggleActive(rule) {
    const next = !rule.active;
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: next } : r));
    try {
      await phaseDeadlinesApi.update(rule.id, { active: next });
    } catch (e) {
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: rule.active } : r));
      alert('변경 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  // optimistic 일수 변경
  async function updateDays(rule, daysBefore) {
    if (!Number.isFinite(daysBefore) || daysBefore === rule.daysBefore) return;
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, daysBefore } : r));
    try {
      await phaseDeadlinesApi.update(rule.id, { daysBefore });
    } catch (e) {
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, daysBefore: rule.daysBefore } : r));
      alert('변경 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  async function seedAll() {
    if (!confirm('표준 D-N 룰 전체를 회사 룰로 가져옵니다 (기존 룰은 그대로 유지/덮어쓰기). 계속할까요?')) return;
    await phaseDeadlinesApi.seedDefaults();
    reload();
  }

  const ruleMap = new Map(rules.map((r) => [r.phase, r]));

  return (
    <Section title="공정별 발주 데드라인 (D-N 룰)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        자재가 공정 시작 며칠 전까지 도착해야 하는지. 회사 룰이 우선, 없으면 표준 기본값 적용.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={seedAll}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 표준 룰 일괄 적용
        </button>
        <PresetResetButton bundle="phaseDeadlineRules" />
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-2 py-1.5 w-1/3">공정명</th>
              <th className="text-right px-2 py-1.5 w-24">D-N (일)</th>
              <th className="text-left px-2 py-1.5">기본값</th>
              <th className="text-center px-2 py-1.5 w-24">활성</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-2 py-1.5 text-navy-800 font-medium">{r.phase}</td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number"
                    defaultValue={r.daysBefore}
                    onBlur={(e) => updateDays(r, Number(e.target.value))}
                    className="w-16 text-right px-2 py-0.5 border rounded"
                  />
                </td>
                <td className="px-2 py-1.5 text-gray-400">
                  {defaults[r.phase] != null ? `D-${defaults[r.phase]}` : '—'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`text-xs sm:text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500 line-through'}`}
                  >
                    {r.active ? '활성' : '비활성'}
                  </button>
                </td>
              </tr>
            ))}
            {/* 표준값 중 회사 룰에 없는 것 — 흐리게 표시. 클릭 시 회사 룰로 가져옴 */}
            {Object.entries(defaults).filter(([phase]) => !ruleMap.has(phase)).map(([phase, days]) => (
              <tr key={phase} className="opacity-50 hover:opacity-100">
                <td className="px-2 py-1.5 text-gray-600">{phase}</td>
                <td className="px-2 py-1.5 text-right text-gray-400">D-{days}</td>
                <td className="px-2 py-1.5 text-gray-400">D-{days}</td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => phaseDeadlinesApi.upsert({ phase, daysBefore: days }).then(reload)}
                    className="text-xs sm:text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-navy-100 hover:text-navy-700 whitespace-nowrap"
                    title="이 표준값을 회사 룰로 가져와서 활성/비활성 관리"
                  >+ 회사 룰</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 룰 추가 */}
      <div className="mt-3 flex gap-2 items-end border-t pt-3">
        <FormField
          label="공정명 (예: 설비)"
          value={draft.phase}
          onChange={(v) => setDraft({ ...draft, phase: v })}
        />
        <FormField
          label="D-N"
          type="number"
          value={draft.daysBefore}
          onChange={(v) => setDraft({ ...draft, daysBefore: v })}
        />
        <button
          onClick={add}
          className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
        >+ 추가</button>
      </div>
    </Section>
  );
}

// ============================================
// 공정 어드바이스 (체크리스트 자동 생성)
// ============================================
// 자주 쓰는 어드바이스 카테고리 — datalist 자동완성용 (자유 입력 허용)
const ADVICE_CATEGORIES = ['관리실 협의', '안전', '사전 준비', '자재', '사진'];
const SYSTEM_PHASE_LABEL = '시스템';
// 시스템 룰은 회사 가입 시 자동 시드 — 사용자는 활성/비활성 토글만, 추가/삭제 X.

function PhaseAdvicesSection() {
  const { displayPhase } = usePhaseLabels();
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ phase: '', daysBefore: 1, title: '', description: '', category: '', requiresPhoto: false });
  const [selected, setSelected] = useState(() => new Set()); // checked id 들
  const [collapsed, setCollapsed] = useState(() => new Set()); // 접힌 그룹 phase 라벨

  async function reload() {
    setLoading(true);
    try {
      const { advices } = await phaseAdvicesApi.list();
      setAdvices(advices);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function add() {
    if (!draft.phase) {
      alert('공정을 선택해주세요.');
      return;
    }
    if (!draft.title.trim()) return;
    try {
      await phaseAdvicesApi.create({
        ruleType: 'STANDARD',
        phase: draft.phase,
        daysBefore: Number(draft.daysBefore),
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        category: draft.category.trim() || null,
        requiresPhoto: !!draft.requiresPhoto,
      });
      setDraft({ phase: draft.phase, daysBefore: 1, title: '', description: '', category: '', requiresPhoto: false });
      reload();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
  }
  // 인라인 셀 편집 — optimistic update + 실패 시 reload로 롤백
  async function patchAdvice(id, patch) {
    setAdvices((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    try {
      await phaseAdvicesApi.update(id, patch);
    } catch (e) {
      await reload();
      throw e;
    }
  }
  async function toggleActive(a) {
    const next = !a.active;
    setAdvices((prev) => prev.map((x) => x.id === a.id ? { ...x, active: next } : x));
    try {
      await phaseAdvicesApi.update(a.id, { active: next });
    } catch (e) {
      setAdvices((prev) => prev.map((x) => x.id === a.id ? { ...x, active: a.active } : x));
      alert('변경 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  async function remove(id) {
    if (!confirm('이 어드바이스를 삭제할까요?')) return;
    const snapshot = advices;
    setAdvices((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    try {
      await phaseAdvicesApi.remove(id);
    } catch (e) {
      setAdvices(snapshot);
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  async function seed() {
    if (!confirm('인테리어 표준 어드바이스 16개를 회사 룰로 추가합니다 (중복 스킵). 계속할까요?')) return;
    const r = await phaseAdvicesApi.seedStandard();
    alert(`✅ ${r.created}개 추가, ${r.skipped}개 스킵`);
    reload();
  }

  // 시스템 룰은 벌크 대상에서 제외 — id 들의 ruleType 을 advices 캐시로 검사
  function filterUserRuleIds(ids) {
    const set = new Set(advices.filter((a) => a.ruleType !== 'UNCONFIRMED_CHECK').map((a) => a.id));
    return ids.filter((id) => set.has(id));
  }

  // 벌크: 선택 복제
  async function bulkDuplicate() {
    const ids = filterUserRuleIds(Array.from(selected));
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}개 어드바이스를 복제할까요? (시스템 룰은 자동 제외)`)) return;
    try {
      const r = await phaseAdvicesApi.bulkDuplicate(ids);
      setSelected(new Set());
      await reload();
      alert(`✅ ${r.created}개 복제됨. 복제본은 그대로 활성 상태입니다 — 필요하면 D-N·제목을 인라인 편집하세요.`);
    } catch (e) { alert('복제 실패: ' + (e.response?.data?.error || e.message)); }
  }

  // 벌크: 선택 삭제
  async function bulkDelete() {
    const ids = filterUserRuleIds(Array.from(selected));
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}개 어드바이스를 삭제할까요? (시스템 룰은 자동 제외, 되돌릴 수 없습니다)`)) return;
    const idSet = new Set(ids);
    const snapshot = advices;
    setAdvices((prev) => prev.filter((x) => !idSet.has(x.id)));
    try {
      const r = await phaseAdvicesApi.bulkDelete(ids);
      setSelected(new Set());
      alert(`🗑 ${r.deleted}개 삭제됨`);
    } catch (e) {
      setAdvices(snapshot);
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleGroupSelected(groupIds, allChecked) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) groupIds.forEach((id) => next.delete(id));
      else groupIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function toggleCollapsed(phase) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase); else next.add(phase);
      return next;
    });
  }

  const categoryOptions = useMemo(() => {
    const set = new Set(ADVICE_CATEGORIES);
    for (const a of advices) {
      if (a.category && a.category.trim()) set.add(a.category.trim());
    }
    return Array.from(set).sort((x, y) => x.localeCompare(y, 'ko'));
  }, [advices]);

  // phase 별 그룹화. 시스템 phase는 항상 최상단.
  const groups = useMemo(() => {
    const byPhase = new Map();
    for (const a of advices) {
      const key = a.phase || '(미지정)';
      if (!byPhase.has(key)) byPhase.set(key, []);
      byPhase.get(key).push(a);
    }
    const phaseOrder = new Map(STANDARD_PHASES.map((p, i) => [p.label, i]));
    const entries = Array.from(byPhase.entries());
    entries.sort(([a], [b]) => {
      if (a === SYSTEM_PHASE_LABEL) return -1;
      if (b === SYSTEM_PHASE_LABEL) return 1;
      const oa = phaseOrder.has(a) ? phaseOrder.get(a) : 1000;
      const ob = phaseOrder.has(b) ? phaseOrder.get(b) : 1000;
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b, 'ko');
    });
    // 그룹 안 정렬: D-N 큰 순(=먼저 알리는 룰 위)
    for (const [, list] of entries) list.sort((x, y) => y.daysBefore - x.daysBefore);
    return entries;
  }, [advices]);

  const selectedCount = selected.size;

  return (
    <Section title="공정 어드바이스 (체크리스트 자동 생성)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        일반 룰: 일정에 해당 공정이 등록되면 (시작일 - D-N)에 체크리스트 자동 생성. D-N=0 + 사진필수=ON 은 시공 사진 증거(옛 템플릿 역할).<br/>
        🛎 <b>시스템 룰</b>(미확정 알림 D-14 / D-7)은 회사 가입 시 자동 등록되며 <b>활성/비활성</b> 만 조절합니다. 오늘 기준 D-N 일 후의 미확정 일정마다 "확정 안 됨" 체크리스트가 자동 생성되고, 일정을 확정하면 자동 완료됩니다.
      </p>

      {/* 액션 바 — 시드 / 벌크 */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={seed}
          className="text-sm px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >📋 표준 어드바이스 16개 시드 추가</button>
        <PresetResetButton bundle="phaseAdvices" />
        {selectedCount > 0 && (
          <>
            <span className="text-xs text-gray-500 ml-2">선택 {selectedCount}개</span>
            <button
              onClick={bulkDuplicate}
              className="text-xs px-3 py-1.5 border border-navy-300 text-navy-700 rounded hover:bg-navy-50"
            >복제</button>
            <button
              onClick={bulkDelete}
              className="text-xs px-3 py-1.5 border border-rose-300 text-rose-700 rounded hover:bg-rose-50"
            >삭제</button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-2 py-1.5 text-gray-500 hover:underline"
            >선택 해제</button>
          </>
        )}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      {/* 그룹 카드 — phase 별 collapsible */}
      <div className="space-y-2">
        {groups.map(([phase, list]) => {
          const isSystem = phase === SYSTEM_PHASE_LABEL;
          // 시스템 그룹은 선택 대상에서 제외 (체크박스 숨김)
          const groupIds = isSystem ? [] : list.map((a) => a.id);
          const allChecked = groupIds.length > 0 && groupIds.every((id) => selected.has(id));
          const someChecked = groupIds.some((id) => selected.has(id));
          const isCollapsed = collapsed.has(phase);
          const activeCount = list.filter((a) => a.active).length;
          return (
            <div key={phase} className={`border rounded ${isSystem ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/60 border-b">
                {isSystem ? (
                  <span className="w-4 h-4" /> // 자리 맞춤용 placeholder
                ) : (
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                    onChange={() => toggleGroupSelected(groupIds, allChecked)}
                    className="w-4 h-4 accent-navy-700"
                    title="이 공정 전체 선택"
                  />
                )}
                <button
                  onClick={() => toggleCollapsed(phase)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-gray-400 text-xs w-3">{isCollapsed ? '▶' : '▼'}</span>
                  <span className={`font-medium ${isSystem ? 'text-amber-800' : 'text-navy-800'}`}>
                    {isSystem ? '🛎 시스템 (미확정 알림)' : displayPhase(phase)}
                  </span>
                  <span className="text-xs text-gray-400">{activeCount}/{list.length}</span>
                  {isSystem && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">기본 제공 · 활성/비활성만 가능</span>
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr className="bg-white border-b">
                        <th className="w-8 px-2 py-1.5"></th>
                        <th className="text-right px-2 py-1.5 w-16">D-N</th>
                        <th className="text-left px-2 py-1.5">제목 / 설명</th>
                        <th className="text-left px-2 py-1.5 w-28">카테고리</th>
                        <th className="text-center px-2 py-1.5 w-12">📷</th>
                        <th className="text-center px-2 py-1.5 w-20">활성</th>
                        <th className="px-2 py-1.5 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {list.map((a) => {
                        const locked = a.ruleType === 'UNCONFIRMED_CHECK'; // 시스템 룰 = 편집 잠금
                        return (
                          <tr key={a.id} className={`hover:bg-gray-50 ${a.active ? '' : 'opacity-50'} ${selected.has(a.id) ? 'bg-navy-50/40' : ''}`}>
                            <td className="px-2 py-1.5 align-top">
                              {locked ? (
                                <span className="text-gray-300 text-xs" title="시스템 룰 — 선택 불가">🔒</span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selected.has(a.id)}
                                  onChange={() => toggleSelected(a.id)}
                                  className="w-4 h-4 accent-navy-700"
                                />
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right align-top">
                              <div className="flex items-center justify-end gap-0.5">
                                <span className="text-gray-400">D-</span>
                                {locked ? (
                                  <span className="text-xs px-1.5 py-0.5 text-gray-700">{a.daysBefore}</span>
                                ) : (
                                  <InlineNumberCell
                                    value={a.daysBefore}
                                    onSave={(v) => patchAdvice(a.id, { daysBefore: v })}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 align-top">
                              {locked ? (
                                <>
                                  <div className="font-medium text-navy-800 px-1.5 py-0.5">{a.title}</div>
                                  {a.description && (
                                    <div className="text-gray-500 text-[11px] px-1.5">{a.description}</div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <InlineTextCell
                                    value={a.title}
                                    onSave={(v) => {
                                      const trimmed = v.trim();
                                      if (!trimmed) throw new Error('제목은 비울 수 없습니다');
                                      return patchAdvice(a.id, { title: trimmed });
                                    }}
                                    placeholder="제목"
                                    className="font-medium text-navy-800"
                                  />
                                  <InlineTextareaCell
                                    value={a.description || ''}
                                    onSave={(v) => patchAdvice(a.id, { description: v.trim() || null })}
                                    placeholder="설명 추가 (선택)"
                                    className="text-gray-500 text-[11px]"
                                  />
                                </>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-gray-500 align-top">
                              {locked ? (
                                <span className="text-xs px-1.5 py-0.5">{a.category || '—'}</span>
                              ) : (
                                <InlineTextCell
                                  value={a.category || ''}
                                  onSave={(v) => patchAdvice(a.id, { category: v.trim() || null })}
                                  placeholder="—"
                                />
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center align-top">
                              <input
                                type="checkbox"
                                checked={!!a.requiresPhoto}
                                disabled={locked}
                                onChange={async (e) => {
                                  const next = e.target.checked;
                                  try { await patchAdvice(a.id, { requiresPhoto: next }); }
                                  catch (err) { alert('변경 실패: ' + (err?.response?.data?.error || err?.message)); }
                                }}
                                className="w-4 h-4 accent-navy-700 disabled:opacity-30"
                                title={locked ? '시스템 룰은 변경 불가' : '사진 첨부 필수'}
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center align-top">
                              <button
                                onClick={() => toggleActive(a)}
                                className={`text-xs sm:text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${a.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500 line-through'}`}
                              >
                                {a.active ? '활성' : '비활성'}
                              </button>
                            </td>
                            <td className="px-2 py-1.5 text-right align-top">
                              {!locked && (
                                <button onClick={() => remove(a.id)} className="text-rose-500 hover:underline">삭제</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && !loading && (
          <div className="text-center py-6 text-sm text-gray-400 border rounded">등록된 어드바이스가 없습니다.</div>
        )}
      </div>

      {/* 입력 폼 — 일반 룰만 추가 가능 (시스템 룰은 가입 시 자동 시드) */}
      <div className="mt-4 border-t pt-3">
        <div className="text-xs font-medium text-gray-600 mb-2">+ 새 어드바이스 추가</div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
          <select
            value={draft.phase}
            onChange={(e) => setDraft({ ...draft, phase: e.target.value })}
            className="sm:col-span-3 text-xs px-2 py-1.5 border rounded bg-white"
          >
            <option value="">— 공정 선택 —</option>
            {STANDARD_PHASES.filter((p) => p.key !== 'OTHER').map((p) => (
              <option key={p.key} value={p.label}>{displayPhase(p.label)}</option>
            ))}
          </select>
          <div className="sm:col-span-2 flex items-center gap-1">
            <span className="text-xs text-gray-400">D-</span>
            <input
              type="number"
              value={draft.daysBefore}
              onChange={(e) => setDraft({ ...draft, daysBefore: e.target.value })}
              className="w-full text-xs text-right px-2 py-1.5 border rounded outline-none focus:border-navy-700"
            />
          </div>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="예: 보양 관련 관리실 문의"
            className="sm:col-span-7 text-xs px-2 py-1.5 border rounded outline-none focus:border-navy-700"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="설명 (선택)"
            rows={1}
            className="sm:col-span-6 text-[11px] text-gray-600 px-2 py-1.5 border rounded outline-none focus:border-navy-700 resize-y"
          />
          <input
            list="advice-categories"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="카테고리 (선택)"
            className="sm:col-span-3 text-xs px-2 py-1.5 border rounded outline-none focus:border-navy-700"
          />
          <datalist id="advice-categories">
            {categoryOptions.map((c) => <option key={c} value={c} />)}
          </datalist>
          <label className="sm:col-span-2 flex items-center gap-1.5 text-xs text-gray-600 px-2 py-1.5">
            <input
              type="checkbox"
              checked={draft.requiresPhoto}
              onChange={(e) => setDraft({ ...draft, requiresPhoto: e.target.checked })}
              className="w-4 h-4 accent-navy-700"
            />
            <span>📷 사진필수</span>
          </label>
          <button
            onClick={add}
            disabled={!draft.phase || !draft.title.trim()}
            className="sm:col-span-1 text-xs px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-40"
          >+ 추가</button>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-gray-400">
        💡 카테고리는 자유 입력입니다. 자주 쓰는 5개 + 회사 기존 카테고리가 자동완성 제안으로 노출됩니다.
      </div>
    </Section>
  );
}

// ============================================
// Inline 셀 편집 헬퍼 — focus 시 살짝 강조, blur/Enter 시 저장, ESC로 취소
// 변경 없을 시 저장 호출 안 함. 실패 시 부모가 reload로 롤백 → useEffect [value]에서 자동 sync
// ============================================
function InlineTextCell({ value, onSave, placeholder = '', className = '' }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setV(value); }, [value]);
  async function commit() {
    if (busy) return;
    if (v === value) return;
    setBusy(true);
    try {
      await onSave(v);
    } catch (e) {
      setV(value);
      alert('저장 실패: ' + (e?.response?.data?.error || e?.message || ''));
    } finally {
      setBusy(false);
    }
  }
  return (
    <input
      type="text"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
        if (e.key === 'Escape') { setV(value); e.target.blur(); }
      }}
      placeholder={placeholder}
      disabled={busy}
      className={`w-full text-xs px-1.5 py-0.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-navy-700 focus:bg-white rounded outline-none ${className}`}
    />
  );
}

function InlineTextareaCell({ value, onSave, placeholder = '', className = '' }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setV(value); }, [value]);
  async function commit() {
    if (busy) return;
    if (v === value) return;
    setBusy(true);
    try {
      await onSave(v);
    } catch (e) {
      setV(value);
      alert('저장 실패: ' + (e?.response?.data?.error || e?.message || ''));
    } finally {
      setBusy(false);
    }
  }
  return (
    <textarea
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { setV(value); e.target.blur(); }
      }}
      placeholder={placeholder}
      disabled={busy}
      rows={1}
      className={`w-full mt-0.5 px-1.5 py-0.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-navy-700 focus:bg-white rounded outline-none resize-y ${className}`}
    />
  );
}

function InlineNumberCell({ value, onSave }) {
  const [v, setV] = useState(String(value));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setV(String(value)); }, [value]);
  async function commit() {
    if (busy) return;
    const n = Number(v);
    if (!Number.isFinite(n)) { setV(String(value)); return; }
    if (n === value) return;
    setBusy(true);
    try {
      await onSave(n);
    } catch (e) {
      setV(String(value));
      alert('저장 실패: ' + (e?.response?.data?.error || e?.message || ''));
    } finally {
      setBusy(false);
    }
  }
  return (
    <input
      type="number"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
        if (e.key === 'Escape') { setV(String(value)); e.target.blur(); }
      }}
      disabled={busy}
      className="w-12 text-xs text-right px-1 py-0.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-navy-700 focus:bg-white rounded outline-none"
    />
  );
}

// ============================================
// Helpers
// ============================================
function Section({ title, children, hint, collapsible = false, defaultOpen = false }) {
  const storageKey = collapsible ? `settings:section:${title}` : null;
  const [open, setOpen] = useState(() => {
    if (!collapsible) return true;
    if (typeof window === 'undefined') return defaultOpen;
    const v = localStorage.getItem(storageKey);
    if (v === '1') return true;
    if (v === '0') return false;
    return defaultOpen;
  });
  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (storageKey) localStorage.setItem(storageKey, next ? '1' : '0');
      return next;
    });
  }

  if (!collapsible) {
    return (
      <div className={`bg-white rounded-xl border p-5 ${hint ? 'border-dashed' : ''}`}>
        <div className="text-sm font-semibold text-navy-800 mb-3">{title}</div>
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border ${hint ? 'border-dashed' : ''}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 rounded-xl"
      >
        <span className="text-sm font-semibold text-navy-800">{title}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="px-5 pb-5 -mt-2">{children}</div>}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex py-2 border-b last:border-b-0 text-sm">
      <span className="w-24 text-gray-500">{label}</span>
      <span className={`text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || <span className="text-gray-400 italic">—</span>}
      </span>
    </div>
  );
}

function ChangePasswordRow() {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function reset() {
    setForm({ current: '', next: '', confirm: '' });
    setErr('');
    setOpen(false);
  }

  async function submit() {
    setErr('');
    if (!form.current || form.next.length < 8) {
      setErr('현재 비밀번호와 새 비밀번호(8자 이상)를 입력하세요');
      return;
    }
    if (form.next !== form.confirm) {
      setErr('새 비밀번호 확인이 일치하지 않습니다');
      return;
    }
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      alert('비밀번호가 변경되었습니다. 다른 기기 세션은 모두 자동 로그아웃됩니다.');
      reset();
    } catch (e) {
      setErr(e.response?.data?.error || '변경 실패');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex py-2 border-b last:border-b-0 text-sm items-center">
        <span className="w-24 text-gray-500">비밀번호</span>
        <span className="text-gray-400 flex-1">●●●●●●●●</span>
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-2 py-1 text-navy-700 hover:bg-navy-50 rounded"
        >🔒 변경</button>
      </div>
    );
  }

  return (
    <div className="py-3 border-b last:border-b-0 bg-gray-50 -mx-2 px-3 rounded">
      <div className="text-sm font-medium text-gray-700 mb-2">🔒 비밀번호 변경</div>
      <div className="space-y-2">
        <input
          type="password"
          placeholder="현재 비밀번호"
          autoFocus
          value={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })}
          autoComplete="current-password"
          className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
        />
        <input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          value={form.next}
          onChange={(e) => setForm({ ...form, next: e.target.value })}
          autoComplete="new-password"
          minLength={8}
          className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          autoComplete="new-password"
          className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
        />
      </div>
      {err && <div className="mt-2 text-xs text-rose-600">{err}</div>}
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={reset}
          disabled={busy}
          className="text-xs px-3 py-1.5 border rounded hover:bg-white disabled:opacity-50"
        >취소</button>
        <button
          onClick={submit}
          disabled={busy}
          className="text-xs px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
        >{busy ? '변경 중...' : '비밀번호 변경'}</button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', step, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input
        type={type}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
      />
    </div>
  );
}

function roleLabel(role) {
  return ({ OWNER: '대표', DESIGNER: '디자인팀', FIELD: '현장팀' }[role] || role);
}

// ============================================
// 가전 규격 DB (글로벌 — 모든 회사 공유)
// ============================================
const APPLI_CATEGORY_LABEL = {
  REFRIGERATOR: '냉장고',
  KIMCHI_REFRIGERATOR: '김치냉장고',
  DISHWASHER: '식기세척기',
  WASHING_MACHINE: '세탁기',
  DRYER: '건조기',
  OVEN: '오븐',
  COOKTOP: '쿡탑',
  AIR_CONDITIONER: '에어컨',
  ROBOT_VACUUM: '로봇청소기',
};

function VerifyChip({ status, count }) {
  const map = {
    VERIFIED:       { label: `✅ 확신 (${count}출처)`, cls: 'bg-emerald-50 text-emerald-700' },
    USER_CORRECTED: { label: '🛠️ 사용자 정정',          cls: 'bg-sky-50 text-sky-700' },
    PENDING:        { label: '△ 확인필요',              cls: 'bg-amber-50 text-amber-700' },
    DISPUTED:       { label: '△ 출처 불일치',           cls: 'bg-amber-50 text-amber-700' },
  };
  const m = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-block text-[11px] px-2 py-0.5 rounded ${m.cls}`}>{m.label}</span>;
}

function ApplianceSpecsSection({ canEdit }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | spec object

  async function reload() {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterBrand) params.brand = filterBrand;
      if (filterStatus) params.verifyStatus = filterStatus;
      if (includeDiscontinued) params.includeDiscontinued = 'true';
      const { specs } = await applianceSpecsApi.list(params);
      setSpecs(specs);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, [filterCategory, filterBrand, filterStatus, includeDiscontinued]);

  async function remove(id) {
    if (!confirm('이 가전 규격을 삭제할까요? (모든 회사에서 사라집니다)')) return;
    await applianceSpecsApi.remove(id);
    reload();
  }

  return (
    <Section title="가전 규격 DB (글로벌, 모든 회사 공유)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        모델명·브랜드별 정확한 사이즈 DB. 디자이너가 마감재(가전) 입력 시 모델 선택하면 사이즈 자동 채움.
        검증된 데이터만 표시되며, 출처 2개 이상 일치 시 ✅ 검증됨, 사용자 정정은 최우선 반영.
      </p>

      <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(APPLI_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">전체 브랜드</option>
          <option value="LG">LG</option>
          <option value="삼성">삼성</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="">전체 상태</option>
          <option value="VERIFIED">✅ 검증됨</option>
          <option value="USER_CORRECTED">🛠️ 사용자 정정</option>
          <option value="PENDING">⚠️ 검증 대기</option>
          <option value="DISPUTED">❌ 불일치</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={includeDiscontinued}
            onChange={(e) => setIncludeDiscontinued(e.target.checked)}
            className="w-3.5 h-3.5 accent-navy-700"
          />
          단종 포함
        </label>
        {canEdit && (
          <button
            onClick={() => setEditing('new')}
            className="ml-auto text-sm px-3 py-1 bg-navy-700 text-white rounded hover:bg-navy-800"
          >+ 새 가전 추가</button>
        )}
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-2 py-1.5 w-20">카테고리</th>
              <th className="text-left px-2 py-1.5 w-16">브랜드</th>
              <th className="text-left px-2 py-1.5 w-32">모델코드</th>
              <th className="text-left px-2 py-1.5">제품명</th>
              <th className="text-right px-2 py-1.5 w-32">치수 (W×H×D)</th>
              <th className="text-left px-2 py-1.5 w-32">검증</th>
              {canEdit && <th className="px-2 py-1.5 w-20"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {specs.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50 ${s.discontinued ? 'opacity-60' : ''}`}>
                <td className="px-2 py-1.5 text-gray-600">{APPLI_CATEGORY_LABEL[s.category] || s.category}</td>
                <td className="px-2 py-1.5 font-medium">{s.brand}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-navy-700">{s.modelCode}</td>
                <td className="px-2 py-1.5">
                  {s.productName}
                  {s.discontinued && <span className="ml-1 text-[10px] text-gray-400">(단종)</span>}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                  {s.widthMm}×{s.heightMm}×{s.depthMm}
                </td>
                <td className="px-2 py-1.5">
                  <VerifyChip status={s.verifyStatus} count={s.consensusCount} />
                </td>
                {canEdit && (
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(s)} className="text-navy-700 hover:underline mr-2">수정</button>
                    <button onClick={() => remove(s.id)} className="text-rose-500 hover:underline">삭제</button>
                  </td>
                )}
              </tr>
            ))}
            {specs.length === 0 && !loading && (
              <tr><td colSpan={canEdit ? 7 : 6} className="text-center py-6 text-gray-400">
                등록된 가전이 없습니다. {canEdit && '"새 가전 추가"로 시작하세요.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ApplianceSpecModal
          spec={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </Section>
  );
}

function ApplianceSpecModal({ spec, onClose, onSaved }) {
  const isNew = !spec;
  const [form, setForm] = useState(() => ({
    category: spec?.category || 'REFRIGERATOR',
    brand: spec?.brand || 'LG',
    modelCode: spec?.modelCode || '',
    modelAliases: (spec?.modelAliases || []).join(', '),
    productName: spec?.productName || '',
    widthMm: spec?.widthMm ?? '',
    heightMm: spec?.heightMm ?? '',
    depthMm: spec?.depthMm ?? '',
    hingeOpenWidthMm: spec?.hingeOpenWidthMm ?? '',
    ventTopMm: spec?.ventTopMm ?? '',
    ventSideMm: spec?.ventSideMm ?? '',
    ventBackMm: spec?.ventBackMm ?? '',
    doorType: spec?.doorType || '',
    capacityL: spec?.capacityL ?? '',
    builtIn: !!spec?.builtIn,
    releaseYear: spec?.releaseYear ?? '',
    discontinued: !!spec?.discontinued,
    sourcesText: JSON.stringify(spec?.sources || [], null, 2),
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function field(key) {
    return { value: form[key] ?? '', onChange: (v) => setForm({ ...form, [key]: v }) };
  }

  async function save() {
    setErr('');
    setSaving(true);
    try {
      let sources = [];
      try { sources = JSON.parse(form.sourcesText || '[]'); } catch { throw new Error('출처 JSON 형식 오류'); }
      const intOrNull = (v) => v === '' || v === null ? null : Number(v);
      const intReq = (v) => Number(v);
      const aliases = form.modelAliases.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        category: form.category,
        brand: form.brand.trim(),
        modelCode: form.modelCode.trim(),
        modelAliases: aliases,
        productName: form.productName.trim(),
        widthMm: intReq(form.widthMm),
        heightMm: intReq(form.heightMm),
        depthMm: intReq(form.depthMm),
        hingeOpenWidthMm: intOrNull(form.hingeOpenWidthMm),
        ventTopMm: intOrNull(form.ventTopMm),
        ventSideMm: intOrNull(form.ventSideMm),
        ventBackMm: intOrNull(form.ventBackMm),
        doorType: form.doorType.trim() || null,
        capacityL: intOrNull(form.capacityL),
        builtIn: form.builtIn,
        releaseYear: intOrNull(form.releaseYear),
        discontinued: form.discontinued,
        sources,
      };

      if (isNew) {
        await applianceSpecsApi.create(payload);
      } else {
        await applianceSpecsApi.update(spec.id, payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || e.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-navy-800">{isNew ? '새 가전 추가' : '가전 규격 수정'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">카테고리</label>
              <select {...field('category')} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm px-3 py-1.5 border rounded">
                {Object.entries(APPLI_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">브랜드</label>
              <select {...field('brand')} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full text-sm px-3 py-1.5 border rounded">
                <option value="LG">LG</option>
                <option value="삼성">삼성</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <FormField label="모델코드 (예: S634S30Q)" {...field('modelCode')} />
            <FormField label="제품명 (예: 디오스 양문형 800L)" {...field('productName')} />
            <FormField label="별칭 (쉼표 구분)" {...field('modelAliases')} full />
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">외형 치수 (mm) — 필수</div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="가로 (W)" type="number" {...field('widthMm')} />
              <FormField label="높이 (H)" type="number" {...field('heightMm')} />
              <FormField label="깊이 (D)" type="number" {...field('depthMm')} />
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">설치 요구사항 (mm) — 선택</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField label="문 열림 폭" type="number" {...field('hingeOpenWidthMm')} />
              <FormField label="상부 통풍" type="number" {...field('ventTopMm')} />
              <FormField label="측면 통풍" type="number" {...field('ventSideMm')} />
              <FormField label="후면 통풍" type="number" {...field('ventBackMm')} />
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">메타</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormField label="문 타입 (예: 양문형, 4도어)" {...field('doorType')} />
              <FormField label="용량 (L)" type="number" {...field('capacityL')} />
              <FormField label="출시년도" type="number" {...field('releaseYear')} />
            </div>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.builtIn}
                  onChange={(e) => setForm({ ...form, builtIn: e.target.checked })}
                  className="w-4 h-4 accent-navy-700" />
                빌트인
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.discontinued}
                  onChange={(e) => setForm({ ...form, discontinued: e.target.checked })}
                  className="w-4 h-4 accent-navy-700" />
                단종
              </label>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              출처 (JSON 배열) — 검증 가드레일
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              형식: <code>{`[{"tier":1,"url":"https://...","value":{"widthMm":832,"heightMm":1850,"depthMm":738}},{"tier":3,"url":"..."}]`}</code><br/>
              tier 1=공식 / 2=PDF카탈로그 / 3=다나와 / 4=쇼핑몰 / 5=매뉴얼.
              치수가 일치하는 출처 2개 이상이면 자동으로 ✅ 검증됨 처리됨.
            </p>
            <textarea
              value={form.sourcesText}
              onChange={(e) => setForm({ ...form, sourcesText: e.target.value })}
              className="w-full font-mono text-xs px-3 py-2 border rounded focus:border-navy-700 outline-none"
              rows={6}
            />
          </div>

          {err && <div className="text-sm text-rose-600">{err}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border rounded hover:bg-white">취소</button>
          <button
            onClick={save}
            disabled={saving}
            className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
          >
            {saving ? '저장 중...' : isNew ? '추가' : '수정'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 회사 견적가이드 섹션 — 공정별 회사 내부 메모.
// 견적 작성 화면 우측 드로어에서 자동 매칭 표시. 화면 전용, PDF/프린트에는 안 나감.
// 권한: 보기는 회사 멤버 누구나, 편집은 SETTINGS_QUOTE_GUIDE 권한 보유자.
// ============================================
function CompanyPhaseTipsSection({ auth }) {
  const canEdit = hasFeature(auth, F.SETTINGS_QUOTE_GUIDE);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState('');

  async function reload() {
    setLoading(true);
    try {
      const { tips } = await companyPhaseTipsApi.list();
      setTips(tips);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  // phase별 메모 dict (편집 중 임시 저장)
  const tipMap = useMemo(() => {
    const m = new Map();
    for (const t of tips) m.set(t.phase, t);
    return m;
  }, [tips]);

  // GENERAL은 항상 노출. 그 외는 메모 있는 공정만.
  const standardLabels = STANDARD_PHASES.filter((p) => p.key !== 'OTHER').map((p) => p.label);
  const orderedPhases = [
    GENERAL_PHASE,
    ...standardLabels.filter((label) => tipMap.has(label)),
  ];
  const remainingPhases = standardLabels.filter((label) => !tipMap.has(label));

  return (
    <Section title="공정별 견적가이드 (회사 내부, PDF 비표시)" collapsible>
      <p className="text-xs text-gray-500 mb-3">
        견적 작성 시 우측 드로어에 자동으로 표시되는 회사 내부 메모입니다.
        공정 셀이 활성화되면 그 공정의 가이드가 자동 매칭됩니다. <b>화면 전용 — 견적서 PDF에는 절대 나가지 않습니다.</b>
      </p>

      {canEdit && (
        <div className="mb-3">
          <PresetResetButton bundle="companyPhaseTips" />
        </div>
      )}

      {!canEdit && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
          🔒 보기 전용입니다. 편집하려면 OWNER에게 "공정별 견적가이드 수정" 권한을 요청하세요.
        </div>
      )}

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="space-y-3">
        {orderedPhases.map((phase) => (
          <PhaseTipCard
            key={phase}
            phase={phase}
            tip={tipMap.get(phase)}
            canEdit={canEdit}
            onSaved={reload}
          />
        ))}
      </div>

      {canEdit && remainingPhases.length > 0 && (
        <div className="mt-4 pt-3 border-t flex items-center gap-2">
          <span className="text-xs text-gray-500">+ 공정 추가:</span>
          <select
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            className="text-sm px-2 py-1 border rounded bg-white"
          >
            <option value="">선택…</option>
            {remainingPhases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              if (!adding) return;
              try {
                // 빈 메모로 우선 등록(사용자가 텍스트 입력하면 자동 저장됨)
                await companyPhaseTipsApi.upsert(adding, ' ');
                setAdding('');
                reload();
              } catch (e) {
                alert('추가 실패: ' + (e.response?.data?.error || e.message));
              }
            }}
            disabled={!adding}
            className="text-xs px-3 py-1 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      )}
    </Section>
  );
}

function PhaseTipCard({ phase, tip, canEdit, onSaved }) {
  const isGeneral = phase === GENERAL_PHASE;
  const [draft, setDraft] = useState(tip?.body || '');
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  // 외부 reload 시 동기화 (단, 사용자가 입력 중이면 덮어쓰지 않음)
  useEffect(() => {
    if (!timerRef.current) setDraft(tip?.body || '');
    /* eslint-disable-next-line */
  }, [tip?.body]);

  function scheduleSave(value) {
    setDraft(value);
    if (!canEdit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      setSaving(true);
      try {
        await companyPhaseTipsApi.upsert(phase, value);
        onSaved?.();
      } catch (e) {
        alert('저장 실패: ' + (e.response?.data?.error || e.message));
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  async function remove() {
    if (!confirm(`"${isGeneral ? '전체 공통' : phase}" 메모를 삭제할까요?`)) return;
    try {
      await companyPhaseTipsApi.remove(phase);
      onSaved?.();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className={`border rounded-lg p-3 ${isGeneral ? 'bg-amber-50/30 border-amber-200' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-navy-800">
          {isGeneral ? '🌐 전체 공통' : `🔧 ${phase}`}
        </span>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[11px] text-gray-400">저장 중…</span>}
          {tip?.updatedBy && (
            <span className="text-[11px] text-gray-400">
              {tip.updatedBy.name} · {new Date(tip.updatedAt).toLocaleDateString('ko-KR')}
            </span>
          )}
          {canEdit && tip && !isGeneral && (
            <button
              onClick={remove}
              className="text-[11px] text-rose-500 hover:bg-rose-50 px-1.5 py-0.5 rounded"
            >
              삭제
            </button>
          )}
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => scheduleSave(e.target.value)}
        disabled={!canEdit}
        rows={3}
        placeholder={
          isGeneral
            ? '예: 모든 견적에 공통 적용되는 단가/유의사항…'
            : `예: ${phase} 공정 견적 시 자주 빠지는 항목, 회사 단가 가이드…`
        }
        className="w-full text-sm px-2 py-1.5 border rounded outline-none focus:border-navy-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}
