'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

type Props = {
  content: string;
  onChange: (html: string) => void;
  bucket?: string;
};

export default function RichTextEditor({ content, onChange, bucket = 'news-images' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ controls: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      try {
        const supabase = createClient();
        const ext = file.name.split('.').pop();
        const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        editor.chain().focus().setImage({ src: data.publicUrl }).run();
      } catch (err) {
        alert('画像のアップロードに失敗しました: ' + String(err));
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('URLを入力してください');
    if (!url || !editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addYoutube = () => {
    const url = window.prompt('YouTube URLを入力してください');
    if (!url || !editor) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const addTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active
          ? 'text-black'
          : 'text-[#c8a830] hover:bg-[#1a1a1a]'
      }`}
      style={active ? { backgroundColor: '#d4af37' } : {}}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-[#2a2a1a] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2a1a] bg-[#0a0a0a]">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="見出し1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="見出し2"
        >
          H2
        </ToolbarButton>

        <span className="w-px bg-[#2a2a1a] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="太字"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体"
        >
          <em>I</em>
        </ToolbarButton>

        <span className="w-px bg-[#2a2a1a] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="箇条書き"
        >
          ・リスト
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="番号付きリスト"
        >
          1.リスト
        </ToolbarButton>

        <span className="w-px bg-[#2a2a1a] mx-1" />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="リンク">
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={uploadImage} title="画像">
          🖼️
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="YouTube">
          ▶️
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="テーブル">
          📊
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none bg-[#111111] text-[#d4af37] [&_.ProseMirror]:text-[#d4af37] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
