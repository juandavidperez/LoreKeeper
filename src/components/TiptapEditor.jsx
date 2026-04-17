import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, Quote } from 'lucide-react'

export function TiptapEditor({ value, onChange, placeholder = 'Comienza a escribir...', className = '' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Markdown,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown())
    },
    editorProps: {
      attributes: {
        class: `prose prose-stone focus:outline-none max-w-none font-serif leading-relaxed italic text-primary-text min-h-[100px] transition-all p-3 rounded-sm ${className}`,
      },
    },
  })

  // Sync value from outside if it changes (e.g. initial load or AI autocomplete)
  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="tiptap-container w-full border border-primary/10 bg-white/5 rounded-sm focus-within:border-accent/40 focus-within:bg-white/10 transition-all">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-stone-800 text-white rounded shadow-lg overflow-hidden border border-stone-700">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-stone-700 border-r border-stone-700 ${editor.isActive('bold') ? 'text-accent' : ''}`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-stone-700 border-r border-stone-700 ${editor.isActive('italic') ? 'text-accent' : ''}`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 hover:bg-stone-700 border-r border-stone-700 ${editor.isActive('underline') ? 'text-accent' : ''}`}
          >
            <UnderlineIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 hover:bg-stone-700 ${editor.isActive('blockquote') ? 'text-accent' : ''}`}
          >
            <Quote size={14} />
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .tiptap blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          opacity: 0.8;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
      `}} />
    </div>
  )
}
