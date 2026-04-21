import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import ScheduleCalendar from '../components/ScheduleCalendar';
import ExtractModal from '../components/ExtractModal';
import ChangesModal from '../components/ChangesModal';

export default function ProjectSchedule() {
  const { id } = useParams();
  const { project } = useOutletContext();
  const [showExtract, setShowExtract] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  return (
    <div>
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={() => setShowChanges(true)}
          className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
        >
          📝 변동 로그
        </button>
        <button
          onClick={() => setShowExtract(true)}
          className="text-sm px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800"
        >
          🔍 일정추출
        </button>
      </div>
      <ScheduleCalendar projectId={id} project={project} />

      {showExtract && <ExtractModal projectId={id} onClose={() => setShowExtract(false)} />}
      {showChanges && <ChangesModal projectId={id} onClose={() => setShowChanges(false)} />}
    </div>
  );
}
