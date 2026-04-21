import ComingSoon from '../components/ComingSoon';

export default function TeamManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-800">팀 관리</h1>
      </div>

      <div className="bg-white rounded-xl border">
        <ComingSoon
          icon="👥"
          title="팀원 · 협력업체 관리"
          description="회사 계정에 속한 구성원과 협력업체를 관리합니다."
          items={[
            '팀원 목록 (이름 / 이메일 / 역할)',
            '이메일 초대 + 역할 지정 (대표 / 디자인팀 / 현장팀)',
            '권한 분기 (조회 / 수정 / 삭제)',
            '협력업체 등록 (연락처 / 공종 / 단가 / 이력)',
            '협력업체 검색 · 프로젝트별 배정',
          ]}
        />
      </div>
    </div>
  );
}
