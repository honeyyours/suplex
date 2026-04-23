import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ReportTab from '../components/reports/ReportTab';
import MaterialRequestTab from '../components/reports/MaterialRequestTab';
import PhotoTimelineTab from '../components/reports/PhotoTimelineTab';

const TABS = [
  { key: 'report',   label: '오늘 작업 보고' },
  { key: 'request',  label: '자재 발주 요청' },
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
      {tab === 'request'  && <MaterialRequestTab projectId={id} />}
      {tab === 'timeline' && <PhotoTimelineTab projectId={id} />}
    </div>
  );
}
