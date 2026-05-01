import { createFileRoute, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Upload,
    Button,
    Input,
    Dropdown,
    Typography,
    Empty,
    Image,
    Tooltip,
    Modal,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    DeleteOutlined,
    CopyOutlined,
    FileOutlined,
    FolderOutlined,
    FolderOpenOutlined,
    FolderAddOutlined,
    EditOutlined,
    MoreOutlined,
    HomeOutlined,
    DragOutlined,
    RightOutlined,
    DownOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { mediaApi } from '../features/media/api';
import type { MediaAssetResponseDto, MediaFolderResponseDto } from '../features/media/types';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';
import { useState, type ReactNode } from 'react';

const { Text } = Typography;
const { Dragger } = Upload;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string) {
    return contentType.startsWith('image/');
}

/** Returns true if targetId is a descendant of ancestorId in the flat folder list. */
function isDescendant(
    allFolders: MediaFolderResponseDto[],
    ancestorId: string,
    targetId: string,
): boolean {
    let current: string | null = targetId;
    const visited = new Set<string>();
    while (current !== null) {
        if (visited.has(current)) return false;
        visited.add(current);
        if (current === ancestorId) return true;
        current = allFolders.find(f => f.id === current)?.parentFolderId ?? null;
    }
    return false;
}

function isValidFolderDrop(
    allFolders: MediaFolderResponseDto[],
    draggedFolderId: string,
    targetId: string | null,
): boolean {
    if (targetId === draggedFolderId) return false;
    if (targetId === null) return true;
    return !isDescendant(allFolders, draggedFolderId, targetId);
}

// ── Route ──────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/websites/$websiteId/media')({
    component: MediaPage,
});

// ── Drag state types ───────────────────────────────────────────────────────────

interface DragItem {
    type: 'folder' | 'asset';
    id: string;
}

// ── MediaPage ──────────────────────────────────────────────────────────────────

