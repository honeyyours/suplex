import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomeTodayActions from '../components/HomeTodayActions';
import HomeWeeklyBrief from '../components/HomeWeeklyBrief';
import HomeWeekSchedule from '../components/HomeWeekSchedule';
import HomeProjectCards from '../components/HomeProjectCards';

export default function Dashboard() {
  const { auth } = useAuth();
  const userName = auth?.user?.name || '';
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 pl-2 pr-2 sm:pr-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-navy-800">
            {greeting}{userName && `, ${userName}님`} 👋
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            {formatToday()}
          </div>
        </div>
        <Link
          to="/projects/new"
          className="bg-navy-700 hover:bg-navy-800 active:bg-navy-900 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-md shadow-sm whitespace-nowrap inline-flex items-center gap-1 shrink-0 self-start mt-1.5"
          aria-label="새 프로젝트 추가"
        >
          <span className="text-base leading-none -mt-px">+</span>
          <span>새 프로젝트</span>
        </Link>
      </div>

      <HomeTodayActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HomeProjectCards status="IN_PROGRESS" />
        <HomeProjectCards status="PLANNED" />
      </div>

      <HomeWeekSchedule />

      <HomeWeeklyBrief />
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
