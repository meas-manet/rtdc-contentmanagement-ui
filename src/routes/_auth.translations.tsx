import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Form,
    Input,
    Select,
    Typography,
    Tag,
    Tabs,
} from 'antd';
import { PageHeader } from '../shared/components/PageHeader';
import { TableCard } from '../shared/components/TableCard';
import { RowActions } from '../shared/components/RowActions';
import { ActionModal } from '../shared/components/ActionModal';
import { CodeBadge } from '../shared/components/CodeBadge';
import {
    PlusOutlined,
    TranslationOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { translationsApi } from '../features/translations/api';
import { localesApi } from '../features/locales/api';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';
import type {
    TranslationResponseDto,
    UpdateTranslationDto,
} from '../features/translations/types';
import type {
    LocaleResponseDto,
    UpdateLocaleDto,
} from '../features/locales/types';

const { Text } = Typography;
const { Search } = Input;

export const Route = createFileRoute('/_auth/translations')({
    component: TranslationsPage,
});

// ── Page Shell ─────────────────────────────────────────────────────────────────

function TranslationsPage() {
    const [activeTab, setActiveTab] = useState<'translations' | 'locales'>('translations');
    const [createTranslationOpen, setCreateTranslationOpen] = useState(false);
    const [createLocaleOpen, setCreateLocaleOpen] = useState(false);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <PageHeader
                title="Translations"
                subtitle="Manage application languages and translation strings"
                actions={
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() =>
                            activeTab === 'locales'
                                ? setCreateLocaleOpen(true)
                                : setCreateTranslationOpen(true)
                        }
                    >
                        {activeTab === 'locales' ? 'Add Language' : 'Add Translation'}
                    </Button>
                }
            />

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as typeof activeTab)}
                items={[
                    {
                        key: 'translations',
                        label: (
                            <span className="flex items-center gap-1.5">
                                <TranslationOutlined />
                                Translation Keys
                            </span>
                        ),
                        children: (
                            <TranslationsTab
                                createOpen={createTranslationOpen}
                                onCreateClose={() => setCreateTranslationOpen(false)}
                            />
                        ),
                    },
                    {
                        key: 'locales',
                        label: (
                            <span className="flex items-center gap-1.5">
                                <GlobalOutlined />
                                Languages
                            </span>
                        ),
                        children: (
                            <LocalesTab
                                createOpen={createLocaleOpen}
                                onCreateClose={() => setCreateLocaleOpen(false)}
                            />
                        ),
                    },
                ]}
            />
        </div>
    );
}

// ── Locales Tab ────────────────────────────────────────────────────────────────

interface LocalesTabProps {
    createOpen: boolean;
    onCreateClose: () => void;
}

function LocalesTab({ createOpen, onCreateClose }: LocalesTabProps) {
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    const [editItem, setEditItem] = useState<LocaleResponseDto | null>(null);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: locales = [], isPending } = useQuery({
        queryKey: ['locales'],
        queryFn: localesApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: localesApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['locales'] });
            onCreateClose();
            createForm.resetFields();
            toast.success('The language has been added successfully.');
        },
        onError: (err: any) =>
            toast.error(err?.response?.data?.error ?? 'Failed to add language.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateLocaleDto }) =>
            localesApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['locales'] });
            setEditItem(null);
            toast.success('The language settings have been updated successfully.');
        },
        onError: () => toast.error('Something went wrong while updating the language. Please try again.'),
    });

    const deleteMutation = useMutation({
        mutationFn: localesApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['locales'] });
            toast.success('The language has been removed successfully.');
        },
        onError: () => toast.error('Something went wrong while removing the language. Please try again.'),
    });

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 120,
            render: (code: string) => <CodeBadge>{code}</CodeBadge>,
        },
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'Added',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (v: string) => new Date(v).toLocaleDateString(),
        },
        {
            title: '',
            key: 'actions',
            width: 90,
            render: (_: unknown, row: LocaleResponseDto) => (
                <RowActions
                    onEdit={() => {
                        setEditItem(row);
                        editForm.setFieldsValue({ label: row.label });
                    }}
                    onDelete={() =>
                        deleteConfirm({
                            title: 'Remove this language?',
                            description: 'Existing content with this locale code will not be deleted.',
                            onConfirm: () => deleteMutation.mutateAsync(row.id),
                        })
                    }
                    editTooltip="Edit label"
                    deleteLoading={deleteMutation.isPending && deleteMutation.variables === row.id}
                />
            ),
        },
    ];

    return (
        <>
            <div className="mb-4">
                <Text className="text-muted! text-sm">
                    {locales.length} language{locales.length !== 1 ? 's' : ''} registered
                </Text>
            </div>

            {/* Table */}
            <TableCard
                dataSource={locales}
                columns={columns}
                rowKey="id"
                loading={isPending}
                pagination={false}
            />

            {/* Create Modal */}
            <ActionModal
                title="Add Language"
                open={createOpen}
                onCancel={() => { onCreateClose(); createForm.resetFields(); }}
                onOk={() => createForm.submit()}
                okText="Add Language"
                confirmLoading={createMutation.isPending}
                width={480}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={(v) => createMutation.mutate(v)}
                >
                    <Form.Item
                        name="code"
                        label="BCP-47 Code"
                        rules={[
                            { required: true },
                            {
                                pattern: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})*$/,
                                message: 'e.g. en, th, zh-TW',
                            },
                        ]}
                        extra="e.g. en, th, fr, zh-TW — this cannot be changed later"
                    >
                        <Input placeholder="en" maxLength={10} />
                    </Form.Item>
                    <Form.Item name="label" label="Display Name" rules={[{ required: true }]}>
                        <Input placeholder="English" maxLength={100} />
                    </Form.Item>
                </Form>
            </ActionModal>

            {/* Edit Modal */}
            <ActionModal
                title={editItem ? `Edit: ${editItem.code}` : 'Edit Language'}
                open={!!editItem}
                onCancel={() => setEditItem(null)}
                onOk={() => editForm.submit()}
                okText="Save Changes"
                confirmLoading={updateMutation.isPending}
                width={480}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(v) => {
                        if (!editItem) return;
                        updateMutation.mutate({ id: editItem.id, dto: v });
                    }}
                >
                    <Form.Item name="label" label="Display Name" rules={[{ required: true }]}>
                        <Input maxLength={100} />
                    </Form.Item>
                </Form>
            </ActionModal>
        </>
    );
}

