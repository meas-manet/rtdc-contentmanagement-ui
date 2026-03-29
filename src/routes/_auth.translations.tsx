import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Space,
    Popconfirm,
    Typography,
    message,
    Tag,
    Tooltip,
    Tabs,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TranslationOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { translationsApi, localesApi } from '../lib/api';
import type {
    TranslationResponseDto,
    LocaleResponseDto,
    UpdateTranslationDto,
    UpdateLocaleDto,
} from '../lib/types';

const { Title, Text } = Typography;
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
        <div className="min-h-screen bg-app-bg">
            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="bg-surface border-b border-surface-border px-8 py-6">
                <div className="flex justify-between items-center max-w-6xl mx-auto">
                    <div>
                        <Title level={3} className="mb-1! font-bold!">
                            Translations
                        </Title>
                        <Text className="text-muted! text-sm">
                            Manage application languages and translation strings
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() =>
                            activeTab === 'locales'
                                ? setCreateLocaleOpen(true)
                                : setCreateTranslationOpen(true)
                        }
                    >
                        {activeTab === 'locales' ? 'Add Language' : 'Add New Translation'}
                    </Button>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-8 py-8">
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
    const [messageApi, contextHolder] = message.useMessage();

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
            messageApi.success('Language added.');
        },
        onError: (err: any) =>
            messageApi.error(err?.response?.data?.error ?? 'Failed to add language.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateLocaleDto }) =>
            localesApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['locales'] });
            setEditItem(null);
            messageApi.success('Language updated.');
        },
        onError: () => messageApi.error('Failed to update language.'),
    });

    const deleteMutation = useMutation({
        mutationFn: localesApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['locales'] });
            messageApi.success('Language removed.');
        },
        onError: () => messageApi.error('Failed to remove language.'),
    });

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 120,
            render: (code: string) => (
                <code className="text-xs bg-primary-light rounded px-2 py-1 text-primary font-mono">
                    {code}
                </code>
            ),
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
                <Space size={4}>
                    <Tooltip title="Edit label">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditItem(row);
                                editForm.setFieldsValue({ label: row.label });
                            }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Remove this language?"
                        description="Existing content with this locale code will not be deleted."
                        onConfirm={() => deleteMutation.mutate(row.id)}
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            {contextHolder}

            {/* Stats row */}
            <div className="mb-4">
                <Text className="text-muted! text-sm">
                    {locales.length} language{locales.length !== 1 ? 's' : ''} registered
                </Text>
            </div>

            {/* Table Card */}
            <div className="bg-surface rounded-xl border border-surface-border shadow-sm p-6">
                <Table
                    dataSource={locales}
                    columns={columns}
                    rowKey="id"
                    loading={isPending}
                    pagination={false}
                />
            </div>

            {/* Create Drawer */}
            <Drawer
                title="Add Language"
                placement="right"
                width={480}
                open={createOpen}
                onClose={() => { onCreateClose(); createForm.resetFields(); }}
                destroyOnClose
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
                            { pattern: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})*$/, message: 'e.g. en, th, zh-TW' },
                        ]}
                        extra="e.g. en, th, fr, zh-TW — this cannot be changed later"
                    >
                        <Input placeholder="en" maxLength={10} />
                    </Form.Item>
                    <Form.Item name="label" label="Display Name" rules={[{ required: true }]}>
                        <Input placeholder="English" maxLength={100} />
                    </Form.Item>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => { onCreateClose(); createForm.resetFields(); }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Add Language
                        </Button>
                    </div>
                </Form>
            </Drawer>

            {/* Edit Drawer */}
            <Drawer
                title={editItem ? `Edit: ${editItem.code}` : 'Edit Language'}
                placement="right"
                width={480}
                open={!!editItem}
                onClose={() => setEditItem(null)}
                destroyOnClose
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
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => setEditItem(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Drawer>
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
    const [messageApi, contextHolder] = message.useMessage();

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
            messageApi.success('Translation created.');
        },
        onError: (err: any) =>
            messageApi.error(err?.response?.data?.error ?? 'Failed to create translation.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateTranslationDto }) =>
            translationsApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['translations'] });
            setEditItem(null);
            messageApi.success('Translation updated.');
        },
        onError: () => messageApi.error('Failed to update translation.'),
    });

    const deleteMutation = useMutation({
        mutationFn: translationsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['translations'] });
            messageApi.success('Translation deleted.');
        },
        onError: () => messageApi.error('Failed to delete translation.'),
    });

    const columns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => (
                <code className="text-xs bg-primary-light rounded px-2 py-1 text-primary font-mono">
                    {key}
                </code>
            ),
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
                <Space size={4}>
                    <Tooltip title="Edit value">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditItem(row);
                                editForm.setFieldsValue({ value: row.value });
                            }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this translation?"
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

    return (
        <>
            {contextHolder}

            {/* Filters row */}
            <div className="flex items-center gap-3 mb-4">
                <Select
                    allowClear
                    placeholder="All languages"
                    style={{ width: 180 }}
                    options={localeSelectOptions}
                    value={localeFilter}
                    onChange={(v) => setLocaleFilter(v)}
                />
                <Search
                    placeholder="Search by key or value…"
                    allowClear
                    style={{ maxWidth: 320 }}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Text type="secondary" className="text-sm ml-auto">
                    {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                </Text>
            </div>

            {/* Table Card */}
            <div className="bg-surface rounded-xl border border-surface-border shadow-sm p-6">
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="id"
                    loading={isPending}
                    pagination={{ pageSize: 25, showSizeChanger: false }}
                    scroll={{ x: 'max-content' }}
                />
            </div>

            {/* Create Drawer */}
            <Drawer
                title="Add New Translation"
                placement="right"
                width={520}
                open={createOpen}
                onClose={() => { onCreateClose(); createForm.resetFields(); }}
                destroyOnClose
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
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => { onCreateClose(); createForm.resetFields(); }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Create Translation
                        </Button>
                    </div>
                </Form>
            </Drawer>

            {/* Edit Drawer */}
            <Drawer
                title={editItem ? `Edit: ${editItem.key} (${editItem.locale})` : 'Edit Translation'}
                placement="right"
                width={520}
                open={!!editItem}
                onClose={() => setEditItem(null)}
                destroyOnClose
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
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => setEditItem(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Drawer>
        </>
    );
}

