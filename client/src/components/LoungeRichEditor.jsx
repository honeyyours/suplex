import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { useRef } from 'react';
import { loungeApi } from '../api/lounge';

// 라운지 글 작성/수정용 위지윅 에디터.
// onChange: (html, isEmpty) => void
// initialHtml: 처음 표시할 HTML (수정 시), plain 본문은 호출 측에서 plainToHtml 변환 후 전달.
export default function LoungeRichEditor({ initialHtml = '', onChange, placeholder = '마크다운/HTML 모두 지원합니다.', minRows = 10 }) {
  const fileInputRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({ inline: false, controls: true, nocookie: true, width: 640, height: 360 }),
    ],
    content: initialHtml || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const isEmpty = editor.isEmpty;
      onChange?.(html, isEmpty);
    },
  });

  if (!editor) return null;

  async function handlePickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const r = await loungeApi.uploadInlineImage(file);
      editor.chain().focus().setImage({ src: r.url, alt: file.name }).run();
    } catch (err) {
      alert('이미지 업로드 실패: ' + (err.response?.data?.error || err.message));
    }
  }

  function promptLink() {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('링크 주소', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function promptYoutube() {
    const url = window.prompt('유튜브 영상 주소', '');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  }

  const btn = (active) =>
    `px-2 py-1 text-xs rounded border ${
      active
        ? 'bg-navy-700 text-white border-navy-700'
        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게">
          <b>B</b>
        </button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임">
          <i>I</i>
        </button>
        <span className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="큰 제목">
          H2
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="작은 제목">
          H3
        </button>
        <span className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="불릿 리스트">
          • 리스트
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 리스트">
          1. 리스트
        </button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용">
          “ 인용
        </button>
        <button type="button" className={btn(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록">
          {'</>'}
        </button>
        <span className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button type="button" className={btn(editor.isActive('link'))} onClick={promptLink} title="링크">
          🔗 링크
        </button>
        <button type="button" className={btn(false)} onClick={() => fileInputRef.current?.click()} title="이미지 삽입">
          🖼 이미지
        </button>
        <button type="button" className={btn(false)} onClick={promptYoutube} title="유튜브 삽입">
          📺 유튜브
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm tiptap-content"
        style={{ minHeight: `${minRows * 1.6}em` }}
      />
    </div>
  );
}

// plain text 본문(레거시)을 TipTap이 다룰 HTML 문자열로 변환.
// 단락 분리는 빈 줄(\n\n+), 단락 내 줄바꿈은 <br>로.
export function plainToHtml(text) {
  if (!text) return '';
  const escape = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
