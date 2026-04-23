import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ProjectForm from '../components/ProjectForm';
import { projectsApi } from '../api/projects';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function submit(payload) {
    const { project } = await projectsApi.create(payload);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    navigate(`/projects/${project.id}`);
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-navy-800 mb-6">새 프로젝트</h1>
      <ProjectForm
        onSubmit={submit}
        onCancel={() => navigate('/')}
        submitLabel="프로젝트 생성"
      />
    </div>
  );
}
