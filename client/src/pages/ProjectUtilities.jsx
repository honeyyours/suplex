// 프로젝트 편의기능 탭 — 현장 단축 도구 모음
// 메인 워크플로우 탭(견적·공정 일정·마감재·발주)과 분리된 1-액션 도구를 한 자리에.
import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import ExtractModal from '../components/ExtractModal';

export default function ProjectUtilities() {
  const { id } = useParams();
  const { project } = useOutletContext();
  const [showExtract, setShowExtract] = useState(false);

  const tools = [
    {
      icon: '📋',
      title: '일정 복사',
      desc: '공종 키워드 검색 → 해당 일정·주소·특이사항을 카톡 친화 텍스트로 한 번에 복사 (일정 탭 햄버거 메뉴와 동일 기능)',
      action: () => setShowExtract(true),
      ready: true,
    },
    {
      icon: '💰',
      title: '인건비 정산',
      desc: '협력업체 작업자별 [일수×단가 + 식비 + 교통비] 자동 합산 → [작업자·계좌·금액·날짜] 카톡 텍스트 1초 복사. 확정 시 지출 탭에 자동 반영.',
      ready: false,
    },
    {
      icon: '📢',
      title: '입주민 안내문',
      desc: '아파트 엘베 부착용 안내문 자동 생성. 회사 디자인 템플릿에 현장명·공사기간·작업시간·연락처 자동 채움.',
      ready: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-navy-800">편의기능</h2>
        <p className="text-xs text-gray-500 mt-1">
          현장에서 자주 쓰는 단축 도구 모음. 메인 워크플로우와 분리된 1-액션 도구를 한 자리에.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            disabled={!tool.ready}
            onClick={tool.action}
            className={`text-left p-5 rounded-xl border transition ${
              tool.ready
                ? 'bg-white hover:bg-navy-50 hover:border-navy-300 cursor-pointer'
                : 'bg-gray-50 border-dashed cursor-not-allowed opacity-70'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{tool.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold ${tool.ready ? 'text-navy-800' : 'text-gray-600'}`}>
                    {tool.title}
                  </h3>
                  {!tool.ready && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                      준비 중
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showExtract && (
        <ExtractModal
          projectId={id}
          project={project}
          onClose={() => setShowExtract(false)}
        />
      )}
    </div>
  );
}
