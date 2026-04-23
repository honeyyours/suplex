import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BackupMenu from '../components/BackupMenu';
import { companyApi } from '../api/company';
import { quoteTemplatesApi } from '../api/quoteTemplates';
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
    downloadFile(`splex_quote_templates_${today}.csv`, toCSV(rows));
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
