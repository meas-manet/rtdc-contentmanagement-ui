import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from 'antd';
import {
    BoldOutlined,
    ItalicOutlined,
    OrderedListOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';

interface RichTextEditorProps {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: placeholder ?? 'Start typing…' }),
        ],
        content: value ?? '',
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    if (!editor) return null;

    return (
        <div className="border border-surface-border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-surface-border bg-app-bg">
                <Button
                    type={editor.isActive('bold') ? 'primary' : 'text'}
                    size="small"
                    icon={<BoldOutlined />}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                />
                <Button
                    type={editor.isActive('italic') ? 'primary' : 'text'}
                    size="small"
                    icon={<ItalicOutlined />}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                />
                <Button
                    type={editor.isActive('bulletList') ? 'primary' : 'text'}
                    size="small"
                    icon={<UnorderedListOutlined />}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                />
                <Button
                    type={editor.isActive('orderedList') ? 'primary' : 'text'}
                    size="small"
                    icon={<OrderedListOutlined />}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                />
            </div>

            {/* Editor area */}
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
            />
        </div>
    );
}