function MediaPage() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId/media' });
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    // ── Navigation ─────────────────────────────────────────────────────────
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // ── Modal state ────────────────────────────────────────────────────────
    // createFolderParentId: undefined = closed; null/string = open with parent
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null | undefined>(undefined);
    const [newFolderName, setNewFolderName] = useState('');
    const [renameFolderTarget, setRenameFolderTarget] = useState<MediaFolderResponseDto | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [moveAssetTarget, setMoveAssetTarget] = useState<MediaAssetResponseDto | null>(null);
    const [moveDestId, setMoveDestId] = useState<string | null | undefined>(undefined);

    // ── Drag-and-drop state ────────────────────────────────────────────────
    const [dragItem, setDragItem] = useState<DragItem | null>(null);
    // dropOverFolderId: undefined = no target, null = root, string = folder id
    const [dropOverFolderId, setDropOverFolderId] = useState<string | null | undefined>(undefined);

    // ── Queries ────────────────────────────────────────────────────────────
    const { data: allFolders = [], isLoading: foldersLoading, isError: foldersError } = useQuery({
        queryKey: ['media-folders-all', websiteId],
        queryFn: () => mediaApi.getAllFolders(websiteId),
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['media', websiteId, selectedFolderId],
        queryFn: () => mediaApi.getAll(websiteId, selectedFolderId),
    });

    // Derived
    const subFolders = allFolders
        .filter(f => f.parentFolderId === selectedFolderId)
        .sort((a, b) => a.name.localeCompare(b.name));
    const selectedFolder = allFolders.find(f => f.id === selectedFolderId) ?? null;

    // ── Query invalidation helpers ─────────────────────────────────────────
    const invalidateFolders = () => {
        qc.invalidateQueries({ queryKey: ['media-folders-all', websiteId] });
        qc.invalidateQueries({ queryKey: ['website-summary'] });
    };

    // ── Mutations ──────────────────────────────────────────────────────────
    const createFolderMutation = useMutation({
        mutationFn: (dto: { name: string; parentFolderId: string | null | undefined }) =>
            mediaApi.createFolder(websiteId, { name: dto.name, parentFolderId: dto.parentFolderId }),
        onSuccess: (_, vars) => {
            invalidateFolders();
            if (vars.parentFolderId) {
                setExpandedIds(prev => new Set([...prev, vars.parentFolderId as string]));
            }
            toast.success('Folder created.');
            setCreateFolderParentId(undefined);
            setNewFolderName('');
        },
        onError: (err: { response?: { data?: { error?: string } } }) =>
            toast.error(err?.response?.data?.error ?? 'Failed to create folder.'),
    });

    const renameFolderMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            mediaApi.renameFolder(websiteId, id, { name }),
        onSuccess: () => {
            invalidateFolders();
            toast.success('Folder renamed.');
            setRenameFolderTarget(null);
            setRenameValue('');
        },
        onError: (err: { response?: { data?: { error?: string } } }) =>
            toast.error(err?.response?.data?.error ?? 'Failed to rename folder.'),
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id: string) => mediaApi.deleteFolder(websiteId, id),
        onSuccess: (_, id) => {
            invalidateFolders();
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            if (selectedFolderId === id) setSelectedFolderId(null);
            toast.success('Folder deleted.');
        },
        onError: (err: { response?: { data?: { error?: string } } }) =>
            toast.error(err?.response?.data?.error ?? 'Failed to delete folder.'),
    });

    const moveFolderMutation = useMutation({
        mutationFn: ({ id, parentFolderId }: { id: string; parentFolderId: string | null }) =>
            mediaApi.moveFolder(websiteId, id, { parentFolderId }),
        onSuccess: (_, vars) => {
            invalidateFolders();
            if (vars.parentFolderId) {
                setExpandedIds(prev => new Set([...prev, vars.parentFolderId as string]));
            }
            toast.success('Folder moved.');
        },
        onError: (err: { response?: { data?: { error?: string } } }) =>
            toast.error(err?.response?.data?.error ?? 'Failed to move folder.'),
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file }: { file: File }) =>
            mediaApi.upload(websiteId, file, selectedFolderId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId, selectedFolderId] });
            invalidateFolders();
            toast.success('File uploaded.');
        },
        onError: () => toast.error('Upload failed. Please try again.'),
    });

    const deleteAssetMutation = useMutation({
        mutationFn: (id: string) => mediaApi.delete(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            invalidateFolders();
            toast.success('Asset deleted.');
        },
        onError: () => toast.error('Failed to delete asset.'),
    });

    const moveAssetMutation = useMutation({
        mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
            mediaApi.move(websiteId, id, { folderId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            invalidateFolders();
            toast.success('Asset moved.');
            setMoveAssetTarget(null);
        },
        onError: () => toast.error('Failed to move asset.'),
    });

    // ── Drag-and-drop handlers ─────────────────────────────────────────────

    const handleDragStart = (item: DragItem) => setDragItem(item);

    const handleDragEnd = () => {
        setDragItem(null);
        setDropOverFolderId(undefined);
    };

    const handleDragEnter = (targetFolderId: string | null) => {
        if (!dragItem) return;
        if (dragItem.type === 'folder' && !isValidFolderDrop(allFolders, dragItem.id, targetFolderId)) return;
        setDropOverFolderId(targetFolderId);
    };

    const handleDrop = (targetFolderId: string | null) => {
        setDropOverFolderId(undefined);
        if (!dragItem) return;

        if (dragItem.type === 'folder') {
            if (!isValidFolderDrop(allFolders, dragItem.id, targetFolderId)) return;
            const f = allFolders.find(x => x.id === dragItem.id);
            if (f?.parentFolderId === targetFolderId) return; // no-op
            moveFolderMutation.mutate({ id: dragItem.id, parentFolderId: targetFolderId });
        } else {
            const a = assets.find(x => x.id === dragItem.id);
            if (a?.folderId === targetFolderId) return; // no-op
            moveAssetMutation.mutate({ id: dragItem.id, folderId: targetFolderId });
        }
        setDragItem(null);
    };

    // ── Navigation helpers ─────────────────────────────────────────────────

    const navigateToFolder = (id: string | null) => setSelectedFolderId(id);

    const toggleExpand = (id: string) =>
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    // ── Breadcrumb path ────────────────────────────────────────────────────

    const breadcrumbPath: Array<{ id: string | null; name: string }> = [{ id: null, name: 'All Media' }];
    if (selectedFolder) {
        const chain: MediaFolderResponseDto[] = [];
        let cur: MediaFolderResponseDto | undefined = selectedFolder;
        while (cur) {
            chain.unshift(cur);
            cur = allFolders.find(f => f.id === cur!.parentFolderId);
        }
        chain.forEach(f => breadcrumbPath.push({ id: f.id, name: f.name }));
    }

    // ── Drop zone factory ──────────────────────────────────────────────────

    const dropZoneProps = (targetId: string | null) => ({
        onDragEnter: (e: React.DragEvent) => { e.preventDefault(); handleDragEnter(targetId); },
        onDragOver: (e: React.DragEvent) => e.preventDefault(),
        onDrop: (e: React.DragEvent) => { e.preventDefault(); handleDrop(targetId); },
    });

    const isDropTarget = (id: string | null) => dragItem !== null && dropOverFolderId === id;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

            {/* ── Folder tree sidebar ───────────────────────────────── */}
            <aside className="w-56 shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-border">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Folders</span>
                    <Tooltip title="New root folder">
                        <Button
                            type="text"
                            size="small"
                            icon={<FolderAddOutlined />}
                            onClick={() => setCreateFolderParentId(null)}
                        />
                    </Tooltip>
                </div>

                <div className="flex-1 overflow-y-auto py-1">
                    {/* Root node */}
                    <div
                        className={`group flex items-center gap-1 py-1.5 pr-1 rounded-lg mx-1 cursor-pointer transition-colors
                            ${selectedFolderId === null ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-app-bg text-gray-700'}
                            ${isDropTarget(null) ? 'ring-2 ring-inset ring-primary bg-primary/5' : ''}`}
                        style={{ paddingLeft: '4px' }}
                        onClick={() => navigateToFolder(null)}
                        {...dropZoneProps(null)}
                    >
                        <span className="w-4 h-4 shrink-0" />
                        <HomeOutlined className={`shrink-0 text-[13px] ${selectedFolderId === null ? 'text-primary' : 'text-[#213E9A]'}`} />
                        <span className="flex-1 text-xs truncate">All Media</span>
                    </div>

                    {/* Loading / error states */}
                    {foldersLoading && (
                        <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted">
                            <span className="animate-spin inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full" />
                            Loading folders…
                        </div>
                    )}
                    {foldersError && (
                        <div className="px-4 py-3 text-xs text-red-500">
                            Could not load folders. Check the browser console for details.
                        </div>
                    )}

                    {/* Root-level folder tree */}
                    {allFolders
                        .filter(f => f.parentFolderId === null)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(folder => (
                            <FolderTreeNode
                                key={folder.id}
                                folder={folder}
                                depth={1}
                                allFolders={allFolders}
                                selectedFolderId={selectedFolderId}
                                expandedIds={expandedIds}
                                dragItem={dragItem}
                                dropOverFolderId={dropOverFolderId}
                                onSelect={navigateToFolder}
                                onToggleExpand={toggleExpand}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragEnter={handleDragEnter}
                                onDrop={handleDrop}
                                onNewSubfolder={(pid) => setCreateFolderParentId(pid)}
                                onRename={(f) => { setRenameFolderTarget(f); setRenameValue(f.name); }}
                                onDelete={(f) =>
                                    deleteConfirm({
                                        title: 'Delete this folder?',
                                        description: 'This permanently removes the folder and all its assets.',
                                        onConfirm: () => deleteFolderMutation.mutateAsync(f.id),
                                    })
                                }
                            />
                        ))}
                </div>
            </aside>

            {/* ── Content area ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                {selectedFolder?.name ?? 'All Media'}
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-muted flex-wrap">
                                {breadcrumbPath.map((crumb, i) => (
                                    <span key={crumb.id ?? '__root'} className="flex items-center gap-1">
                                        {i > 0 && <span className="text-surface-border">/</span>}
                                        <button
                                            className={`hover:text-primary transition-colors ${i === breadcrumbPath.length - 1 ? 'text-gray-700 font-medium cursor-default' : 'cursor-pointer'}`}
                                            onClick={() => { if (i < breadcrumbPath.length - 1) navigateToFolder(crumb.id); }}
                                        >
                                            {i === 0 && <HomeOutlined className="mr-0.5" />}
                                            {crumb.name}
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <Button
                            icon={<FolderAddOutlined />}
                            onClick={() => setCreateFolderParentId(selectedFolderId ?? null)}
                        >
                            New Folder
                        </Button>
                    </div>

                    {/* Upload zone */}
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary-light/40 mb-6">
                        <Dragger
                            multiple
                            showUploadList={false}
                            beforeUpload={(file) => { uploadMutation.mutate({ file }); return false; }}
                            accept="image/*,.pdf,.mp4,.webm"
                            className="bg-transparent! border-0!"
                        >
                            <div className="py-6">
                                <p className="text-3xl mb-2">📁</p>
                                <p className="font-semibold text-gray-700 text-sm">
                                    Click or drag files to upload
                                    {selectedFolder && <span className="text-primary"> into {selectedFolder.name}</span>}
                                </p>
                                <p className="text-muted text-xs mt-1">JPEG, PNG, WebP, GIF, SVG, PDF, MP4, WebM · Max 20 MB</p>
                                {uploadMutation.isPending && (
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
                                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full" />
                                        Uploading…
                                    </div>
                                )}
                            </div>
                        </Dragger>
                    </div>

                    {/* Empty state */}
                    {subFolders.length === 0 && assets.length === 0 && (
                        <Empty
                            description={<span className="text-muted">This folder is empty — drop files here or click to upload.</span>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}

                    {/* Sub-folders */}
                    {subFolders.length > 0 && (
                        <section className="mb-6">
                            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Folders</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                {subFolders.map(folder => (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        isDragging={dragItem?.type === 'folder' && dragItem.id === folder.id}
                                        isDropTarget={isDropTarget(folder.id)}
                                        onOpen={() => {
                                            navigateToFolder(folder.id);
                                            setExpandedIds(prev => new Set([...prev, folder.id]));
                                        }}
                                        onRename={() => { setRenameFolderTarget(folder); setRenameValue(folder.name); }}
                                        onDelete={() =>
                                            deleteConfirm({
                                                title: 'Delete this folder?',
                                                description: 'This permanently removes the folder and all its assets.',
                                                onConfirm: () => deleteFolderMutation.mutateAsync(folder.id),
                                            })
                                        }
                                        onNewSubfolder={() => setCreateFolderParentId(folder.id)}
                                        onDragStart={() => handleDragStart({ type: 'folder', id: folder.id })}
                                        onDragEnd={handleDragEnd}
                                        {...dropZoneProps(folder.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Assets */}
                    {assets.length > 0 && (
                        <section>
                            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Files</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {assets.map(asset => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        isDragging={dragItem?.type === 'asset' && dragItem.id === asset.id}
                                        onDelete={() =>
                                            deleteConfirm({
                                                title: 'Delete this asset?',
                                                onConfirm: () => deleteAssetMutation.mutateAsync(asset.id),
                                            })
                                        }
                                        onCopy={() => {
                                            navigator.clipboard.writeText(asset.url);
                                            toast.success('URL copied.');
                                        }}
                                        onMove={() => { setMoveAssetTarget(asset); setMoveDestId(undefined); }}
                                        onDragStart={() => handleDragStart({ type: 'asset', id: asset.id })}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* ── Create folder modal ─────────────────────────────────── */}
            <Modal
                title={
                    createFolderParentId != null
                        ? `New folder inside "${allFolders.find(f => f.id === createFolderParentId)?.name ?? '…'}"`
                        : 'New folder at root'
                }
                open={createFolderParentId !== undefined}
                onOk={() => {
                    if (newFolderName.trim())
                        createFolderMutation.mutate({ name: newFolderName, parentFolderId: createFolderParentId });
                }}
                onCancel={() => { setCreateFolderParentId(undefined); setNewFolderName(''); }}
                confirmLoading={createFolderMutation.isPending}
                okText="Create"
            >
                <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={() => {
                        if (newFolderName.trim())
                            createFolderMutation.mutate({ name: newFolderName, parentFolderId: createFolderParentId });
                    }}
                    autoFocus
                    className="mt-2"
                />
            </Modal>

            {/* ── Rename folder modal ─────────────────────────────────── */}
            <Modal
                title="Rename Folder"
                open={!!renameFolderTarget}
                onOk={() => {
                    if (renameFolderTarget && renameValue.trim())
                        renameFolderMutation.mutate({ id: renameFolderTarget.id, name: renameValue });
                }}
                onCancel={() => { setRenameFolderTarget(null); setRenameValue(''); }}
                confirmLoading={renameFolderMutation.isPending}
                okText="Rename"
            >
                <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onPressEnter={() => {
                        if (renameFolderTarget && renameValue.trim())
                            renameFolderMutation.mutate({ id: renameFolderTarget.id, name: renameValue });
                    }}
                    autoFocus
                    className="mt-2"
                />
            </Modal>

            {/* ── Move asset modal ───────────────────────────────────── */}
            <Modal
                title={`Move "${moveAssetTarget?.fileName}"`}
                open={!!moveAssetTarget}
                onOk={() => {
                    if (moveAssetTarget && moveDestId !== undefined)
                        moveAssetMutation.mutate({ id: moveAssetTarget.id, folderId: moveDestId });
                }}
                onCancel={() => setMoveAssetTarget(null)}
                confirmLoading={moveAssetMutation.isPending}
                okText="Move"
                okButtonProps={{ disabled: moveDestId === undefined }}
            >
                <p className="text-xs text-muted mb-3">Select destination folder:</p>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                    <MovePickerRow
                        icon={<HomeOutlined />}
                        label="Root"
                        isSelected={moveDestId === null}
                        depth={0}
                        onClick={() => setMoveDestId(null)}
                    />
                    <MovePickerFolderTree
                        folders={allFolders}
                        parentId={null}
                        depth={1}
                        selectedId={moveDestId ?? undefined}
                        onSelect={setMoveDestId}
                    />
                </div>
            </Modal>
        </div>
    );
}

// ── Folder tree node (recursive) ───────────────────────────────────────────────

interface FolderTreeNodeProps {
    folder: MediaFolderResponseDto;
    depth: number;
    allFolders: MediaFolderResponseDto[];
    selectedFolderId: string | null;
    expandedIds: Set<string>;
    dragItem: DragItem | null;
    dropOverFolderId: string | null | undefined;
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onDragStart: (item: DragItem) => void;
    onDragEnd: () => void;
    onDragEnter: (targetId: string | null) => void;
    onDrop: (targetId: string | null) => void;
    onNewSubfolder: (parentId: string) => void;
    onRename: (folder: MediaFolderResponseDto) => void;
    onDelete: (folder: MediaFolderResponseDto) => void;
}

function FolderTreeNode({
    folder,
    depth,
    allFolders,
    selectedFolderId,
    expandedIds,
    dragItem,
    dropOverFolderId,
    onSelect,
    onToggleExpand,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDrop,
    onNewSubfolder,
    onRename,
    onDelete,
}: FolderTreeNodeProps) {
    const children = allFolders
        .filter(f => f.parentFolderId === folder.id)
        .sort((a, b) => a.name.localeCompare(b.name));

    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isDropTarget = dropOverFolderId === folder.id && dragItem !== null;
    const isDraggingThis = dragItem?.type === 'folder' && dragItem.id === folder.id;
    const hasChildren = children.length > 0 || folder.subFolderCount > 0;

    const menuItems: MenuProps['items'] = [
        {
            key: 'new',
            icon: <PlusOutlined />,
            label: 'New sub-folder',
            onClick: (e) => { e.domEvent.stopPropagation(); onNewSubfolder(folder.id); },
        },
        {
            key: 'rename',
            icon: <EditOutlined />,
            label: 'Rename',
            onClick: (e) => { e.domEvent.stopPropagation(); onRename(folder); },
        },
        { type: 'divider' },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: (e) => { e.domEvent.stopPropagation(); onDelete(folder); },
        },
    ];

    return (
        <div>
            <div
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart({ type: 'folder', id: folder.id }); }}
                onDragEnd={onDragEnd}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); onDragEnter(folder.id); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(folder.id); }}
                onClick={() => onSelect(folder.id)}
                className={`group flex items-center gap-1 py-1.5 pr-1 rounded-lg mx-1 cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-app-bg text-gray-700'}
                    ${isDropTarget ? 'ring-2 ring-inset ring-primary bg-primary/5' : ''}
                    ${isDraggingThis ? 'opacity-40' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <button
                    className="w-4 h-4 flex items-center justify-center shrink-0 text-muted hover:text-gray-700 rounded"
                    onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(folder.id); }}
                >
                    {hasChildren
                        ? (isExpanded
                            ? <DownOutlined className="text-[9px]" />
                            : <RightOutlined className="text-[9px]" />)
                        : null}
                </button>
                <FolderOutlined className={`shrink-0 text-[13px] ${isSelected ? 'text-primary' : 'text-amber-400'}`} />
                <span className="flex-1 text-xs truncate">{folder.name}</span>
                {folder.assetCount > 0 && (
                    <span className="text-[10px] text-muted tabular-nums shrink-0">{folder.assetCount}</span>
                )}
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreOutlined className="text-[11px] text-muted" />
                    </button>
                </Dropdown>
            </div>

            {isExpanded && children.map(child => (
                <FolderTreeNode
                    key={child.id}
                    folder={child}
                    depth={depth + 1}
                    allFolders={allFolders}
                    selectedFolderId={selectedFolderId}
                    expandedIds={expandedIds}
                    dragItem={dragItem}
                    dropOverFolderId={dropOverFolderId}
                    onSelect={onSelect}
                    onToggleExpand={onToggleExpand}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragEnter={onDragEnter}
                    onDrop={onDrop}
                    onNewSubfolder={onNewSubfolder}
                    onRename={onRename}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

// ── Folder card (content area) ─────────────────────────────────────────────────

function FolderCard({
    folder,
    isDragging,
    isDropTarget,
    onOpen,
    onRename,
    onDelete,
    onNewSubfolder,
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragOver,
    onDrop,
}: {
    folder: MediaFolderResponseDto;
    isDragging: boolean;
    isDropTarget: boolean;
    onOpen: () => void;
    onRename: () => void;
    onDelete: () => void;
    onNewSubfolder: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}) {
    const menuItems: MenuProps['items'] = [
        {
            key: 'new',
            icon: <PlusOutlined />,
            label: 'New sub-folder',
            onClick: (e) => { e.domEvent.stopPropagation(); onNewSubfolder(); },
        },
        {
            key: 'rename',
            icon: <EditOutlined />,
            label: 'Rename',
            onClick: (e) => { e.domEvent.stopPropagation(); onRename(); },
        },
        { type: 'divider' },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: (e) => { e.domEvent.stopPropagation(); onDelete(); },
        },
    ];

    return (
        <div
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
            onDragEnd={onDragEnd}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`group relative flex items-center gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm
                hover:shadow-md transition-all cursor-pointer select-none
                ${isDropTarget ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-surface-border hover:border-primary/40'}
                ${isDragging ? 'opacity-40' : ''}`}
            onClick={onOpen}
        >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderOpenOutlined className="text-2xl text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{folder.name}</p>
                <p className="text-[11px] text-muted mt-0.5">
                    {folder.assetCount} {folder.assetCount === 1 ? 'file' : 'files'}
                    {folder.subFolderCount > 0 && (
                        <span className="ml-1 text-gray-400">
                            · {folder.subFolderCount} {folder.subFolderCount === 1 ? 'subfolder' : 'subfolders'}
                        </span>
                    )}
                </p>
            </div>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button
                    size="small"
                    type="text"
                    icon={<MoreOutlined />}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => e.stopPropagation()}
                />
            </Dropdown>
        </div>
    );
}

// ── Asset card ─────────────────────────────────────────────────────────────────

function AssetCard({
    asset,
    isDragging,
    onDelete,
    onCopy,
    onMove,
    onDragStart,
    onDragEnd,
}: {
    asset: MediaAssetResponseDto;
    isDragging: boolean;
    onDelete: () => void;
    onCopy: () => void;
    onMove: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
            onDragEnd={onDragEnd}
            className={`bg-white rounded-xl overflow-hidden border border-surface-border shadow-sm
                group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none
                ${isDragging ? 'opacity-40' : ''}`}
        >
            {isImage(asset.contentType) ? (
                <div className="h-32 overflow-hidden bg-app-bg flex items-center justify-center">
                    <Image
                        src={asset.url}
                        alt={asset.fileName}
                        preview={{ src: asset.url }}
                        height={128}
                        style={{ objectFit: 'cover', width: '100%' }}
                    />
                </div>
            ) : (
                <div className="h-32 flex flex-col items-center justify-center bg-app-bg">
                    <FileOutlined className="text-4xl text-muted" />
                    <Text className="text-muted! text-xs mt-1 uppercase">
                        {asset.contentType.split('/')[1]}
                    </Text>
                </div>
            )}
            <div className="p-3">
                <p className="text-xs font-medium text-gray-800 truncate mb-1">{asset.fileName}</p>
                <p className="text-[11px] text-muted mb-2">{formatBytes(asset.sizeBytes)}</p>
                <div className="flex gap-1">
                    <Tooltip title="Copy URL">
                        <Button size="small" type="text" icon={<CopyOutlined />} onClick={onCopy} className="flex-1" />
                    </Tooltip>
                    <Tooltip title="Move to folder">
                        <Button size="small" type="text" icon={<DragOutlined />} onClick={onMove} className="flex-1" />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onDelete} className="flex-1" />
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

// ── Move-to-folder picker (used inside modal) ──────────────────────────────────

function MovePickerRow({
    icon,
    label,
    isSelected,
    depth,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    isSelected: boolean;
    depth: number;
    onClick: () => void;
}) {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                ${isSelected ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/40'}`}
            style={{ marginLeft: `${depth * 16}px` }}
            onClick={onClick}
        >
            <span className="text-muted">{icon}</span>
            <span className="text-sm flex-1">{label}</span>
        </div>
    );
}

function MovePickerFolderTree({
    folders,
    parentId,
    depth,
    selectedId,
    onSelect,
}: {
    folders: MediaFolderResponseDto[];
    parentId: string | null;
    depth: number;
    selectedId: string | undefined;
    onSelect: (id: string) => void;
}) {
    const children = folders
        .filter(f => f.parentFolderId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <>
            {children.map(f => (
                <div key={f.id}>
                    <MovePickerRow
                        icon={<FolderOutlined />}
                        label={f.name}
                        isSelected={selectedId === f.id}
                        depth={depth}
                        onClick={() => onSelect(f.id)}
                    />
                    <MovePickerFolderTree
                        folders={folders}
                        parentId={f.id}
                        depth={depth + 1}
                        selectedId={selectedId}
                        onSelect={onSelect}
                    />
                </div>
            ))}
        </>
    );
}
