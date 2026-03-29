import { createFileRoute, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Upload,
    Card,
    Button,
    Popconfirm,
    Spin,
    Typography,
    Empty,
    message,
    Image,
    Tooltip,
} from 'antd';
import {
    DeleteOutlined,
    CopyOutlined,
    FileOutlined,
} from '@ant-design/icons';
import { mediaApi } from '../lib/api';
import type { MediaAssetResponseDto } from '../lib/types';

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

function MediaPage() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId/media' });
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const { data: assets, isPending } = useQuery({
        queryKey: ['media', websiteId],
        queryFn: () => mediaApi.getAll(websiteId),
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => mediaApi.upload(websiteId, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            messageApi.success('File uploaded!');
        },
        onError: () => messageApi.error('Upload failed.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaApi.delete(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['media', websiteId] });
            messageApi.success('Asset deleted.');
        },
        onError: () => messageApi.error('Failed to delete asset.'),
    });

    const handleUpload = (file: File) => {
        uploadMutation.mutate(file);
        return false; // prevent antd auto-upload
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {contextHolder}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Title level={2} className="!mb-0 !font-bold">
                        Media Library
                    </Title>
                    <Text className="!text-muted">{assets?.length ?? 0} assets</Text>
                </div>
            </div>

            {/* Upload zone */}
            <Card className="rounded-xl border border-dashed border-primary/30 bg-primary-light/40 mb-6">
                <Dragger
                    multiple
                    showUploadList={false}
                    beforeUpload={handleUpload}
                    accept="image/*,.pdf,.mp4,.webm"
                    className="bg-transparent border-0"
                >
                    <div className="py-6">
                        <p className="text-4xl mb-3">📁</p>
                        <p className="font-medium">
                            Click or drag files to upload
                        </p>
                        <p className="text-muted text-sm mt-1">
                            JPEG, PNG, WebP, GIF, SVG, PDF, MP4, WebM · Max 20 MB
                        </p>
                        {uploadMutation.isPending && (
                            <div className="mt-3">
                                <Spin size="small" /> <span className="text-sm text-muted ml-2">Uploading…</span>
                            </div>
                        )}
                    </div>
                </Dragger>
            </Card>

            {/* Grid */}
            {assets?.length === 0 ? (
                <Empty description="No media yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {assets?.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={() => deleteMutation.mutate(asset.id)}
                            onCopy={() => {
                                navigator.clipboard.writeText(asset.url);
                                messageApi.success('URL copied!');
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function AssetCard({
    asset,
    onDelete,
    onCopy,
}: {
    asset: MediaAssetResponseDto;
    onDelete: () => void;
    onCopy: () => void;
}) {
    return (
        <Card
            size="small"
            className="rounded-xl overflow-hidden border border-surface-border shadow-sm group hover:shadow-md transition-shadow"
            cover={
                isImage(asset.contentType) ? (
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
                        <Text className="!text-muted text-xs mt-1 uppercase">
                            {asset.contentType.split('/')[1]}
                        </Text>
                    </div>
                )
            }
            actions={[
                <Tooltip title="Copy URL" key="copy">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={onCopy} />
                </Tooltip>,
                <Popconfirm
                    key="delete"
                    title="Delete this file?"
                    onConfirm={onDelete}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>,
            ]}
        >
            <div className="truncate">
                <Text className="text-xs font-medium block truncate" title={asset.fileName}>
                    {asset.fileName}
                </Text>
                <Text type="secondary" className="text-xs">
                    {formatBytes(asset.sizeBytes)}
                </Text>
            </div>
        </Card>
    );
}
