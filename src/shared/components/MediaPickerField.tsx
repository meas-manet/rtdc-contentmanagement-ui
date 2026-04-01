/**
 * MediaPickerField
 *
 * A form-compatible media picker that mirrors the Media Library UI:
 * folder breadcrumb navigation → folder grid → asset thumbnail grid.
 *
 * Value contract:
 *   single → string  (asset id)
 *   multi  → string[] (array of asset ids)
 */
import { useState } from 'react';
import { Button, Modal, Spin, Empty, Tooltip, Badge, Breadcrumb } from 'antd';
import {
    PictureOutlined,
    FileOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    PlusOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../../features/media/api';
import type { MediaAssetResponseDto, MediaFolderResponseDto } from '../../features/media/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function isImage(asset: MediaAssetResponseDto) {
    return asset.contentType.startsWith('image/');
}

function humanSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface BreadcrumbEntry {
    id: string | null;
    name: string;
}

// ── SelectedPreview — compact row shown in the form ───────────────────────────

interface SelectedPreviewProps {
    assets: MediaAssetResponseDto[];
    multi: boolean;
    onRemove: (id: string) => void;
    onOpen: () => void;
    disabled?: boolean;
}

function SelectedPreview({ assets, multi, onRemove, onOpen, disabled }: SelectedPreviewProps) {
    if (assets.length === 0) {
        return (
            <Button icon={<PictureOutlined />} onClick={onOpen} disabled={disabled} className="w-full">
                Choose from Media Library
            </Button>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {assets.map((asset) => (
                    <div key={asset.id} className="relative group w-20 h-20 rounded-lg border border-surface-border overflow-hidden bg-gray-50 shrink-0">
                        {isImage(asset) ? (
                            <img src={asset.url} alt={asset.fileName} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 p-1">
                                <FileOutlined className="text-xl" />
                                <span className="text-[9px] text-center break-all leading-tight line-clamp-2">{asset.fileName}</span>
                            </div>
                        )}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => onRemove(asset.id)}
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full leading-none border-0 cursor-pointer p-0"
                            >
                                <CloseCircleFilled className="text-red-500 text-sm drop-shadow" />
                            </button>
                        )}
                        <Tooltip title={`${asset.fileName} (${humanSize(asset.sizeBytes)})`}>
                            <div className="absolute inset-0" />
                        </Tooltip>
                    </div>
                ))}

                {multi && !disabled && (
                    <button
                        type="button"
                        onClick={onOpen}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer bg-transparent"
                    >
                        <PlusOutlined />
                        <span className="text-[10px]">Add</span>
                    </button>
                )}
            </div>

            {!multi && !disabled && (
                <Button size="small" icon={<PictureOutlined />} onClick={onOpen}>
                    Replace
                </Button>
            )}
        </div>
    );
}

// ── FolderRow — folder card inside the picker modal ──────────────────────────

function FolderRow({ folder, onOpen }: { folder: MediaFolderResponseDto; onOpen: () => void }) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex items-center gap-3 w-full bg-white rounded-xl border border-surface-border px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left"
        >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderOpenOutlined className="text-xl text-blue-400" />
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
            <FolderOutlined className="text-gray-300 group-hover:text-primary transition-colors" />
        </button>
    );
}

// ── AssetThumb — selectable asset card inside the picker modal ────────────────

function AssetThumb({ asset, selected, onClick }: { asset: MediaAssetResponseDto; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'relative group rounded-xl border-2 overflow-hidden text-left transition-all duration-150 cursor-pointer bg-gray-50 focus:outline-none w-full',
                selected ? 'border-blue-500 shadow-md shadow-blue-100' : 'border-transparent hover:border-blue-300',
            ].join(' ')}
            style={{ aspectRatio: '1 / 1' }}
        >
            {isImage(asset) ? (
                <img src={asset.url} alt={asset.fileName} className="w-full h-full object-cover" loading="lazy" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 p-2">
                    <FileOutlined className="text-[1.75rem]" />
                    <span className="text-xs text-center break-all leading-tight line-clamp-2">{asset.fileName}</span>
                </div>
            )}
            {selected && (
                <div className="absolute inset-0 bg-blue-500/10 flex items-start justify-end p-1">
                    <CheckCircleFilled className="text-blue-500 text-base drop-shadow" />
                </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {asset.fileName}
            </div>
        </button>
    );
}

// ── PickerBrowser — folder-browsing body inside the modal ─────────────────────

interface PickerBrowserProps {
    websiteId: string;
    breadcrumb: BreadcrumbEntry[];
    onNavigateInto: (folder: MediaFolderResponseDto) => void;
    onNavigateTo: (index: number) => void;
    pending: string[];
    onToggle: (id: string) => void;
    multi: boolean;
}

