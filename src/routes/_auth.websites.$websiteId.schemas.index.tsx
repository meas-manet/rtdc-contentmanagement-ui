// Schemas management page — list with PageHeader + TableCard + RowActions (matches Entries design)
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Button,
    Space,
    Tag,
    Typography,
    Empty,
} from 'antd';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { schemasApi } from '../features/schemas/api';
import { PageHeader } from '../shared/components/PageHeader';
import { TableCard } from '../shared/components/TableCard';
import { RowActions } from '../shared/components/RowActions';
import { LoadingScreen } from '../shared/components/LoadingScreen';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';
import type { SchemaResponseDto, SchemaFieldDto } from '../features/schemas/types';

const { Text } = Typography;

export const Route = createFileRoute('/_auth/websites/$websiteId/schemas/')({
    component: SchemasPage,
});

function SchemasPage() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId/schemas/' });
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    const { data: schemas, isPending } = useQuery({
        queryKey: ['schemas', websiteId],
        queryFn: () => schemasApi.getAll(websiteId),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => schemasApi.delete(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schemas', websiteId] });
            toast.success('The schema has been permanently deleted.');
        },
        onError: () => toast.error('Something went wrong while deleting the schema. Please try again.'),
    });

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, row: SchemaResponseDto) => (
                <button
                    className="font-semibold text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    onClick={() =>
                        navigate({
                            to: '/websites/$websiteId/schemas/$schemaId',
                            params: { websiteId, schemaId: row.id },
                        })
                    }
                >
                    {name}
                </button>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug: string) => <Tag color="blue">{slug}</Tag>,
        },
        {
            title: 'Fields',
            dataIndex: 'definition',
            key: 'fields',
            render: (def: SchemaFieldDto[]) => (
                <Space size={4} wrap>
                    {def.slice(0, 4).map((f) => (
                        <Tag key={f.name} color="geekblue">
                            {f.name}
                            <Text type="secondary" className="ml-1 text-xs">
                                :{f.type}
                            </Text>
                        </Tag>
                    ))}
                    {def.length > 4 && (
                        <Text type="secondary" className="text-xs">
                            +{def.length - 4} more
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (v: string) => (
                <Text type="secondary" className="text-sm">
                    {new Date(v).toLocaleDateString()}
                </Text>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_: unknown, row: SchemaResponseDto) => (
                <RowActions
                    editTooltip="Edit schema"
                    onEdit={() =>
                        navigate({
                            to: '/websites/$websiteId/schemas/$schemaId/edit',
                            params: { websiteId, schemaId: row.id },
                        })
                    }
                    onDelete={() =>
                        deleteConfirm({
                            title: 'Delete schema?',
                            description: 'All content entries for this schema will also be deleted.',
                            onConfirm: () => deleteMutation.mutateAsync(row.id),
                        })
                    }
                    deleteLoading={deleteMutation.isPending && deleteMutation.variables === row.id}
                />
            ),
        },
    ];

    if (isPending) return <LoadingScreen />;

    return (
        <div className="p-8">
            <PageHeader
                title="Content Types"
                subtitle={`${schemas?.length ?? 0} ${(schemas?.length ?? 0) === 1 ? 'schema' : 'schemas'} defined`}
                actions={
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() =>
                            navigate({
                                to: '/websites/$websiteId/schemas/new',
                                params: { websiteId },
                            })
                        }
                    >
                        New Schema
                    </Button>
                }
            />

            <TableCard
                dataSource={schemas}
                columns={columns}
                rowKey="id"
                loading={isPending}
                locale={{
                    emptyText: (
                        <Empty
                            description="No content types yet"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    navigate({
                                        to: '/websites/$websiteId/schemas/new',
                                        params: { websiteId },
                                    })
                                }
                            >
                                Create your first schema
                            </Button>
                        </Empty>
                    ),
                }}
                pagination={false}
            />
        </div>
    );
}
