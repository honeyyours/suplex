import { useState } from 'react';
import CrewLinkModal from './CrewLinkModal';

// Vendor 행에 인라인 노출되는 시공팀 연동 상태 + 액션 진입점.
// 연결됨 / 미연결 두 상태만. 새 시공팀 초대는 회사 단위(CrewInvitationsPanel)로 이전됨 (Step 4).
// 미연결 상태의 액션 = "기존 시공팀 연결"만 (목공 3:1 케이스 등 이미 가입된 반장을 추가 Vendor에 묶을 때).

export default function CrewLinkBadge({ vendor, isOwner, onChanged }) {
  const [showModal, setShowModal] = useState(false);

  const linked = vendor.linkedCrewUserId && vendor.linkedCrew;

  return (
    <div className="flex items-center gap-1.5">
      {linked ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={`${vendor.linkedCrew.name}${vendor.linkedCrew.nickname ? ' (@' + vendor.linkedCrew.nickname + ')' : ''}`}
        >
          {vendor.linkedCrew.name}
        </span>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      )}

      {isOwner && (
        <button
          onClick={() => setShowModal(true)}
          className="text-xs px-1.5 py-0.5 border rounded hover:bg-gray-50 text-gray-600"
        >
          {linked ? '관리' : '연결'}
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
