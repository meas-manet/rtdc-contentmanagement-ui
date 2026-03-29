import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Popconfirm,
    Typography,
    message,
    Tag,
    Tooltip,
    Card,
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
import type { TranslationResponseDto, LocaleResponseDto } from '../lib/types';

const { Title, Text } = Typography;
const { Search } = Input;

export const Route = createFileRoute('/_auth/translations')({
    component: TranslationsPage,
});

function TranslationsPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <TranslationOutlined className="text-2xl text-[#213E9A]" />
                <div>
                    <Title level={3} className="!mb-0">Manage Locales</Title>
                    <Text type="secondary">Configure languages and manage translation strings</Text>
                </div>
            </div>

            <Tabs
                defaultActiveKey="locales"
                items={[
                    {
                        key: 'locales',
                        label: (
                            <span>
                                <GlobalOutlined className="mr-1" />
                                Languages
                            </span>
                        ),
                        children: <LocalesTab />,
                    },
                    {
                        key: 'translations',
                        label: (
                            <span>
                                <TranslationOutlined className="mr-1" />
                                Translation Keys
                            </span>
                        ),
                        children: <TranslationsTab />,
                    },
                ]}
            />
        </div>
    );
}

// ── Locales Tab ────────────────────────────────────────────────────────────────
function LocalesTab() {
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [createOpen, setCreateOpen] = useState(false);
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
            setCreateOpen(false);
            createForm.resetFields();
            messageApi.success('Language added.');
        },
        onError: (err: any) =>
            messageApi.error(err?.response?.data?.error ?? 'Failed to add language.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: Parameters<typeof localesApi.update>) =>
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
            width: 100,
            render: (code: string) => (
                <code className="text-xs bg-gray-100 rounded px-2 py-1 text-[#213E9A] font-mono">
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
            width: 130,
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
            <div className="flex items-center justify-between mb-4">
                <Text type="secondary">
                    {locales.length} language{locales.length !== 1 ? 's' : ''} registered
                </Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    Add Language
                </Button>
            </div>

            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                <Table
                    dataSource={locales}
                    columns={columns}
                    rowKey="id"
                    loading={isPending}
                    pagination={false}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="Add Language"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    className="mt-4"
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
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Add
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={editItem ? `Edit: ${editItem.code}` : 'Edit Language'}
                open={!!editItem}
                onCancel={() => setEditItem(null)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    className="mt-4"
                    onFinish={(v) => {
                        if (!editItem) return;
                        updateMutation.mutate({ id: editItem.id, dto: v });
                    }}
                >
                    <Form.Item name="label" label="Display Name" rules={[{ required: true }]}>
                        <Input maxLength={100} />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setEditItem(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}

// ── Translations Tab ───────────────────────────────────────────────────────────
function TranslationsTab() {
    const qc = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const [createOpen, setCreateOpen] = useState(false);
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
            setCreateOpen(false);
            createForm.resetFields();
            messageApi.success('Translation created.');
        },
        onError: (err: any) =>
            messageApi.error(err?.response?.data?.error ?? 'Failed to create translation.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: Parameters<typeof translationsApi.update>) =>
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
                <code className="text-xs bg-gray-100 rounded px-2 py-1 text-[#213E9A] font-mono">
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
                    {filtered.length} entries
                </Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                    New Translation
                </Button>
            </div>

            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                <Table
                    dataSource={filtered}
                    columns={columns}
                    rowKey="id"
                    loading={isPending}
                    pagination={{ pageSize: 25, showSizeChanger: false }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="New Translation"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    className="mt-4"
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
                    >
                        <Input placeholder="nav.home" />
                    </Form.Item>
                    <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="Home" />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setCreateOpen(false); createForm.resetFields(); }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={editItem ? `Edit: ${editItem.key} (${editItem.locale})` : 'Edit Translation'}
                open={!!editItem}
                onCancel={() => setEditItem(null)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    className="mt-4"
                    onFinish={(v) => {
                        if (!editItem) return;
                        updateMutation.mutate({ id: editItem.id, dto: v });
                    }}
                >
                    <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setEditItem(null)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}

