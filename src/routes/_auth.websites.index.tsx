// Websites gallery — list, create, edit, delete sites
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Button,
    Form,
    Input,
    Select,
    Tag,
    Tooltip,
    Empty,
} from 'antd';
import { PageHeader } from '../shared/components/PageHeader';
import { ActionModal } from '../shared/components/ActionModal';
import { LoadingScreen } from '../shared/components/LoadingScreen';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    GlobalOutlined,
    AppstoreOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { websitesApi } from '../features/websites/api';
import type { WebsiteResponseDto } from '../features/websites/types';
import { useLocales } from '../core/locales';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';


export const Route = createFileRoute('/_auth/websites/')({
    component: WebsitesPage,
});

function WebsitesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

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
            toast.success('Your new website has been created successfully.');
        },
        onError: () => toast.error('Something went wrong while creating the website. Please try again.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof websitesApi.update>[1] }) =>
            websitesApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            setEditSite(null);
            toast.success('Website details have been updated successfully.');
        },
        onError: () => toast.error('Something went wrong while updating the website. Please try again.'),
    });

    const deleteMutation = useMutation({
        mutationFn: websitesApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            toast.success('The website has been permanently deleted.');
        },
        onError: () => toast.error('Something went wrong while deleting the website. Please try again.'),
    });

    const regenMutation = useMutation({
        mutationFn: websitesApi.regenerateKey,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['websites'] });
            toast.success('A new API key has been generated for this website.');
        },
        onError: () => toast.error('Something went wrong while regenerating the API key. Please try again.'),
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">

            <PageHeader
                title="Websites"
                subtitle="Manage your sites and their API keys"
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => setCreateOpen(true)}
                    >
                        New Website
                    </Button>
                }
            />

            {/* ── Content ───────────────────────────────────────────── */}
            {isPending ? (
                <LoadingScreen />
            ) : !websites?.length ? (
                <div className="bg-white rounded-xl border border-surface-border shadow-sm p-16">
                    <Empty
                        description={
                            <span className="text-muted">
                                No websites yet. Create your first one to get started.
                            </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateOpen(true)}
                        >
                            Create Website
                        </Button>
                    </Empty>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {websites.map((site) => (
                        <SiteCard
                            key={site.id}
                            site={site}
                            onOpen={() =>
                                navigate({
                                    to: '/websites/$websiteId',
                                    params: { websiteId: site.id },
                                })
                            }
                            onEdit={() => {
                                setEditSite(site);
                                editForm.setFieldsValue({
                                    name: site.name,
                                    slug: site.slug,
                                    defaultLocale: site.defaultLocale,
                                    supportedLocales: site.supportedLocales,
                                });
                            }}
                            onDelete={() =>
                                deleteConfirm({
                                    title: 'Delete this website?',
                                    description: 'All schemas and content will be permanently deleted.',
                                    onConfirm: () => deleteMutation.mutateAsync(site.id)
                                })
                            }
                            onRegen={() => regenMutation.mutate(site.id)}
                            regenLoading={regenMutation.isPending && regenMutation.variables === site.id}
                            onCopyKey={() => {
                                navigator.clipboard.writeText(site.apiKey);
                                toast.success('The API key has been copied to your clipboard.');
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── Create Modal ──────────────────────────────────────── */}
            <ActionModal
                title="Create New Website"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                okText="Create Website"
                confirmLoading={createMutation.isPending}
                width={520}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(v) => createMutation.mutate(v)}
                >
                    <Form.Item
                        name="name"
                        label="Site Name"
                        rules={[{ required: true, message: 'Enter a site name' }]}
                    >
                        <Input placeholder="My Awesome Site" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            { required: true },
                            {
                                pattern: /^[a-z0-9-]+$/,
                                message: 'Lowercase letters, numbers, and hyphens only',
                            },
                        ]}
                        extra="Used in API URLs — cannot be changed later"
                    >
                        <Input placeholder="my-awesome-site" />
                    </Form.Item>
                    <Form.Item
                        name="supportedLocales"
                        label="Supported Locales"
                        initialValue={['en']}
                        rules={[
                            { required: true, type: 'array', min: 1, message: 'Select at least one locale' },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            options={localeSelectOptions}
                            placeholder="Select locales…"
                        />
                    </Form.Item>
                    <Form.Item name="defaultLocale" label="Default Locale" initialValue="en">
                        <Select options={localeSelectOptions} />
                    </Form.Item>
                </Form>
            </ActionModal>

            {/* ── Edit Modal ────────────────────────────────────────── */}
            <ActionModal
                title="Edit Website"
                open={!!editSite}
                onCancel={() => setEditSite(null)}
                onOk={() => editForm.submit()}
                okText="Save Changes"
                confirmLoading={updateMutation.isPending}
                width={520}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(v) => {
                        if (!editSite) return;
                        updateMutation.mutate({ id: editSite.id, dto: v });
                    }}
                >
                    <Form.Item name="name" label="Site Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[
                            { required: true },
                            {
                                pattern: /^[a-z0-9-]+$/,
                                message: 'Lowercase letters, numbers, and hyphens only',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="supportedLocales"
                        label="Supported Locales"
                        rules={[{ required: true, type: 'array', min: 1 }]}
                    >
                        <Select
                            mode="multiple"
                            options={localeSelectOptions}
                            placeholder="Select locales…"
                        />
                    </Form.Item>
                    <Form.Item name="defaultLocale" label="Default Locale">
                        <Select options={localeSelectOptions} />
                    </Form.Item>
                </Form>
            </ActionModal>
        </div>
    );
}

// ── Site card ──────────────────────────────────────────────────────────────────
function SiteCard({
    site,
    onOpen,
    onEdit,
    onDelete,
    onRegen,
    regenLoading,
    onCopyKey,
}: {
    site: WebsiteResponseDto;
    onOpen: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onRegen: () => void;
    regenLoading: boolean;
    onCopyKey: () => void;
}) {
    return (
        <div
            className="bg-white rounded-xl border border-surface-border shadow-sm p-5 cursor-pointer group transition-all duration-150 hover:shadow-md hover:border-primary/25"
            onClick={onOpen}
        >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                    <GlobalOutlined className="text-[#213E9A] text-lg" />
                </div>
                <div
                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip title="Open">
                        <Button type="text" size="small" icon={<AppstoreOutlined />} onClick={onOpen} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onDelete}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Name + slug */}
            <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug">
                {site.name}
            </h3>
            <Tag color="blue" className="mb-3! text-xs">
                {site.slug}
            </Tag>

            {/* API key section */}
            <div
                className="border-t border-surface-border pt-3"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[11px] text-muted font-medium mb-1.5">API Key</p>
                <div className="flex items-center gap-1.5">
                    <code className="text-[11px] bg-app-bg rounded-md px-2 py-1 flex-1 truncate text-muted font-mono">
                        {site.apiKey}
                    </code>
                    <Tooltip title="Copy key">
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={onCopyKey}
                            className="shrink-0"
                        />
                    </Tooltip>
                    <Tooltip title="Regenerate key">
                        <Button
                            size="small"
                            icon={<KeyOutlined />}
                            onClick={onRegen}
                            loading={regenLoading}
                            className="shrink-0"
                        />
                    </Tooltip>
                </div>
            </div>

            <p className="text-[11px] text-muted mt-3">
                Created {new Date(site.createdAt).toLocaleDateString()}
            </p>
        </div>
    );
}
