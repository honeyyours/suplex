import { useQueryClient } from '@tanstack/react-query';
import ProjectForm from './ProjectForm';
import { projectsApi } from '../api/projects';

export default function EditProjectModal({ project, onClose, onSaved, onDeleted }) {
  const queryClient = useQueryClient();

  async function submit(payload) {
    const { project: updated } = await projectsApi.update(project.id, payload);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    onSaved?.(updated);
    onClose();
  }

  async function remove() {
    if (!confirm(`"${project.name}" 프로젝트를 삭제할까요?\n\n이 프로젝트의 모든 일정·체크리스트·변동로그가 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`)) return;
    await projectsApi.remove(project.id);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    onDeleted?.();
    onClose();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-3xl my-8"
      >
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy-800">프로젝트 편집</h2>
          <button
            onClick={remove}
            className="text-sm text-rose-600 hover:text-rose-700 hover:underline"
          >
            🗑 삭제
          </button>
        </div>
        <div className="px-6 py-6">
          <ProjectForm
            initial={project}
            onSubmit={submit}
            onCancel={onClose}
            submitLabel="저장"
          />
        </div>
      </div>
    </div>
  );
}
