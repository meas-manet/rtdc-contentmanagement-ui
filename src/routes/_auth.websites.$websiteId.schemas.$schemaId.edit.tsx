// Edit Schema — full-page editor matching the Entry editor layout
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Form,
    Input,
    Select,
    Switch,
    Button,
    Spin,
    Typography,
    Tag,
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    PlusOutlined,
    MinusCircleOutlined,
    CodeOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import { schemasApi } from '../features/schemas/api';
import { useAppToast } from '../shared/hooks/useAppToast';
import type { FieldType, SchemaFieldDto } from '../features/schemas/types';

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

export const Route = createFileRoute('/_auth/websites/$websiteId/schemas/$schemaId/edit')({
    component: EditSchemaPage,
});

interface SchemaFormValues {
    name: string;
    definition: SchemaFieldDto[];
}

function EditSchemaPage() {
    const { websiteId, schemaId } = useParams({
        from: '/_auth/websites/$websiteId/schemas/$schemaId/edit',
    });
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const [form] = Form.useForm<SchemaFormValues>();

    const { data: schema, isPending: schemaLoading } = useQuery({
        queryKey: ['schemas', websiteId, schemaId],
        queryFn: () => schemasApi.getById(websiteId, schemaId),
    });

    // Pre-populate form when schema loads
    useEffect(() => {
        if (schema) {
            form.setFieldsValue({
                name: schema.name,
                definition: schema.definition,
            });
        }
    }, [schema, form]);

    const updateMutation = useMutation({
        mutationFn: (values: SchemaFormValues) =>
            schemasApi.update(websiteId, schemaId, {
                name: values.name,
                definition: values.definition ?? [],
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schemas', websiteId] });
            qc.invalidateQueries({ queryKey: ['schemas', websiteId, schemaId] });
            toast.success('Schema settings have been updated successfully.');
            navigate({
                to: '/websites/$websiteId/schemas',
                params: { websiteId },
            });
        },
        onError: () => toast.error('Something went wrong while updating the schema. Please try again.'),
    });

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            updateMutation.mutate(values);
        } catch {
            // validation errors shown inline
        }
    };

    if (schemaLoading || !schema) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg pb-12">

            {/* ── Sticky Header ───────────────────────────────────── */}
            <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-surface-border shadow-sm px-8 py-4 mb-8 flex items-center justify-between transition-all duration-300">
                <div>
                    <button
                        onClick={() =>
                            navigate({
                                to: '/websites/$websiteId/schemas',
                                params: { websiteId },
                            })
                        }
                        className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors mb-2 bg-transparent border-0 cursor-pointer px-0 font-medium text-sm group"
                    >
                        <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Content Types</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <Title level={2} className="mb-0! font-bold! text-gray-900! tracking-tight">
                            Edit: {schema.name}
                        </Title>
                        <Tag color="blue" className="m-0 rounded-full px-3 py-0.5 border-transparent shadow-sm font-semibold">
                            {schema.slug}
                        </Tag>
                    </div>
                </div>

                <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                    className="font-semibold"
                >
                    Save Changes
                </Button>
            </div>

            <div className="px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Main content (Form) ─────────────────────────────── */}
                <div className="lg:col-span-8 xl:col-span-9">
                    <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-8 transition-shadow hover:shadow-md duration-300">

                        {/* Identity Section */}
                        <div className="mb-6 pb-4 border-b border-surface-border">
                            <h3 className="text-lg font-semibold text-gray-800 m-0">Identity</h3>
                            <p className="text-muted text-sm mt-1 mb-0">
                                Update the display name. The API slug is immutable after creation.
                            </p>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            size="large"
                            className="space-y-2"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <Form.Item
                                    name="name"
                                    label="Display Name"
                                    rules={[{ required: true, message: 'Name is required' }]}
                                    className="mb-0"
                                >
                                    <Input placeholder="e.g. Blog Posts" />
                                </Form.Item>

                                {/* Slug — read-only */}
                                <Form.Item label="API Slug" className="mb-0">
                                    <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-surface-border rounded-lg">
                                        <CodeOutlined className="text-muted" />
                                        <Text className="font-mono text-sm text-gray-700">{schema.slug}</Text>
                                        <Tag color="gold" className="ml-auto text-xs font-medium">Immutable</Tag>
                                    </div>
                                </Form.Item>
                            </div>

                            {/* Fields Section */}
                            <div className="mb-4 pt-4 pb-4 border-t border-b border-surface-border">
                                <h3 className="text-lg font-semibold text-gray-800 m-0">Fields</h3>
                                <p className="text-muted text-sm mt-1 mb-0">
                                    Add, remove, or change field types. Existing entry data may be affected.
                                </p>
                            </div>

                            <Form.Item className="mb-0">
                                <Form.List name="definition">
                                    {(fields, { add, remove }) => (
                                        <div className="space-y-2">
                                            {/* Column Labels */}
                                            {fields.length > 0 && (
                                                <div className="grid grid-cols-[1fr_160px_80px_40px] gap-2 px-3 pb-1">
                                                    <Text className="text-xs uppercase font-bold tracking-wider text-muted">Field Name</Text>
                                                    <Text className="text-xs uppercase font-bold tracking-wider text-muted">Type</Text>
                                                    <Text className="text-xs uppercase font-bold tracking-wider text-muted text-center">Required</Text>
                                                    <span />
                                                </div>
                                            )}

                                            {fields.map(({ key, name, ...restField }) => (
                                                <div
                                                    key={key}
                                                    className="grid grid-cols-[1fr_160px_80px_40px] items-start gap-2 bg-app-bg rounded-xl p-3 border border-surface-border hover:border-primary/40 transition-colors duration-200"
                                                >
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'name']}
                                                        rules={[{ required: true, message: 'Required' }]}
                                                        className="mb-0"
                                                    >
                                                        <Input placeholder="field_name" size="middle" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'type']}
                                                        className="mb-0"
                                                    >
                                                        <Select options={FIELD_TYPES} size="middle" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'required']}
                                                        valuePropName="checked"
                                                        className="mb-0 flex justify-center"
                                                    >
                                                        <Switch
                                                            size="small"
                                                            checkedChildren="Req"
                                                            unCheckedChildren="Opt"
                                                        />
                                                    </Form.Item>
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<MinusCircleOutlined />}
                                                        onClick={() => remove(name)}
                                                        className="mt-1"
                                                        size="small"
                                                    />
                                                </div>
                                            ))}

                                            <Button
                                                type="dashed"
                                                onClick={() => add({ name: '', type: 'string', required: false })}
                                                block
                                                icon={<PlusOutlined />}
                                                size="large"
                                                className="mt-2 rounded-xl border-surface-border hover:border-primary/60 transition-colors"
                                            >
                                                Add Field
                                            </Button>
                                        </div>
                                    )}
                                </Form.List>
                            </Form.Item>
                        </Form>
                    </div>
                </div>

                {/* ── Right Sidebar ────────────────────────────────── */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-32 space-y-6">

                        {/* Schema Metadata Card */}
                        <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-surface-border">
                                Schema Info
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">
                                        API Slug
                                    </Text>
                                    <Text className="text-sm font-mono bg-gray-50 p-1.5 rounded border border-gray-100">
                                        {schema.slug}
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">
                                        Field Count
                                    </Text>
                                    <Text className="text-sm font-medium text-gray-700">
                                        {schema.definition.length} {schema.definition.length === 1 ? 'field' : 'fields'}
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">
                                        Created
                                    </Text>
                                    <Text className="text-sm font-medium text-gray-700">
                                        {new Date(schema.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">
                                        Schema ID
                                    </Text>
                                    <Text className="text-xs font-mono bg-gray-50 p-1.5 rounded border border-gray-100 break-all">
                                        {schemaId}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone Card */}
                        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-red-600 mb-3 pb-3 border-b border-red-100">
                                Danger Zone
                            </h3>
                            <p className="text-xs text-muted mb-3">
                                Removing fields from the schema will not delete existing entry data, but
                                those fields will no longer appear in the editor.
                            </p>
                            <p className="text-xs text-muted m-0">
                                To fully delete this schema and all its entries, return to the{' '}
                                <button
                                    onClick={() =>
                                        navigate({
                                            to: '/websites/$websiteId/schemas',
                                            params: { websiteId },
                                        })
                                    }
                                    className="text-primary font-medium hover:underline bg-transparent border-0 p-0 cursor-pointer"
                                >
                                    Content Types list
                                </button>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
