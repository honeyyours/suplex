import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProjectForm from '../components/ProjectForm';
import { projectsApi } from '../api/projects';
import { checklistFavoritesApi } from '../api/checklistFavorites';
import ChecklistFavoritesModal from '../components/ChecklistFavoritesModal';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState(null); // { id, name } — 모달 띄우는 중

  // 즐겨찾기 prefetch — 있으면 생성 후 자동 모달
  const { data: favData } = useQuery({
    queryKey: ['checklist-favorites'],
    queryFn: () => checklistFavoritesApi.list(),
  });
  const hasFavorites = (favData?.items?.length || 0) > 0;

  async function submit(payload) {
    const { project } = await projectsApi.create(payload);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    if (hasFavorites) {
      // 즐겨찾기 있으면 모달 띄움 → 모달 닫히면 프로젝트 상세로 이동
      setCreated({ id: project.id, name: project.name });
    } else {
      navigate(`/projects/${project.id}`);
    }
  }

  function closeModal() {
    if (!created) return;
    const id = created.id;
    setCreated(null);
    navigate(`/projects/${id}`);
  }

  return (
    <>
      <div className="bg-white rounded-xl border p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-navy-800 mb-6">새 프로젝트</h1>
        <ProjectForm
          onSubmit={submit}
          onCancel={() => navigate('/')}
          submitLabel="프로젝트 생성"
        />
      </div>
      {created && (
        <ChecklistFavoritesModal
          projectId={created.id}
          projectName={created.name}
          onClose={closeModal}
          onApplied={() => {}}
        />
      )}
    </>
  );
}
