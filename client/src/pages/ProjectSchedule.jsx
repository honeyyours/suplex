// 공정 일정 탭 — 헤더 액션(변동 로그 / 일정 추출 / 수정 / 백업)은 ProjectDetail의 햄버거 메뉴로 통합됨.
import { useOutletContext, useParams } from 'react-router-dom';
import ScheduleCalendar from '../components/ScheduleCalendar';

export default function ProjectSchedule() {
  const { id } = useParams();
  const { project } = useOutletContext();
  return <ScheduleCalendar projectId={id} project={project} />;
}
