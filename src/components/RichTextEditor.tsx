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
        <div className="border border-surface-border rounded-lg overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/10 shadow-sm bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-surface-border bg-gray-50/80 backdrop-blur-sm">
                <Button
                    type={editor.isActive('bold') ? 'primary' : 'text'}
                    size="small"
                    icon={<BoldOutlined />}
                    className={`font-semibold ${editor.isActive('bold') ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                />
                <Button
                    type={editor.isActive('italic') ? 'primary' : 'text'}
                    size="small"
                    icon={<ItalicOutlined />}
                    className={`font-semibold ${editor.isActive('italic') ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                />
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <Button
                    type={editor.isActive('bulletList') ? 'primary' : 'text'}
                    size="small"
                    icon={<UnorderedListOutlined />}
                    className={`font-semibold ${editor.isActive('bulletList') ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                />
                <Button
                    type={editor.isActive('orderedList') ? 'primary' : 'text'}
                    size="small"
                    icon={<OrderedListOutlined />}
                    className={`font-semibold ${editor.isActive('orderedList') ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                />
            </div>

            {/* Editor area */}
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-4 min-h-36 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
            />
        </div>
    );
}
