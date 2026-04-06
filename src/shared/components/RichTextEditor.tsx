import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button, Input as AntInput, Modal, Popover, Select, Spin, Empty, Breadcrumb, Tooltip } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../../features/media/api';
import type { MediaAssetResponseDto, MediaFolderResponseDto } from '../../features/media/types';
import {
    AlignCenterOutlined,
    AlignLeftOutlined,
    AlignRightOutlined,
    BoldOutlined,
    CheckCircleFilled,
    CheckOutlined,
    CodeOutlined,
    FileOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    HomeOutlined,
    ItalicOutlined,
    LinkOutlined,
    MinusOutlined,
    OrderedListOutlined,
    PictureOutlined,
    RedoOutlined,
    SnippetsOutlined,
    StrikethroughOutlined,
    UnderlineOutlined,
    UnorderedListOutlined,
    UndoOutlined,
} from '@ant-design/icons';

// ── Custom blockquote icon (no Ant Design equivalent) ─────────────────────────
const BlockquoteIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
    </svg>
);

// ── Reusable toolbar primitives ───────────────────────────────────────────────
function Sep() {
    return <div className="w-px h-4 bg-gray-300 mx-0.5 self-center shrink-0" />;
}

interface TBtnProps {
    active?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    tooltip: string;
    onPress: () => void;
}
function TBtn({ active, disabled, icon, tooltip, onPress }: TBtnProps) {
    return (
        <Tooltip title={tooltip} mouseEnterDelay={0.6}>
            <Button
                type={active ? 'primary' : 'text'}
                size="small"
                icon={icon}
                disabled={disabled}
                className={active ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                onMouseDown={(e) => { e.preventDefault(); onPress(); }}
            />
        </Tooltip>
    );
}

// ── Heading options ───────────────────────────────────────────────────────────
const HEADING_OPTIONS = [
    { value: '0', label: 'Paragraph' },
    { value: '1', label: 'Heading 1' },
    { value: '2', label: 'Heading 2' },
    { value: '3', label: 'Heading 3' },
    { value: '4', label: 'Heading 4' },
];

// ── Inline image picker (reuses the media library) ────────────────────────────
interface ImagePickerProps {
    websiteId: string;
    open: boolean;
    onClose: () => void;
    onInsert: (url: string, alt: string) => void;
}

function isImg(asset: MediaAssetResponseDto) {
    return asset.contentType.startsWith('image/');
}

interface BreadcrumbEntry { id: string | null; name: string; }

function ImagePicker({ websiteId, open, onClose, onInsert }: ImagePickerProps) {
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([{ id: null, name: 'Root' }]);
    const [selected, setSelected] = useState<MediaAssetResponseDto | null>(null);
    const [altText, setAltText] = useState('');
    const currentFolderId = breadcrumb[breadcrumb.length - 1].id;

    const { data: folders = [], isPending: foldersLoading } = useQuery({
        queryKey: ['media-folders', websiteId, currentFolderId],
        queryFn: () => mediaApi.getFolders(websiteId, currentFolderId),
        enabled: open,
        staleTime: 30_000,
    });
    const { data: assets = [], isPending: assetsLoading } = useQuery({
        queryKey: ['media', websiteId, currentFolderId],
        queryFn: () => mediaApi.getAll(websiteId, currentFolderId),
        enabled: open,
        staleTime: 30_000,
    });

    const loading = foldersLoading || assetsLoading;
    const imageAssets = assets.filter(isImg);

    const handleNavigateInto = (f: MediaFolderResponseDto) =>
        setBreadcrumb((prev) => [...prev, { id: f.id, name: f.name }]);
    const handleNavigateTo = (i: number) =>
        setBreadcrumb((prev) => prev.slice(0, i + 1));

    const handleConfirm = () => {
        if (!selected) return;
        onInsert(selected.url, altText || selected.fileName);
        setSelected(null);
        setAltText('');
        setBreadcrumb([{ id: null, name: 'Root' }]);
    };

    const handleCancel = () => {
        setSelected(null);
        setAltText('');
        setBreadcrumb([{ id: null, name: 'Root' }]);
        onClose();
    };

    return (
        <Modal
            title={<span className="flex items-center gap-2"><PictureOutlined /> Insert Image from Media Library</span>}
            open={open}
            onCancel={handleCancel}
            onOk={handleConfirm}
            okText="Insert Image"
            okButtonProps={{ disabled: !selected }}
            width={820}
            styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingTop: 8 } }}
            destroyOnClose
        >
            {/* Breadcrumb */}
            <Breadcrumb
                className="mb-4"
                items={breadcrumb.map((crumb, index) => ({
                    title: (
                        <span
                            className={index < breadcrumb.length - 1
                                ? 'cursor-pointer text-primary hover:underline text-xs'
                                : 'text-gray-700 font-medium text-xs'}
                            onClick={() => { if (index < breadcrumb.length - 1) handleNavigateTo(index); }}
                        >
                            {index === 0 ? <HomeOutlined className="mr-1" /> : null}{crumb.name}
                        </span>
                    ),
                }))}
            />

            {loading ? (
                <div className="flex items-center justify-center py-16"><Spin /></div>
            ) : (
                <div className="space-y-5">
                    {/* Folders */}
                    {folders.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Folders</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {folders.map((f) => (
                                    <button key={f.id} type="button" onClick={() => handleNavigateInto(f)}
                                        className="group flex items-center gap-3 w-full bg-white rounded-xl border border-surface-border px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left">
                                        <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <FolderOpenOutlined className="text-xl text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{f.name}</p>
                                            <p className="text-[11px] text-muted mt-0.5">{f.assetCount} files</p>
                                        </div>
                                        <FolderOutlined className="text-gray-300 group-hover:text-primary transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {imageAssets.length > 0 ? (
                        <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Images</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {imageAssets.map((asset) => (
                                    <button key={asset.id} type="button" onClick={() => setSelected(asset)}
                                        className={[
                                            'relative group rounded-xl border-2 overflow-hidden transition-all duration-150 cursor-pointer bg-gray-50 focus:outline-none w-full',
                                            selected?.id === asset.id ? 'border-blue-500 shadow-md shadow-blue-100' : 'border-transparent hover:border-blue-300',
                                        ].join(' ')}
                                        style={{ aspectRatio: '1 / 1' }}
                                    >
                                        <img src={asset.url} alt={asset.fileName} className="w-full h-full object-cover" loading="lazy" />
                                        {selected?.id === asset.id && (
                                            <div className="absolute inset-0 bg-blue-500/10 flex items-start justify-end p-1">
                                                <CheckCircleFilled className="text-blue-500 text-base drop-shadow" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                            {asset.fileName}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        !loading && folders.length === 0 && (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No images in this folder" />
                        )
                    )}

                    {/* Non-image files notice */}
                    {assets.filter((a) => !isImg(a)).length > 0 && imageAssets.length === 0 && (
                        <div className="flex items-center gap-2 text-muted text-xs">
                            <FileOutlined /> This folder contains files but no images.
                        </div>
                    )}
                </div>
            )}

            {/* Alt text */}
            {selected && (
                <div className="mt-5 pt-4 border-t border-surface-border">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Alt text (optional)</p>
                    <AntInput
                        size="small"
                        placeholder={selected.fileName}
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                    />
                    <p className="text-[11px] text-muted mt-1">Describes the image for screen readers and SEO.</p>
                </div>
            )}
        </Modal>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    websiteId?: string;
}

export function RichTextEditor({ value, onChange, placeholder, disabled, websiteId }: RichTextEditorProps) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imagePickerOpen, setImagePickerOpen] = useState(false);
    // Track the last value emitted via onChange so we don't re-set content unnecessarily
    const lastEmitted = useRef<string | undefined>(undefined);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
            Placeholder.configure({ placeholder: placeholder ?? 'Start typing…' }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: false, allowBase64: false }),
        ],
        content: value ?? '',
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            lastEmitted.current = html;
            onChange?.(html);
        },
    });

    // Sync external value changes (e.g. switching locale tab resets form fields)
    useEffect(() => {
        if (!editor || value === undefined) return;
        if (value !== lastEmitted.current && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
            lastEmitted.current = value;
        }
    }, [value, editor]);

    // Keep editable flag in sync
    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [disabled, editor]);

    const openLinkPopover = useCallback(() => {
        if (!editor) return;
        setLinkUrl((editor.getAttributes('link').href as string) ?? '');
        setLinkOpen(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor) return;
        if (!linkUrl.trim()) {
            editor.chain().focus().unsetLink().run();
        } else {
            const href = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
            editor.chain().focus().setLink({ href, target: '_blank' }).run();
        }
        setLinkOpen(false);
    }, [editor, linkUrl]);

    const getHeadingValue = () => {
        if (!editor) return '0';
        for (let i = 1; i <= 4; i++) {
            if (editor.isActive('heading', { level: i })) return String(i);
        }
        return '0';
    };

    const setHeading = (val: string) => {
        if (!editor) return;
        if (val === '0') {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().setHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 }).run();
        }
    };

    if (!editor) return null;

    const linkPopoverContent = (
        <div className="flex items-center gap-2" style={{ width: 280 }}>
            <AntInput
                size="small"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onPressEnter={applyLink}
                autoFocus
            />
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={applyLink} />
            {editor.isActive('link') && (
                <Button size="small" danger onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setLinkOpen(false);
                }}>
                    Remove
                </Button>
            )}
        </div>
    );

    return (
        <div className="border border-surface-border rounded-lg overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/10 shadow-sm bg-white">

            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            {!disabled && (
                <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-surface-border bg-gray-50/80 backdrop-blur-sm">

                    {/* Heading selector */}
                    <Select
                        size="small"
                        value={getHeadingValue()}
                        onChange={setHeading}
                        options={HEADING_OPTIONS}
                        style={{ width: 120 }}
                        popupMatchSelectWidth={false}
                    />
                    <Sep />

                    {/* Inline formatting */}
                    <TBtn active={editor.isActive('bold')} icon={<BoldOutlined />} tooltip="Bold (Ctrl+B)" onPress={() => editor.chain().focus().toggleBold().run()} />
                    <TBtn active={editor.isActive('italic')} icon={<ItalicOutlined />} tooltip="Italic (Ctrl+I)" onPress={() => editor.chain().focus().toggleItalic().run()} />
                    <TBtn active={editor.isActive('underline')} icon={<UnderlineOutlined />} tooltip="Underline (Ctrl+U)" onPress={() => editor.chain().focus().toggleUnderline().run()} />
                    <TBtn active={editor.isActive('strike')} icon={<StrikethroughOutlined />} tooltip="Strikethrough" onPress={() => editor.chain().focus().toggleStrike().run()} />
                    <TBtn active={editor.isActive('code')} icon={<CodeOutlined />} tooltip="Inline Code" onPress={() => editor.chain().focus().toggleCode().run()} />
                    <Sep />

                    {/* Alignment */}
                    <TBtn active={editor.isActive({ textAlign: 'left' })} icon={<AlignLeftOutlined />} tooltip="Align Left" onPress={() => editor.chain().focus().setTextAlign('left').run()} />
                    <TBtn active={editor.isActive({ textAlign: 'center' })} icon={<AlignCenterOutlined />} tooltip="Align Centre" onPress={() => editor.chain().focus().setTextAlign('center').run()} />
                    <TBtn active={editor.isActive({ textAlign: 'right' })} icon={<AlignRightOutlined />} tooltip="Align Right" onPress={() => editor.chain().focus().setTextAlign('right').run()} />
                    <Sep />

                    {/* Lists */}
                    <TBtn active={editor.isActive('bulletList')} icon={<UnorderedListOutlined />} tooltip="Bullet List" onPress={() => editor.chain().focus().toggleBulletList().run()} />
                    <TBtn active={editor.isActive('orderedList')} icon={<OrderedListOutlined />} tooltip="Numbered List" onPress={() => editor.chain().focus().toggleOrderedList().run()} />
                    <Sep />

                    {/* Blocks */}
                    <TBtn active={editor.isActive('blockquote')} icon={<BlockquoteIcon />} tooltip="Blockquote" onPress={() => editor.chain().focus().toggleBlockquote().run()} />
                    <TBtn active={editor.isActive('codeBlock')} icon={<SnippetsOutlined />} tooltip="Code Block" onPress={() => editor.chain().focus().toggleCodeBlock().run()} />
                    <TBtn active={false} icon={<MinusOutlined />} tooltip="Horizontal Rule" onPress={() => editor.chain().focus().setHorizontalRule().run()} />
                    <Sep />

                    {/* Link */}
                    <Popover
                        open={linkOpen}
                        onOpenChange={setLinkOpen}
                        content={linkPopoverContent}
                        title="Insert / Edit Link"
                        trigger="click"
                        placement="bottomLeft"
                    >
                        <Tooltip title="Link" mouseEnterDelay={0.6}>
                            <Button
                                type={editor.isActive('link') ? 'primary' : 'text'}
                                size="small"
                                icon={<LinkOutlined />}
                                className={editor.isActive('link') ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                                onMouseDown={(e) => { e.preventDefault(); openLinkPopover(); }}
                            />
                        </Tooltip>
                    </Popover>
                    <Sep />

                    {/* History */}
                    <TBtn active={false} disabled={!editor.can().undo()} icon={<UndoOutlined />} tooltip="Undo (Ctrl+Z)" onPress={() => editor.chain().focus().undo().run()} />
                    <TBtn active={false} disabled={!editor.can().redo()} icon={<RedoOutlined />} tooltip="Redo (Ctrl+Y)" onPress={() => editor.chain().focus().redo().run()} />

                    {websiteId && (
                        <>
                            <Sep />
                            <TBtn active={false} icon={<PictureOutlined />} tooltip="Insert Image" onPress={() => setImagePickerOpen(true)} />
                        </>
                    )}
                </div>
            )}

            {/* ── Editor area ───────────────────────────────────────────────── */}
            <EditorContent
                editor={editor}
                className="
                    prose prose-sm max-w-none p-4 min-h-48 focus:outline-none
                    [&_.ProseMirror]:outline-none
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
                    [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a:hover]:text-blue-800
                    [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gray-500
                    [&_.ProseMirror_pre]:bg-gray-100 [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm
                    [&_.ProseMirror_code:not(pre_code)]:bg-gray-100 [&_.ProseMirror_code:not(pre_code)]:rounded [&_.ProseMirror_code:not(pre_code)]:px-1 [&_.ProseMirror_code:not(pre_code)]:text-sm [&_.ProseMirror_code:not(pre_code)]:font-mono
                    [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:my-4
                    [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-2
                "
            />

            {/* Image picker modal */}
            {websiteId && (
                <ImagePicker
                    websiteId={websiteId}
                    open={imagePickerOpen}
                    onClose={() => setImagePickerOpen(false)}
                    onInsert={(url, alt) => {
                        editor?.chain().focus().setImage({ src: url, alt }).run();
                        setImagePickerOpen(false);
                    }}
                />
            )}
        </div>
    );
}
