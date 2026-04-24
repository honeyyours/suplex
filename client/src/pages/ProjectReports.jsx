import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ReportTab from '../components/reports/ReportTab';
import PhotoTimelineTab from '../components/reports/PhotoTimelineTab';

// 자재 발주 탭은 향후 별도 발주 메뉴로 이전 예정 — 현재 숨김.
// MaterialRequest API/모델은 데이터 보존을 위해 유지.

const TABS = [
  { key: 'report',   label: '오늘 작업 보고' },
  { key: 'timeline', label: '사진 타임라인' },
];

export default function ProjectReports() {
  const { id } = useParams();
  const [tab, setTab] = useState('report');

  return (
    <div>
      <div className="flex border-b mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              tab === t.key
                ? 'border-navy-700 text-navy-800'
                : 'border-transparent text-gray-500 hover:text-navy-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'report'   && <ReportTab projectId={id} />}
      {tab === 'timeline' && <PhotoTimelineTab projectId={id} />}
    </div>
  );
}
