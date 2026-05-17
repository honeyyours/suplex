import { useState } from 'react';
import CrewLinkModal from './CrewLinkModal';

// Vendor 행에 인라인 노출되는 시공팀 연동 상태 + 액션 진입점.
// 상태: 연결됨 / 초대됨(미수락) / 미연결
// OWNER만 액션 가능. 그 외는 상태 배지만.

export default function CrewLinkBadge({ vendor, isOwner, onChanged }) {
  const [showModal, setShowModal] = useState(false);

  const linked = vendor.linkedCrewUserId && vendor.linkedCrew;
  const hasPendingInvite = !linked && vendor.crewInviteToken;

  return (
    <div className="flex items-center gap-1.5">
      {linked && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={`${vendor.linkedCrew.name}${vendor.linkedCrew.nickname ? ' (@' + vendor.linkedCrew.nickname + ')' : ''}`}
        >
          🔧 {vendor.linkedCrew.name}
        </span>
      )}
      {hasPendingInvite && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-700 border border-amber-200">
          ✉️ 초대됨
        </span>
      )}
      {!linked && !hasPendingInvite && (
        <span className="text-xs text-gray-400">-</span>
      )}

      {isOwner && (
        <button
          onClick={() => setShowModal(true)}
          className="text-xs px-1.5 py-0.5 border rounded hover:bg-gray-50 text-gray-600"
        >
          {linked ? '관리' : hasPendingInvite ? '관리' : '초대'}
        </button>
      )}

      {showModal && (
        <CrewLinkModal
          vendor={vendor}
          onClose={() => setShowModal(false)}
          onChanged={() => { onChanged?.(); }}
        />
      )}
    </div>
  );
}
