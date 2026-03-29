// Schemas management page — list + create + edit with field builder
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Space,
    Tag,
    Popconfirm,
    message,
    Typography,
    Tooltip,
    Empty,
    Card,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    AppstoreOutlined,
    MinusCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { schemasApi } from '../lib/api';
import type { SchemaResponseDto, SchemaFieldDto, FieldType } from '../lib/types';

const { Title, Text } = Typography;

const FIELD_TYPES: { label: string; value: FieldType }[] = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Rich Text', value: 'richtext' },
    { label: 'Date', value: 'date' },
    { label: 'Array', value: 'array' },
    { label: 'Object', value: 'object' },
];

export const Route = createFileRoute('/_auth/websites/$websiteId/schemas/')({
    component: SchemasPage,
});

function SchemasPage() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId/schemas/' });
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [createOpen, setCreateOpen] = useState(false);
    const [editSchema, setEditSchema] = useState<SchemaResponseDto | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: schemas, isPending } = useQuery({
        queryKey: ['schemas', websiteId],
        queryFn: () => schemasApi.getAll(websiteId),
    });

    const createMutation = useMutation({
        mutationFn: (dto: Parameters<typeof schemasApi.create>[1]) =>
            schemasApi.create(websiteId, dto),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['schemas', websiteId] });
            setCreateOpen(false);
            form.resetFields();
            messageApi.success('Schema created!');
            navigate({
                to: '/websites/$websiteId/schemas/$schemaId',
                params: { websiteId, schemaId: created.id },
            });
        },
        onError: () => messageApi.error('Failed to create schema.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof schemasApi.update>[2] }) =>
            schemasApi.update(websiteId, id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schemas', websiteId] });
            setEditSchema(null);
            messageApi.success('Schema updated!');
        },
        onError: () => messageApi.error('Failed to update schema.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => schemasApi.delete(websiteId, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schemas', websiteId] });
            messageApi.success('Schema deleted.');
        },
        onError: () => messageApi.error('Failed to delete schema.'),
    });

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, row: SchemaResponseDto) => (
                <button
                    className="font-medium text-[#213E9A] hover:underline bg-transparent border-0 p-0 cursor-pointer"
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
                    {def.map((f) => (
                        <Tag key={f.name} color="geekblue">
                            {f.name}:{f.type}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => new Date(v).toLocaleDateString(),
        },
        {
            title: '',
            key: 'actions',
            render: (_: unknown, row: SchemaResponseDto) => (
                <Space>
                    <Tooltip title="Edit schema">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => {
                                setEditSchema(row);
                                editForm.setFieldsValue({ name: row.name, definition: row.definition });
                            }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete schema?"
                        description="All content entries for this schema will be deleted."
                        onConfirm={() => deleteMutation.mutate(row.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {contextHolder}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Title level={3} className="!mb-0">
                        <AppstoreOutlined className="mr-2 text-[#213E9A]" />
                        Content Types
                    </Title>
                    <Text type="secondary">Define the structure for your content</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    New Schema
                </Button>
            </div>

            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                <Table
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
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                                    Create your first schema
                                </Button>
                            </Empty>
                        ),
                    }}
                    pagination={false}
                />
            </Card>

            {/* Create Modal */}
            <SchemaFormModal
                title="Create Schema"
                open={createOpen}
                onClose={() => { setCreateOpen(false); form.resetFields(); }}
                form={form}
                showSlug
                onFinish={(v) => createMutation.mutate(v)}
                loading={createMutation.isPending}
            />

            {/* Edit Modal */}
            <SchemaFormModal
                title="Edit Schema"
                open={!!editSchema}
                onClose={() => setEditSchema(null)}
                form={editForm}
                showSlug={false}
                onFinish={(v) => {
                    if (!editSchema) return;
                    updateMutation.mutate({ id: editSchema.id, dto: v });
                }}
                loading={updateMutation.isPending}
            />
        </div>
    );
}

interface SchemaFormModalProps {
    title: string;
    open: boolean;
    onClose: () => void;
    form: ReturnType<typeof Form.useForm>[0];
    showSlug: boolean;
    onFinish: (values: { name: string; slug?: string; definition: SchemaFieldDto[] }) => void;
    loading: boolean;
}

function SchemaFormModal({
    title,
    open,
    onClose,
    form,
    showSlug,
    onFinish,
    loading,
}: SchemaFormModalProps) {
    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            footer={null}
            width={640}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ definition: [{ name: '', type: 'string', required: false }] }}
                className="mt-4"
            >
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input placeholder="Blog Posts" />
                </Form.Item>
                {showSlug && (
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            { required: true },
                            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase, numbers, hyphens only' },
                        ]}
                    >
                        <Input placeholder="blog-posts" />
                    </Form.Item>
                )}

                <Form.Item label="Fields">
                    <Form.List name="definition">
                        {(fields, { add, remove }) => (
                            <div className="space-y-2">
                                {fields.map(({ key, name, ...restField }) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'name']}
                                            rules={[{ required: true, message: 'Field name required' }]}
                                            className="mb-0 flex-1"
                                        >
                                            <Input placeholder="field_name" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'type']}
                                            className="mb-0 w-32"
                                        >
                                            <Select options={FIELD_TYPES} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'required']}
                                            valuePropName="checked"
                                            className="mb-0"
                                        >
                                            <Switch size="small" checkedChildren="Req" unCheckedChildren="Opt" />
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => remove(name)}
                                            className="mt-1"
                                        />
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add({ name: '', type: 'string', required: false })}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    Add Field
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </Form.Item>

                <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