function PickerBrowser({ websiteId, breadcrumb, onNavigateInto, onNavigateTo, pending, onToggle, multi }: PickerBrowserProps) {
    const currentFolderId = breadcrumb[breadcrumb.length - 1].id;

    const { data: folders = [], isPending: foldersLoading } = useQuery({
        queryKey: ['media-folders', websiteId, currentFolderId],
        queryFn: () => mediaApi.getFolders(websiteId, currentFolderId),
        staleTime: 30_000,
    });

    const { data: assets = [], isPending: assetsLoading } = useQuery({
        queryKey: ['media', websiteId, currentFolderId],
        queryFn: () => mediaApi.getAll(websiteId, currentFolderId),
        staleTime: 30_000,
    });

    const loading = foldersLoading || assetsLoading;
    const empty = !loading && folders.length === 0 && assets.length === 0;

    return (
        <div>
            {/* Breadcrumb navigation */}
            <Breadcrumb
                className="mb-4"
                items={breadcrumb.map((crumb, index) => ({
                    title: (
                        <span
                            className={
                                index < breadcrumb.length - 1
                                    ? 'cursor-pointer text-primary hover:underline text-xs'
                                    : 'text-gray-700 font-medium text-xs'
                            }
                            onClick={() => { if (index < breadcrumb.length - 1) onNavigateTo(index); }}
                        >
                            {index === 0 ? <HomeOutlined className="mr-1" /> : null}
                            {crumb.name}
                        </span>
                    ),
                }))}
            />

            {loading ? (
                <div className="flex items-center justify-center py-16"><Spin /></div>
            ) : empty ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="This folder is empty" />
            ) : (
                <div className="space-y-5">
                    {folders.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Folders</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {folders.map((f) => (
                                    <FolderRow key={f.id} folder={f} onOpen={() => onNavigateInto(f)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {assets.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">
                                Files
                                {multi && pending.length > 0 && (
                                    <Badge count={pending.length} color="blue" className="ml-2" />
                                )}
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {assets.map((asset) => (
                                    <AssetThumb
                                        key={asset.id}
                                        asset={asset}
                                        selected={pending.includes(asset.id)}
                                        onClick={() => onToggle(asset.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export interface MediaPickerFieldProps {
    value?: string | string[];
    onChange?: (value: string | string[] | undefined) => void;
    websiteId: string;
    assetType?: 'single' | 'multi';
    disabled?: boolean;
}

export function MediaPickerField({ value, onChange, websiteId, assetType = 'single', disabled = false }: MediaPickerFieldProps) {
    const multi = assetType === 'multi';
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState<string[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([{ id: null, name: 'Root' }]);

    const confirmedIds: string[] = value ? (Array.isArray(value) ? value : [value]) : [];

    // Resolve confirmed asset ids → asset objects for the preview row
    const { data: previewAssets = [] } = useQuery({
        queryKey: ['media-preview-resolve', websiteId, confirmedIds.join(',')],
        queryFn: () => Promise.all(confirmedIds.map((id) => mediaApi.getById(websiteId, id)))
            .then((results) => results.filter(Boolean) as MediaAssetResponseDto[]),
        enabled: confirmedIds.length > 0,
        staleTime: 60_000,
    });

    const handleOpen = () => {
        setPending(confirmedIds);
        setBreadcrumb([{ id: null, name: 'Root' }]);
        setOpen(true);
    };

    const handleToggle = (id: string) => {
        if (multi) {
            setPending((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
        } else {
            setPending((prev) => (prev[0] === id ? [] : [id]));
        }
    };

    const handleConfirm = () => {
        onChange?.(multi ? (pending.length > 0 ? pending : undefined) : (pending[0] ?? undefined));
        setOpen(false);
    };

    const handleRemove = (id: string) => {
        if (multi) {
            const next = confirmedIds.filter((x) => x !== id);
            onChange?.(next.length > 0 ? next : undefined);
        } else {
            onChange?.(undefined);
        }
    };

    return (
        <>
            <SelectedPreview
                assets={previewAssets}
                multi={multi}
                onRemove={handleRemove}
                onOpen={handleOpen}
                disabled={disabled}
            />

            <Modal
                title={
                    <span className="flex items-center gap-2">
                        <PictureOutlined />
                        {multi ? 'Select assets from Media Library' : 'Select an asset from Media Library'}
                    </span>
                }
                open={open}
                onCancel={() => setOpen(false)}
                onOk={handleConfirm}
                okText={multi ? `Confirm (${pending.length} selected)` : 'Confirm'}
                okButtonProps={{ disabled: !multi && pending.length === 0 }}
                width={820}
                styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingTop: 8 } }}
                destroyOnClose
            >
                <PickerBrowser
                    websiteId={websiteId}
                    breadcrumb={breadcrumb}
                    onNavigateInto={(f) => setBreadcrumb((prev) => [...prev, { id: f.id, name: f.name }])}
                    onNavigateTo={(i) => setBreadcrumb((prev) => prev.slice(0, i + 1))}
                    pending={pending}
                    onToggle={handleToggle}
                    multi={multi}
                />
            </Modal>
        </>
    );
}
