import { useState, useRef, useEffect } from 'react';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import VendorAutocomplete from './VendorAutocomplete';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

export default function ScheduleAddForm({ onSubmit, onCancel }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState({ vendorId: null, vendorName: '' });
  const ref = useRef(null);
  const phases = useCompanyPhases();
  const { displayPhase } = usePhaseLabels();

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSubmit({
      content: trimmed,
      category: category || null,
      vendorId: vendor.vendorId,
    });
    setContent('');
    setCategory('');
    setVendor({ vendorId: null, vendorName: '' });
    ref.current?.focus();
  }

  return (
    <div className="border-2 border-navy-500 rounded bg-white p-1.5 space-y-1">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full text-[11px] border rounded px-1 py-0.5 bg-white"
      >
        <option value="">(공종 없음)</option>
        {phases.map((c) => (
          <option key={c} value={c}>{displayPhase(c)}</option>
        ))}
      </select>
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          else if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); submit(); }
        }}
        placeholder="내용 (Ctrl+Enter 저장)"
        rows={2}
        className="w-full text-xs border rounded px-1 py-0.5 resize-none"
      />
      <VendorAutocomplete
        value={vendor}
        onChange={setVendor}
        category={category}
        placeholder="협력업체 (선택)"
        className="text-[11px]"
        allowFreeText={false}
      />
      <div className="flex gap-1">
        <button onClick={submit} className="flex-1 text-[11px] bg-navy-700 text-white rounded py-0.5">추가</button>
        <button onClick={onCancel} className="text-[11px] bg-gray-200 rounded px-2">취소</button>
      </div>
    </div>
  );
}
