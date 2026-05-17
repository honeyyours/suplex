import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomeTodayActions from '../components/HomeTodayActions';
import HomeWeekSchedule from '../components/HomeWeekSchedule';
import HomeWeekWidget from '../components/HomeWeekWidget';
import HomeProjectCards from '../components/HomeProjectCards';

export default function Dashboard() {
  const { auth } = useAuth();
  const userName = auth?.user?.name || '';
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div className="pl-2 pr-2 sm:pr-0">
        <h1 className="text-2xl font-bold text-navy-800">
          {greeting}{userName && `, ${userName}님`} 👋
        </h1>
        <div className="text-sm text-gray-500 mt-1">
          {formatToday()}
        </div>
      </div>

      {/* 이번주 일정 — 인사말 바로 다음 최상단. 모바일은 위젯, 데스크톱은 큰 캘린더 */}
      <HomeWeekWidget />
      <div className="hidden sm:block">
        <HomeWeekSchedule />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HomeProjectCards status="IN_PROGRESS" />
        <HomeProjectCards status="PLANNED" />
      </div>

      {/* 3일 안에 할 일 — 가장 밑 */}
      <HomeTodayActions />
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
