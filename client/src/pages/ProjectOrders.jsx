// 프로젝트 detail 안의 "발주" 탭 — 글로벌 Orders 페이지를 projectId 고정해서 재활용
import { useParams } from 'react-router-dom';
import Orders from './Orders';

export default function ProjectOrders() {
  const { id } = useParams();
  return <Orders lockedProjectId={id} />;
}
