// Content table for a specific schema — lists entries with status tags & actions
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Table,
    Button,
    Tag,
    Space,
    Popconfirm,
    Spin,
    Typography,
    message,
    Select,
    Card,
    Empty,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { schemasApi, websitesApi } from '../lib/api';
import { toLocaleOptions, useLocales } from '../lib/locales';
import type { ContentEntryResponseDto, SchemaFieldDto } from '../lib/types';

const { Title, Text } = Typography;



export const Route = createFileRoute('/_auth/websites/$websiteId/schemas/$schemaId/')({
    component: ContentTablePage,
});

function ContentTablePage() {
    const { websiteId, schemaId } = useParams({
        from: '/_auth/websites/$websiteId/schemas/$schemaId/',
    });
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [locale, setLocale] = useState('en');
    const [page, setPage] = useState(1);

    const { data: website } = useQuery({
        queryKey: ['websites', websiteId],
        queryFn: () => websitesApi.getById(websiteId),
    });

    const { data: localeData = [] } = useLocales();
    const localeOptions = toLocaleOptions(website?.supportedLocales ?? ['en'], localeData);

    const { data: schema } = useQuery({
        queryKey: ['schemas', websiteId, schemaId],
        queryFn: () => schemasApi.getById(websiteId, schemaId),
    });

    const { data: pagedResult, isPending } = useQuery({
        queryKey: ['content', websiteId, schemaId, locale, page],
        queryFn: () =>
            schemasApi.getEntries(websiteId, schemaId, {
                locale,
                page,
                pageSize: 20,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => schemasApi.deleteEntry(websiteId, schemaId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['content', websiteId, schemaId] });
            messageApi.success('Entry deleted.');
        },
        onError: () => messageApi.error('Failed to delete entry.'),
    });

    const definition: SchemaFieldDto[] = schema?.definition ?? [];

    // Build dynamic columns from schema definition (first 3 fields as preview columns)
    const previewFields = definition.slice(0, 3);

    const dynamicColumns = previewFields.map((field) => ({
        title: <span className="capitalize">{field.name.replace(/_/g, ' ')}</span>,
        key: field.name,
        ellipsis: true,
        render: (_: unknown, row: ContentEntryResponseDto) => {
            const val = row.data[field.name];
            if (val === undefined || val === null) return <Text type="secondary">—</Text>;
            if (typeof val === 'boolean') return <Tag>{val ? 'true' : 'false'}</Tag>;
            if (field.type === 'richtext')
                return (
                    <span
                        className="text-sm text-muted line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: String(val).slice(0, 80) }}
                    />
                );
            return <span className="text-sm">{String(val).slice(0, 60)}</span>;
        },
    }));

    const columns = [
        ...dynamicColumns,
        {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_: unknown, row: ContentEntryResponseDto) => (
                <Tag color={row.status === 'published' ? 'green' : 'gold'}>
                    {row.status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Locale',
            key: 'locale',
            width: 80,
            render: (_: unknown, row: ContentEntryResponseDto) => (
                <Tag color="blue">{row.locale}</Tag>
            ),
        },
        {
            title: 'Updated',
            key: 'updatedAt',
            width: 110,
            render: (_: unknown, row: ContentEntryResponseDto) =>
                new Date(row.updatedAt).toLocaleDateString(),
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_: unknown, row: ContentEntryResponseDto) => (
                <Space size={4}>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() =>
                                navigate({
                                    to: '/websites/$websiteId/schemas/$schemaId/entries/$entryId',
                                    params: { websiteId, schemaId, entryId: row.id },
                                })
                            }
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete entry?"
                        onConfirm={() => deleteMutation.mutate(row.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (!schema) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {contextHolder}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <div>
                    <Title level={2} className="!mb-0 !font-bold">
                        {schema.name}
                    </Title>
                    <Text className="!text-muted">
                        {pagedResult?.total ?? 0} entries · <Tag color="blue">{schema.slug}</Tag>
                    </Text>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={locale}
                        onChange={(v) => { setLocale(v); setPage(1); }}
                        options={localeOptions}
                        size="middle"
                        style={{ width: 160 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() =>
                            navigate({
                                to: '/websites/$websiteId/schemas/$schemaId/entries/new',
                                params: { websiteId, schemaId },
                            })
                        }
                    >
                        New Entry
                    </Button>
                </div>
            </div>

            <Card className="rounded-xl border border-surface-border shadow-sm">
                <Table
                    dataSource={pagedResult?.data}
                    columns={columns}
                    rowKey="id"
                    loading={isPending}
                    locale={{
                        emptyText: (
                            <Empty description="No entries yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                        navigate({
                                            to: '/websites/$websiteId/schemas/$schemaId/entries/new',
                                            params: { websiteId, schemaId },
                                        })
                                    }
                                >
                                    Create first entry
                                </Button>
                            </Empty>
                        ),
                    }}
                    pagination={{
                        current: page,
                        pageSize: 20,
                        total: pagedResult?.total ?? 0,
                        onChange: setPage,
                        showSizeChanger: false,
                        showTotal: (t) => `${t} total`,
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
}
