import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import BackupMenu from '../components/BackupMenu';
import { companyApi } from '../api/company';
import { quoteTemplatesApi } from '../api/quoteTemplates';
import { checklistTemplatesApi } from '../api/checklistTemplates';
import { phaseKeywordsApi } from '../api/phaseKeywords';
import { phaseDeadlinesApi, phaseAdvicesApi } from '../api/phaseRules';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import { RATE_META, WORK_TYPES, WORK_TYPE_LABEL, formatWon, parseWon } from '../api/quotes';
import { toCSV, parseCSV, downloadFile, readFileAsText } from '../utils/csv';

export default function Settings() {
  const { auth, logout, updateMe } = useAuth();
  const isOwner = auth?.role === 'OWNER';
  const [company, setCompany] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    companyApi.get().then((d) => setCompany(d.company)).catch(() => {});
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

      <QuoteRatesSection company={company} onSaved={setCompany} canEdit={isOwner} />

      <QuoteTemplatesSection />

      <PhaseKeywordsSection />

      <PhaseDeadlineRulesSection />

      <PhaseAdvicesSection />

      <ChecklistTemplatesSection />

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
        <div className="pt-3">
          <button
            onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }}
            className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
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
    <Section title="견적 기본 비율 (% 단위)">
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
    <Section title="견적 항목 템플릿 (회사 마스터)">
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
                    <button onClick={() => remove(t.id)} className="text-red-500 hover:underline">삭제</button>
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
    const name = newPhase.name.trim();
    const keyword = newPhase.keyword.trim();
    if (!name || !keyword) {
      alert('공정명과 첫 키워드를 모두 입력해주세요.');
      return;
    }
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

  const filtered = rules.filter((r) => r.phase === activePhase);

  return (
    <Section title="공종 자동 인식 키워드">
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
      </div>

      <div className="flex flex-wrap gap-1 border-b mb-3 pb-2">
        {phases.map((p) => {
          const cnt = rules.filter((r) => r.phase === p).length;
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
        <button
          onClick={() => setNewPhaseModal(true)}
          className="text-xs px-2.5 py-1 rounded border border-dashed border-navy-400 text-navy-700 hover:bg-navy-50"
          title="새 공정 추가"
        >
          + 새 공정
        </button>
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
              className="text-gray-400 hover:text-red-500"
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

      {newPhaseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setNewPhaseModal(false)}>
          <div className="bg-white rounded-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b font-bold text-navy-800">새 공정 추가</div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">
                공정명과 자동 인식할 첫 키워드를 입력해주세요. 공정 추가 후 일정 입력에서 자동 인식되며,
                공정 칩·발주 D-N·어드바이스 등 모든 곳에 즉시 반영됩니다.
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">공정명 (예: 조경)</label>
                <input
                  autoFocus
                  value={newPhase.name}
                  onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                  placeholder="예: 조경, 가구, 가전"
                  className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">첫 키워드 (예: 조경 또는 식재)</label>
                <input
                  value={newPhase.keyword}
                  onChange={(e) => setNewPhase({ ...newPhase, keyword: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addNewPhase()}
                  placeholder="이 키워드가 일정 내용에 들어가면 새 공정으로 자동 분류됩니다"
                  className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setNewPhaseModal(false)} className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">취소</button>
              <button onClick={addNewPhase} className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800">추가</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function ChecklistTemplatesSection() {
  const phases = useCompanyPhases();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(phases[0]);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(null);

  async function reload() {
    setLoading(true);
    try {
      const { templates } = await checklistTemplatesApi.list();
      setTemplates(templates);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  function startAdd() {
    setForm({
      title: '',
      phase: activePhase,
      requiresPhoto: true,
      orderIndex: 0,
      active: true,
    });
    setAdding(true);
    setEditingId(null);
  }

  function startEdit(tpl) {
    setForm({
      title: tpl.title,
      phase: tpl.phase || '',
      requiresPhoto: tpl.requiresPhoto,
      orderIndex: tpl.orderIndex,
      active: tpl.active,
    });
    setEditingId(tpl.id);
    setAdding(false);
  }

  async function saveForm() {
    if (!form.title.trim()) return;
    try {
      const payload = {
        title: form.title.trim(),
        phase: form.phase?.trim() || null,
        requiresPhoto: !!form.requiresPhoto,
        orderIndex: Number(form.orderIndex) || 0,
        active: form.active !== false,
      };
      if (editingId) {
        await checklistTemplatesApi.update(editingId, payload);
      } else {
        await checklistTemplatesApi.create(payload);
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
    if (!confirm('이 템플릿을 삭제할까요?\n(이 템플릿에서 자동 생성된 체크리스트 항목은 그대로 남습니다)')) return;
    await checklistTemplatesApi.remove(id);
    reload();
  }

  async function toggleActive(tpl) {
    await checklistTemplatesApi.update(tpl.id, { active: !tpl.active });
    reload();
  }

  async function handleSeed() {
    const force = templates.length > 0;
    const msg = force
      ? `이미 ${templates.length}개 템플릿이 있습니다.\n\n전부 삭제하고 기본 템플릿으로 다시 시드할까요?`
      : '공종별 표준 사진 체크리스트 기본 시드(약 25개)를 추가할까요?';
    if (!confirm(msg)) return;
    try {
      const { created } = await checklistTemplatesApi.seed(force);
      alert(`✅ ${created}개 템플릿이 추가되었습니다`);
      reload();
    } catch (e) {
      alert('시드 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  const filtered = templates.filter((t) => (t.phase || '') === (activePhase || ''));
  const phaseChips = [...phases, '(공종 없음)'];

  return (
    <Section title="체크리스트 템플릿 (회사 마스터)">
      <p className="text-xs text-gray-500 mb-3">
        공종별 표준 사진 체크리스트. 일정에 해당 공종이 추가되면 자동으로 프로젝트 체크리스트에 투입됩니다.
        프로젝트 체크리스트에서 "📋 템플릿에서 가져오기"로 수동 추가도 가능.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={handleSeed}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 기본 시드 ({templates.length > 0 ? '재시드' : '추가'})
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b mb-3 pb-2">
        {phaseChips.map((p) => {
          const key = p === '(공종 없음)' ? '' : p;
          const cnt = templates.filter((t) => (t.phase || '') === key).length;
          const active = activePhase === key;
          return (
            <button
              key={p}
              onClick={() => setActivePhase(key)}
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
      {!loading && filtered.length === 0 && !adding && (
        <div className="text-center py-6 text-sm text-gray-400">
          {activePhase || '(공종 없음)'} 에 등록된 템플릿이 없습니다.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-2 py-1.5">항목명</th>
                <th className="text-center px-2 py-1.5 w-16">사진필수</th>
                <th className="text-center px-2 py-1.5 w-16">활성</th>
                <th className="px-2 py-1.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${t.active ? '' : 'opacity-50'}`}>
                  <td className="px-2 py-1.5 text-navy-800">{t.title}</td>
                  <td className="px-2 py-1.5 text-center">{t.requiresPhoto ? '📷' : '—'}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => toggleActive(t)} className="text-gray-500 hover:text-navy-700">
                      {t.active ? '✓' : '✕'}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs">
                    <button onClick={() => startEdit(t)} className="text-navy-700 hover:underline mr-2">편집</button>
                    <button onClick={() => remove(t.id)} className="text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(adding || editingId) && form && (
        <div className="mt-3 p-3 bg-gray-50 border rounded space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-0.5">항목명</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
                placeholder="예: 철거 전 전체 사진"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">공종 (phase)</label>
              <input
                list="phase-list"
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value })}
                className="w-full text-sm px-3 py-1.5 border rounded focus:border-navy-700 outline-none"
                placeholder="비우면 자동 트리거 X"
              />
              <datalist id="phase-list">
                {phases.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <FormField
              label="순서 (orderIndex)"
              type="number"
              value={form.orderIndex}
              onChange={(v) => setForm({ ...form, orderIndex: Number(v) || 0 })}
            />
            <label className="flex items-center gap-2 text-sm pt-5">
              <input
                type="checkbox"
                checked={!!form.requiresPhoto}
                onChange={(e) => setForm({ ...form, requiresPhoto: e.target.checked })}
                className="w-4 h-4 accent-navy-700"
              />
              📷 사진 첨부 필수
            </label>
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
            + {activePhase || '(공종 없음)'} 항목 추가
          </button>
        </div>
      )}
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
    if (!draft.phase.trim()) return;
    try {
      await phaseDeadlinesApi.upsert({ phase: draft.phase.trim(), daysBefore: Number(draft.daysBefore) });
      setDraft({ phase: '', daysBefore: 3 });
      reload();
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.error || e.message));
    }
  }
  async function update(rule, patch) {
    try {
      await phaseDeadlinesApi.update(rule.id, patch);
      reload();
    } catch (e) { alert('변경 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function remove(id) {
    if (!confirm('이 룰을 삭제할까요? 표준 기본값으로 돌아갑니다.')) return;
    await phaseDeadlinesApi.remove(id);
    reload();
  }
  async function seedAll() {
    if (!confirm('표준 D-N 룰 전체를 회사 룰로 가져옵니다 (기존 룰은 그대로 유지/덮어쓰기). 계속할까요?')) return;
    await phaseDeadlinesApi.seedDefaults();
    reload();
  }

  const ruleMap = new Map(rules.map((r) => [r.phase, r]));

  return (
    <Section title="공정별 발주 데드라인 (D-N 룰)">
      <p className="text-xs text-gray-500 mb-3">
        자재가 공정 시작 며칠 전까지 도착해야 하는지. 회사 룰이 우선, 없으면 표준 기본값 적용.
      </p>
      <div className="mb-3">
        <button
          onClick={seedAll}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 표준 룰 일괄 적용
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-2 py-1.5 w-1/3">공정명</th>
              <th className="text-right px-2 py-1.5 w-24">D-N (일)</th>
              <th className="text-center px-2 py-1.5 w-20">상태</th>
              <th className="text-left px-2 py-1.5">기본값</th>
              <th className="px-2 py-1.5 w-16"></th>
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
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== r.daysBefore) update(r, { daysBefore: v });
                    }}
                    className="w-16 text-right px-2 py-0.5 border rounded"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => update(r, { active: !r.active })}
                    className={`text-[10px] px-2 py-0.5 rounded ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500 line-through'}`}
                  >
                    {r.active ? '활성' : '비활성'}
                  </button>
                </td>
                <td className="px-2 py-1.5 text-gray-400">
                  {defaults[r.phase] != null ? `D-${defaults[r.phase]}` : '—'}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => remove(r.id)} className="text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
            {/* 표준값 중 회사 룰에 없는 것 — 흐리게 표시 */}
            {Object.entries(defaults).filter(([phase]) => !ruleMap.has(phase)).map(([phase, days]) => (
              <tr key={phase} className="opacity-50 hover:opacity-100">
                <td className="px-2 py-1.5 text-gray-600">{phase}</td>
                <td className="px-2 py-1.5 text-right text-gray-400">D-{days}</td>
                <td className="px-2 py-1.5 text-center text-gray-400 text-[10px]">표준값</td>
                <td className="px-2 py-1.5 text-gray-400">D-{days}</td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={() => phaseDeadlinesApi.upsert({ phase, daysBefore: days }).then(reload)}
                    className="text-xs text-navy-700 hover:underline"
                  >커스텀</button>
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
function PhaseAdvicesSection() {
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ phase: '', daysBefore: 1, title: '', category: '' });

  async function reload() {
    setLoading(true);
    try {
      const { advices } = await phaseAdvicesApi.list();
      setAdvices(advices);
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function add() {
    if (!draft.phase.trim() || !draft.title.trim()) return;
    try {
      await phaseAdvicesApi.create({
        phase: draft.phase.trim(),
        daysBefore: Number(draft.daysBefore),
        title: draft.title.trim(),
        category: draft.category.trim() || null,
      });
      setDraft({ phase: '', daysBefore: 1, title: '', category: '' });
      reload();
    } catch (e) { alert('저장 실패: ' + (e.response?.data?.error || e.message)); }
  }
  async function toggleActive(a) {
    await phaseAdvicesApi.update(a.id, { active: !a.active });
    reload();
  }
  async function remove(id) {
    if (!confirm('이 어드바이스를 삭제할까요?')) return;
    await phaseAdvicesApi.remove(id);
    reload();
  }
  async function seed() {
    if (!confirm('인테리어 표준 어드바이스 16개를 회사 룰로 추가합니다 (중복 스킵). 계속할까요?')) return;
    const r = await phaseAdvicesApi.seedStandard();
    alert(`✅ ${r.created}개 추가, ${r.skipped}개 스킵`);
    reload();
  }

  return (
    <Section title="공정 어드바이스 (체크리스트 자동 생성)">
      <p className="text-xs text-gray-500 mb-3">
        일정에 해당 공정이 추가되면 (시작일 - D-N) 날짜에 체크리스트로 자동 등록.
        예: "철거 D-3 → 보양 관련 관리실 문의" → 철거 일정 시작 3일 전에 체크리스트 알림.
      </p>
      <div className="mb-3">
        <button
          onClick={seed}
          className="text-sm px-4 py-2 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-50"
        >
          📋 표준 어드바이스 16개 시드 추가
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-2 py-1.5 w-20">공정</th>
              <th className="text-right px-2 py-1.5 w-12">D-N</th>
              <th className="text-left px-2 py-1.5">제목</th>
              <th className="text-left px-2 py-1.5 w-28">카테고리</th>
              <th className="text-center px-2 py-1.5 w-16">활성</th>
              <th className="px-2 py-1.5 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {advices.map((a) => (
              <tr key={a.id} className={`hover:bg-gray-50 ${a.active ? '' : 'opacity-50'}`}>
                <td className="px-2 py-1.5 font-medium text-navy-800">{a.phase}</td>
                <td className="px-2 py-1.5 text-right">D-{a.daysBefore}</td>
                <td className="px-2 py-1.5">{a.title}</td>
                <td className="px-2 py-1.5 text-gray-500">{a.category || '—'}</td>
                <td className="px-2 py-1.5 text-center">
                  <button onClick={() => toggleActive(a)} className="text-gray-500 hover:text-navy-700">
                    {a.active ? '✓' : '✕'}
                  </button>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => remove(a.id)} className="text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
            {advices.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-4 text-gray-400">등록된 어드바이스가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end border-t pt-3">
        <FormField
          label="공정 (예: 철거)"
          value={draft.phase}
          onChange={(v) => setDraft({ ...draft, phase: v })}
        />
        <FormField
          label="D-N (일)"
          type="number"
          value={draft.daysBefore}
          onChange={(v) => setDraft({ ...draft, daysBefore: v })}
        />
        <div className="md:col-span-2 flex gap-2 items-end">
          <FormField
            label="제목 (예: 보양 관련 관리실 문의)"
            value={draft.title}
            onChange={(v) => setDraft({ ...draft, title: v })}
          />
          <button
            onClick={add}
            className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 whitespace-nowrap"
          >+ 추가</button>
        </div>
      </div>
    </Section>
  );
}

// ============================================
// Helpers
// ============================================
function Section({ title, children, hint }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${hint ? 'border-dashed' : ''}`}>
      <div className="text-sm font-semibold text-navy-800 mb-3">{title}</div>
      {children}
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
