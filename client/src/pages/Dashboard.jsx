import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BackupMenu from '../components/BackupMenu';
import HomeWeekSchedule from '../components/HomeWeekSchedule';
import HomeProjectCards from '../components/HomeProjectCards';
import HomeActivityFeed from '../components/HomeActivityFeed';

export default function Dashboard() {
  const { auth } = useAuth();
  const userName = auth?.user?.name || '';
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">
            {greeting}{userName && `, ${userName}님`} 👋
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            {formatToday()}
          </div>
        </div>
        <div className="flex gap-2">
          <BackupMenu />
          <Link
            to="/projects/new"
            className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + 새 프로젝트
          </Link>
        </div>
      </div>

      <HomeWeekSchedule />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HomeProjectCards status="IN_PROGRESS" />
        <HomeProjectCards status="PLANNED" />
      </div>

      <HomeActivityFeed days={7} limit={20} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '늦은 밤이에요';
  if (h < 12) return '좋은 아침입니다';
  if (h < 18) return '오늘도 화이팅';
  return '수고 많으셨습니다';
}

function formatToday() {
  const d = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
