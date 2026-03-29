// Websites gallery — list, create, edit, delete sites
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Card,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Spin,
    Empty,
    Popconfirm,
    Tag,
    Tooltip,
    message,
    Typography,
    Divider,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    GlobalOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { websitesApi } from '../lib/api';
import type { WebsiteResponseDto } from '../lib/types';
import { useLocales } from '../lib/locales';

const { Title, Text } = Typography;

export const Route = createFileRoute('/_auth/websites/')({
    component: WebsitesPage,
});

function WebsitesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [createOpen, setCreateOpen] = useState(false);
    const [editSite, setEditSite] = useState<WebsiteResponseDto | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: websites, isPending } = useQuery({
        queryKey: ['websites'],
        queryFn: websitesApi.getAll,
    });

    const { data: localeData = [] } = useLocales();
    const localeSelectOptions = localeData.map((l) => ({ value: l.code, label: l.label }));

    const createMutation = useMutation({
        mutationFn: websitesApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            setCreateOpen(false);
            form.resetFields();
            messageApi.success('Website created!');
        },
        onError: () => messageApi.error('Failed to create website.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: Parameters<typeof websitesApi.update>) =>
            websitesApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            setEditSite(null);
            messageApi.success('Website updated!');
        },
        onError: () => messageApi.error('Failed to update website.'),
    });

    const deleteMutation = useMutation({
        mutationFn: websitesApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            messageApi.success('Website deleted.');
        },
        onError: () => messageApi.error('Failed to delete website.'),
    });

    const regenMutation = useMutation({
        mutationFn: websitesApi.regenerateKey,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            messageApi.success('API key regenerated.');
        },
        onError: () => messageApi.error('Failed to regenerate key.'),
    });

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {contextHolder}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Title level={3} className="!mb-0">
                        <GlobalOutlined className="mr-2 text-[#213E9A]" />
                        Websites
                    </Title>
                    <Text type="secondary">Manage your sites and their API keys</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setCreateOpen(true)}
                >
                    New Website
                </Button>
            </div>

            {websites?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Empty description="No websites yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    <Button type="primary" icon={<PlusOutlined />} className="mt-4" onClick={() => setCreateOpen(true)}>
                        Create your first website
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {websites?.map((site) => (
                        <Card
                            key={site.id}
                            hoverable
                            className="rounded-2xl shadow-sm border border-gray-100 cursor-pointer group"
                            onClick={() => navigate({ to: '/websites/$websiteId', params: { websiteId: site.id } })}
                            actions={[
                                <Tooltip title="Manage Schemas" key="schemas">
                                    <Button
                                        type="text"
                                        icon={<AppstoreOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate({ to: '/websites/$websiteId', params: { websiteId: site.id } });
                                        }}
                                    >
                                        Schemas
                                    </Button>
                                </Tooltip>,
                                <Tooltip title="Edit" key="edit">
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditSite(site);
                                            editForm.setFieldsValue({
                                                name: site.name,
                                                slug: site.slug,
                                                defaultLocale: site.defaultLocale,
                                                supportedLocales: site.supportedLocales,
                                            });
                                        }}
                                    />
                                </Tooltip>,
                                <Popconfirm
                                    key="delete"
                                    title="Delete this website?"
                                    description="All schemas and content will be deleted."
                                    onConfirm={(e) => {
                                        e?.stopPropagation();
                                        deleteMutation.mutate(site.id);
                                    }}
                                    onCancel={(e) => e?.stopPropagation()}
                                    okText="Delete"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Popconfirm>,
                            ]}
                        >
                            <div className="mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                                    <GlobalOutlined className="text-[#213E9A] text-lg" />
                                </div>
                                <Title level={5} className="!mb-1">
                                    {site.name}
                                </Title>
                                <Tag color="blue">{site.slug}</Tag>
                            </div>

                            <Divider className="!my-3" />

                            <div>
                                <Text type="secondary" className="text-xs block mb-1">
                                    API Key
                                </Text>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-gray-100 rounded px-2 py-1 flex-1 truncate text-gray-600">
                                        {site.apiKey}
                                    </code>
                                    <Tooltip title="Regenerate key">
                                        <Button
                                            size="small"
                                            icon={<KeyOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                regenMutation.mutate(site.id);
                                            }}
                                            loading={regenMutation.isPending}
                                        />
                                    </Tooltip>
                                </div>
                            </div>

                            <Text type="secondary" className="text-xs mt-2 block">
                                Created {new Date(site.createdAt).toLocaleDateString()}
                            </Text>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                title="Create Website"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); form.resetFields(); }}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(v) => createMutation.mutate(v)}
                    className="mt-4"
                >
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="My Awesome Site" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            { required: true },
                            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase, numbers, hyphens only' },
                        ]}
                    >
                        <Input placeholder="my-awesome-site" />
                    </Form.Item>
                    <Form.Item
                        name="supportedLocales"
                        label="Supported Locales"
                        initialValue={['en']}
                        rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one locale' }]}
                    >
                        <Select mode="multiple" options={localeSelectOptions} placeholder="Select locales…" />
                    </Form.Item>
                    <Form.Item name="defaultLocale" label="Default Locale" initialValue="en">
                        <Select options={localeSelectOptions} />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setCreateOpen(false); form.resetFields(); }}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Website"
                open={!!editSite}
                onCancel={() => setEditSite(null)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(v) => {
                        if (!editSite) return;
                        updateMutation.mutate({ id: editSite.id, dto: v });
                    }}
                    className="mt-4"
                >
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            { required: true },
                            { pattern: /^[a-z0-9-]+$/, message: 'Lowercase, numbers, hyphens only' },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="supportedLocales"
                        label="Supported Locales"
                        rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one locale' }]}
                    >
                        <Select mode="multiple" options={localeSelectOptions} placeholder="Select locales…" />
                    </Form.Item>
                    <Form.Item name="defaultLocale" label="Default Locale">
                        <Select options={localeSelectOptions} />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setEditSite(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
