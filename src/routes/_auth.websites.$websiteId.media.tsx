import { createFileRoute, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Upload,
    Button,
    Popconfirm,
    Typography,
    Empty,
    message,
    Image,
    Tooltip,
    Breadcrumb,
    Modal,
    Input,
    Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    DeleteOutlined,
    CopyOutlined,
    FileOutlined,
    FolderOutlined,
    FolderAddOutlined,
    EditOutlined,
    MoreOutlined,
    HomeOutlined,
    FolderOpenOutlined,
    ScissorOutlined,
} from '@ant-design/icons';
import { mediaApi } from '../lib/api';
import type { MediaAssetResponseDto, MediaFolderResponseDto } from '../lib/types';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Dragger } = Upload;

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string) {
    return contentType.startsWith('image/');
}

export const Route = createFileRoute('/_auth/websites/$websiteId/media')({
    component: MediaPage,
});

// A breadcrumb entry: { id: null = root, id: string = folder id }
interface BreadcrumbEntry {
    id: string | null;
    name: string;
}

function MediaPage() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId/media' });
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    // Current folder navigation state
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([
        { id: null, name: 'Root' },
    ]);
    const currentFolderId = breadcrumb[breadcrumb.length - 1].id;

    // Create folder modal
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Rename folder modal
    const [renameFolderTarget, setRenameFolderTarget] = useState<MediaFolderResponseDto | null>(null);
    const [renameFolderName, setRenameFolderName] = useState('');

    // Move asset modal
    const [moveAssetTarget, setMoveAssetTarget] = useState<MediaAssetResponseDto | null>(null);
    const [moveDestFolderId, setMoveDestFolderId] = useState<string | null | undefined>(undefined);

    // ── Queries ────────────────────────────────────────────────────────────
    const { data: folders } = useQuery({
        queryKey: ['media-folders', websiteId, currentFolderId],
        queryFn: () => mediaApi.getFolders(websiteId, currentFolderId),
    });

    const { data: assets } = useQuery({
        queryKey: ['media', websiteId, currentFolderId],
        queryFn: () => mediaApi.getAll(websiteId, currentFolderId),
    });

    // All root-level folders — used for move-to-folder list
    const { data: rootFolders } = useQuery({
        queryKey: ['media-folders', websiteId, null],
        queryFn: () => mediaApi.getFolders(websiteId, null),
    });

    // ── Mutations ──────────────────────────────────────────────────────────
    const createFolderMutation = useMutation({
        mutationFn: (name: string) =>
            mediaApi.createFolder(websiteId, { name, parentFolderId: currentFolderId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            messageApi.success('Folder created!');
            setCreateFolderOpen(false);
            setNewFolderName('');
        },
        onError: (err: { response?: { data?: { error?: string } } }) => {
            messageApi.error(err?.response?.data?.error ?? 'Failed to create folder.');
        },
    });

    const renameFolderMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            mediaApi.renameFolder(websiteId, id, { name }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            messageApi.success('Folder renamed.');
            setRenameFolderTarget(null);
            setRenameFolderName('');
        },
        onError: (err: { response?: { data?: { error?: string } } }) => {
            messageApi.error(err?.response?.data?.error ?? 'Failed to rename folder.');
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id: string) => mediaApi.deleteFolder(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            messageApi.success('Folder deleted.');
        },
        onError: (err: { response?: { data?: { error?: string } } }) => {
            messageApi.error(err?.response?.data?.error ?? 'Failed to delete folder.');
        },
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file, folderId }: { file: File; folderId: string | null }) =>
            mediaApi.upload(websiteId, file, folderId),
        onSuccess: (_, { folderId }) => {
            qc.invalidateQueries({ queryKey: ['media', websiteId, folderId] });
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            messageApi.success('File uploaded!');
        },
        onError: () => messageApi.error('Upload failed.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaApi.delete(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            messageApi.success('Asset deleted.');
        },
        onError: () => messageApi.error('Failed to delete asset.'),
    });

    const moveAssetMutation = useMutation({
        mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
            mediaApi.move(websiteId, id, { folderId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            qc.invalidateQueries({ queryKey: ['media-folders', websiteId] });
            messageApi.success('Asset moved.');
            setMoveAssetTarget(null);
        },
        onError: () => messageApi.error('Failed to move asset.'),
    });

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleUpload = (file: File) => {
        uploadMutation.mutate({ file, folderId: currentFolderId });
        return false;
    };

    const navigateInto = (folder: MediaFolderResponseDto) => {
        setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    };

    const navigateTo = (index: number) => {
        setBreadcrumb((prev) => prev.slice(0, index + 1));
    };

    const totalItems = (folders?.length ?? 0) + (assets?.length ?? 0);

    return (
        <div className="p-8">
            {contextHolder}

            {/* ── Page header ────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <Title level={2} className="mb-0! font-bold! text-gray-900!">
                        Media Library
                    </Title>
                    <Text className="text-muted! text-sm">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </Text>
                </div>
                <Button
                    icon={<FolderAddOutlined />}
                    onClick={() => setCreateFolderOpen(true)}
                >
                    New Folder
                </Button>
            </div>

            {/* ── Breadcrumb navigation ─────────────────────────────── */}
            <Breadcrumb
                className="mb-6"
                items={breadcrumb.map((crumb, index) => ({
                    title: (
                        <span
                            className={
                                index < breadcrumb.length - 1
                                    ? 'cursor-pointer text-primary hover:underline'
                                    : 'text-gray-700 font-medium'
                            }
                            onClick={() => {
                                if (index < breadcrumb.length - 1) navigateTo(index);
                            }}
                        >
                            {index === 0 ? <HomeOutlined className="mr-1" /> : null}
                            {crumb.name}
                        </span>
                    ),
                }))}
            />

            {/* ── Upload zone ───────────────────────────────────────── */}
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary-light/40 mb-6 mt-3">
                <Dragger
                    multiple
                    showUploadList={false}
                    beforeUpload={handleUpload}
                    accept="image/*,.pdf,.mp4,.webm"
                    className="bg-transparent! border-0!"
                >
                    <div className="py-8">
                        <p className="text-4xl mb-3">📁</p>
                        <p className="font-semibold text-gray-700">
                            Click or drag files to upload
                            {currentFolderId && (
                                <span className="text-primary"> into this folder</span>
                            )}
                        </p>
                        <p className="text-muted text-sm mt-1">
                            JPEG, PNG, WebP, GIF, SVG, PDF, MP4, WebM · Max 20 MB
                        </p>
                        {uploadMutation.isPending && (
                            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-[#213E9A]/30 border-t-[#213E9A] rounded-full" />
                                Uploading…
                            </div>
                        )}
                    </div>
                </Dragger>
            </div>

            {/* ── Folder + asset grid ───────────────────────────────── */}
            {totalItems === 0 ? (
                <Empty description="This folder is empty" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {folders?.map((folder) => (
                        <FolderCard
                            key={folder.id}
                            folder={folder}
                            onOpen={() => navigateInto(folder)}
                            onRename={() => {
                                setRenameFolderTarget(folder);
                                setRenameFolderName(folder.name);
                            }}
                            onDelete={() => deleteFolderMutation.mutate(folder.id)}
                        />
                    ))}
                    {assets?.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={() => deleteMutation.mutate(asset.id)}
                            onCopy={() => {
                                navigator.clipboard.writeText(asset.url);
                                messageApi.success('URL copied!');
                            }}
                            onMove={() => {
                                setMoveAssetTarget(asset);
                                setMoveDestFolderId(undefined);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── Create folder modal ───────────────────────────────── */}
            <Modal
                title="New Folder"
                open={createFolderOpen}
                onOk={() => {
                    if (newFolderName.trim()) createFolderMutation.mutate(newFolderName);
                }}
                onCancel={() => {
                    setCreateFolderOpen(false);
                    setNewFolderName('');
                }}
                confirmLoading={createFolderMutation.isPending}
                okText="Create"
            >
                <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={() => {
                        if (newFolderName.trim()) createFolderMutation.mutate(newFolderName);
                    }}
                    autoFocus
                    className="mt-2"
                />
            </Modal>

            {/* ── Rename folder modal ───────────────────────────────── */}
            <Modal
                title="Rename Folder"
                open={!!renameFolderTarget}
                onOk={() => {
                    if (renameFolderTarget && renameFolderName.trim()) {
                        renameFolderMutation.mutate({ id: renameFolderTarget.id, name: renameFolderName });
                    }
                }}
                onCancel={() => {
                    setRenameFolderTarget(null);
                    setRenameFolderName('');
                }}
                confirmLoading={renameFolderMutation.isPending}
                okText="Rename"
            >
                <Input
                    placeholder="New folder name"
                    value={renameFolderName}
                    onChange={(e) => setRenameFolderName(e.target.value)}
                    onPressEnter={() => {
                        if (renameFolderTarget && renameFolderName.trim()) {
                            renameFolderMutation.mutate({ id: renameFolderTarget.id, name: renameFolderName });
                        }
                    }}
                    autoFocus
                    className="mt-2"
                />
            </Modal>

            {/* ── Move asset modal ──────────────────────────────────── */}
            <Modal
                title={`Move "${moveAssetTarget?.fileName}"`}
                open={!!moveAssetTarget}
                onOk={() => {
                    if (moveAssetTarget) {
                        moveAssetMutation.mutate({
                            id: moveAssetTarget.id,
                            folderId: moveDestFolderId ?? null,
                        });
                    }
                }}
                onCancel={() => setMoveAssetTarget(null)}
                confirmLoading={moveAssetMutation.isPending}
                okText="Move"
            >
                <p className="text-sm text-muted mb-3">Select a destination folder:</p>
                <div className="flex flex-col gap-2">
                    <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${moveDestFolderId === null ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}
                        onClick={() => setMoveDestFolderId(null)}
                    >
                        <HomeOutlined className="text-muted" />
                        <span className="text-sm">Root</span>
                    </div>
                    {rootFolders?.map((f) => (
                        <div
                            key={f.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${moveDestFolderId === f.id ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50'}`}
                            onClick={() => setMoveDestFolderId(f.id)}
                        >
                            <FolderOutlined className="text-yellow-500" />
                            <span className="text-sm">{f.name}</span>
                            <span className="ml-auto text-xs text-muted">{f.assetCount} files</span>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}

function FolderCard({
    folder,
    onOpen,
    onRename,
    onDelete,
}: {
    folder: MediaFolderResponseDto;
    onOpen: () => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    const menuItems: MenuProps['items'] = [
        {
            key: 'rename',
            icon: <EditOutlined />,
            label: 'Rename',
            onClick: (e) => { e.domEvent.stopPropagation(); onRename(); },
        },
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
            className="bg-white rounded-xl overflow-hidden border border-surface-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            onClick={onOpen}
        >
            <div className="h-32 flex flex-col items-center justify-center bg-app-bg">
                <FolderOpenOutlined className="text-5xl text-yellow-400" />
            </div>
            <div className="p-3">
                <p className="text-xs font-medium text-gray-800 truncate mb-1">{folder.name}</p>
                <p className="text-[11px] text-muted mb-2">
                    {folder.assetCount} {folder.assetCount === 1 ? 'file' : 'files'}
                    {folder.subFolderCount > 0 && `, ${folder.subFolderCount} sub-folder${folder.subFolderCount > 1 ? 's' : ''}`}
                </p>
                <div className="flex justify-end">
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button
                            size="small"
                            type="text"
                            icon={<MoreOutlined />}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
}

function AssetCard({
    asset,
    onDelete,
    onCopy,
    onMove,
}: {
    asset: MediaAssetResponseDto;
    onDelete: () => void;
    onCopy: () => void;
    onMove: () => void;
}) {
    return (
        <div className="bg-white rounded-xl overflow-hidden border border-surface-border shadow-sm group hover:shadow-md transition-shadow">
            {isImage(asset.contentType) ? (
                <div className="h-32 overflow-hidden bg-app-bg flex items-center justify-center">
                    <Image
                        src={asset.url}
                        alt={asset.fileName}
                        className="object-cover w-full h-full"
                        preview={{ src: asset.url }}
                        height={128}
                        style={{ objectFit: 'cover' }}
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
                <p className="text-xs font-medium text-gray-800 truncate mb-1">
                    {asset.fileName}
                </p>
                <p className="text-[11px] text-muted mb-2">
                    {formatBytes(asset.sizeBytes)}
                </p>
                <div className="flex gap-1">
                    <Tooltip title="Copy URL">
                        <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={onCopy}
                            className="flex-1"
                        />
                    </Tooltip>
                    <Tooltip title="Move to folder">
                        <Button
                            size="small"
                            type="text"
                            icon={<ScissorOutlined />}
                            onClick={onMove}
                            className="flex-1"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this asset?"
                        onConfirm={onDelete}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} className="flex-1" />
                    </Popconfirm>
                </div>
            </div>
        </div>
    );
}