// ── Translations Tab ───────────────────────────────────────────────────────────

interface TranslationsTabProps {
    createOpen: boolean;
    onCreateClose: () => void;
}

function TranslationsTab({ createOpen, onCreateClose }: TranslationsTabProps) {
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    const [editItem, setEditItem] = useState<TranslationResponseDto | null>(null);
    const [localeFilter, setLocaleFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const { data: locales = [] } = useQuery({
        queryKey: ['locales'],
        queryFn: localesApi.getAll,
    });

    const localeSelectOptions = locales.map((l) => ({ value: l.code, label: l.label }));

    const { data: translations = [], isPending } = useQuery({
        queryKey: ['translations', localeFilter],
        queryFn: () => translationsApi.getAll(localeFilter),
    });

    const filtered = search
        ? translations.filter(
            (t) =>
                t.key.toLowerCase().includes(search.toLowerCase()) ||
                t.value.toLowerCase().includes(search.toLowerCase()),
        )
        : translations;

    const createMutation = useMutation({
        mutationFn: translationsApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['translations'] });
            onCreateClose();
            createForm.resetFields();
            toast.success('The translation has been created successfully.');
        },
        onError: (err: any) =>
            toast.error(err?.response?.data?.error ?? 'Failed to create translation.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateTranslationDto }) =>
            translationsApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['translations'] });
            setEditItem(null);
            toast.success('The translation has been updated successfully.');
        },
        onError: () => toast.error('Something went wrong while updating the translation. Please try again.'),
    });

    const deleteMutation = useMutation({
        mutationFn: translationsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['translations'] });
            toast.success('The translation has been permanently deleted.');
        },
        onError: () => toast.error('Something went wrong while deleting the translation. Please try again.'),
    });

    const columns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => <CodeBadge>{key}</CodeBadge>,
        },
        {
            title: 'Locale',
            dataIndex: 'locale',
            key: 'locale',
            width: 120,
            render: (locale: string) => <Tag color="blue">{locale}</Tag>,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            ellipsis: true,
        },
        {
            title: 'Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 130,
            render: (v: string) => new Date(v).toLocaleDateString(),
        },
        {
            title: '',
            key: 'actions',
            width: 90,
            render: (_: unknown, row: TranslationResponseDto) => (
                <RowActions
                    onEdit={() => {
                        setEditItem(row);
                        editForm.setFieldsValue({ value: row.value });
                    }}
                    onDelete={() =>
                        deleteConfirm({
                            title: 'Delete this translation?',
                            onConfirm: () => deleteMutation.mutateAsync(row.id),
                        })
                    }
                    editTooltip="Edit value"
                    deleteLoading={deleteMutation.isPending && deleteMutation.variables === row.id}
                />
            ),
        },
    ];

    return (
        <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
                <Select
                    allowClear
                    placeholder="All languages"
                    className="w-[180px]"
                    options={localeSelectOptions}
                    value={localeFilter}
                    onChange={(v) => setLocaleFilter(v)}
                />
                <Search
                    placeholder="Search by key or value…"
                    allowClear
                    className="max-w-[320px]"
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Text type="secondary" className="text-sm ml-auto">
                    {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                </Text>
            </div>

            {/* Table */}
            <TableCard
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                loading={isPending}
                pagination={{ pageSize: 25, showSizeChanger: false }}
                scroll={{ x: 'max-content' }}
            />

            {/* Create Modal */}
            <ActionModal
                title="Add New Translation"
                open={createOpen}
                onCancel={() => { onCreateClose(); createForm.resetFields(); }}
                onOk={() => createForm.submit()}
                okText="Create Translation"
                confirmLoading={createMutation.isPending}
                width={520}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={(v) => createMutation.mutate(v)}
                >
                    <Form.Item name="locale" label="Language" rules={[{ required: true }]}>
                        <Select options={localeSelectOptions} placeholder="Select language" />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label="Key"
                        rules={[
                            { required: true },
                            {
                                pattern: /^[a-zA-Z0-9_.]+$/,
                                message: 'Use dot-separated identifiers, e.g. nav.home',
                            },
                        ]}
                        extra="Use dot-separated identifiers, e.g. nav.home"
                    >
                        <Input placeholder="nav.home" />
                    </Form.Item>
                    <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} placeholder="Home" />
                    </Form.Item>
                </Form>
            </ActionModal>

            {/* Edit Modal */}
            <ActionModal
                title={editItem ? `Edit: ${editItem.key} (${editItem.locale})` : 'Edit Translation'}
                open={!!editItem}
                onCancel={() => setEditItem(null)}
                onOk={() => editForm.submit()}
                okText="Save Changes"
                confirmLoading={updateMutation.isPending}
                width={520}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(v) => {
                        if (!editItem) return;
                        updateMutation.mutate({ id: editItem.id, dto: v });
                    }}
                >
                    <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </ActionModal>
        </>
    );
}

