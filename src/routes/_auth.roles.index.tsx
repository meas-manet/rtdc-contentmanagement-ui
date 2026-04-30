// Roles management — list all roles, create custom roles, manage admin users
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
    Tabs,
    Switch,
    Badge,
    Space,
    Tooltip,
    Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    LockOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { PageHeader } from '../shared/components/PageHeader';
import { TableCard } from '../shared/components/TableCard';
import { RowActions } from '../shared/components/RowActions';
import { ActionModal } from '../shared/components/ActionModal';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';
import { rolesApi } from '../features/roles/api';
import { adminUsersApi } from '../features/admin-users/api';
import { websitesApi } from '../features/websites/api';
import type { RoleResponseDto } from '../features/roles/types';
import type { AdminUserResponseDto } from '../features/admin-users/types';
import { useAuth } from '../core/auth/AuthContext';

function parseJwtPayload(token: string): Record<string, string> {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return {}; }
}

export const Route = createFileRoute('/_auth/roles/')({
    component: RolesPage,
});

// ── Page Shell ────────────────────────────────────────────────────────────────

function RolesPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <PageHeader
                title="Roles & Access Control"
                subtitle="Define roles and manage administrator accounts"
            />
            <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k as typeof activeTab)}
                items={[
                    {
                        key: 'roles',
                        label: (
                            <span className="flex items-center gap-1.5">
                                <SafetyCertificateOutlined /> Roles
                            </span>
                        ),
                        children: <RolesTab />,
                    },
                    {
                        key: 'users',
                        label: (
                            <span className="flex items-center gap-1.5">
                                <TeamOutlined /> Admin Users
                            </span>
                        ),
                        children: <AdminUsersTab />,
                    },
                ]}
            />
        </div>
    );
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────

function RolesTab() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    const [createOpen, setCreateOpen] = useState(false);
    const [form] = Form.useForm();

    const { token } = useAuth();
    const claims = token ? parseJwtPayload(token) : {};
    const claimedWebsiteId: string | null = (claims['websiteId'] as string | undefined) ?? null;

    const { data: roles = [], isPending } = useQuery({
        queryKey: ['roles', claimedWebsiteId],
        queryFn: () => rolesApi.getAll(claimedWebsiteId),
    });

    const { data: websites = [] } = useQuery({
        queryKey: ['websites'],
        queryFn: websitesApi.getAll,
    });

    const websiteOptions = [
        { value: null, label: <span className="text-gray-400 italic">Global (all websites)</span> },
        ...websites.map((w) => ({ value: w.id, label: w.name })),
    ];

    const createMutation = useMutation({
        mutationFn: rolesApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            setCreateOpen(false);
            form.resetFields();
            toast.success('Role created successfully.');
        },
        onError: () => toast.error('Failed to create role. Please try again.'),
    });

    const deleteMutation = useMutation({
        mutationFn: rolesApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role deleted.');
        },
        onError: () =>
            toast.error('Cannot delete this role — it may be a system role or have users assigned.'),
    });

    const columns: ColumnsType<RoleResponseDto> = [
        {
            title: 'Role',
            dataIndex: 'name',
            render: (name: string, row) => (
                <Space>
                    <span className="font-medium text-gray-900">{name}</span>
                    {row.isSystem && (
                        <Tooltip title="Built-in system role — cannot be deleted">
                            <LockOutlined className="text-gray-400 text-xs" />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            render: (v: string) => <span className="text-gray-500 text-sm">{v ?? '—'}</span>,
        },
        {
            title: 'Scope',
            dataIndex: 'websiteName',
            width: 160,
            render: (_: string, row) =>
                row.websiteId ? (
                    <Tag color="blue">{row.websiteName}</Tag>
                ) : (
                    <Tooltip title="Available to all websites">
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <GlobalOutlined /> Global
                        </span>
                    </Tooltip>
                ),
        },
        {
            title: 'Users',
            dataIndex: 'userCount',
            width: 90,
            render: (n: number) => <Badge count={n} showZero color="#6366f1" />,
        },
        {
            title: 'Actions',
            width: 100,
            render: (_, row) => (
                <RowActions
                    onEdit={() => navigate({ to: '/roles/$roleId/edit', params: { roleId: row.id } })}
                    onDelete={() =>
                        deleteConfirm({
                            title: `Delete "${row.name}"?`,
                            description: 'This action cannot be undone.',
                            onConfirm: () => deleteMutation.mutateAsync(row.id),
                        })
                    }
                    deleteLoading={deleteMutation.isPending}
                    editTooltip="Edit permissions"
                    deleteTooltip={row.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                />
            ),
        },
    ];

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateOpen(true)}
                >
                    New Role
                </Button>
            </div>

            {roles.length === 0 && !isPending ? (
                <Empty description="No roles found" />
            ) : (
                <TableCard
                    rowKey="id"
                    dataSource={roles}
                    columns={columns}
                    loading={isPending}
                    pagination={false}
                />
            )}

            {/* Create role modal */}
            <ActionModal
                title="Create Role"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                okText="Create"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(vals) =>
                        createMutation.mutate({
                            name: vals.name,
                            description: vals.description,
                            websiteId: vals.websiteId ?? null,
                            permissions: {},
                        })
                    }
                >
                    <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Content Reviewer" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} placeholder="Optional description" />
                    </Form.Item>
                    {!claimedWebsiteId && (
                        <Form.Item
                            name="websiteId"
                            label="Scope"
                            help="Leave blank to make this role available globally across all websites."
                        >
                            <Select options={websiteOptions} placeholder="Global (all websites)" allowClear />
                        </Form.Item>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        You can configure granular permissions after creating the role.
                    </p>
                </Form>
            </ActionModal>
        </>
    );
}

// ── Admin Users Tab ───────────────────────────────────────────────────────────

function AdminUsersTab() {
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();

    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUserResponseDto | null>(null);
    const [filterWebsiteId, setFilterWebsiteId] = useState<string | null>(null);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const { token } = useAuth();
    const claims = token ? parseJwtPayload(token) : {};
    const claimedWebsiteId: string | null = (claims['websiteId'] as string | undefined) ?? null;
    const effectiveWebsiteFilter = claimedWebsiteId ?? filterWebsiteId;

    const { data: websites = [] } = useQuery({
        queryKey: ['websites'],
        queryFn: websitesApi.getAll,
    });

    const { data: users = [], isPending } = useQuery({
        queryKey: ['admin-users', effectiveWebsiteFilter],
        queryFn: () => adminUsersApi.getAll(effectiveWebsiteFilter),
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', claimedWebsiteId],
        queryFn: () => rolesApi.getAll(claimedWebsiteId),
    });

    const websiteOptions = websites.map((w) => ({ value: w.id, label: w.name }));
    const websiteOptionsWithNull = [
        { value: null as string | null, label: <span className="text-gray-400 italic">None (Super Admin)</span> },
        ...websiteOptions,
    ];
    const filterOptions = [
        { value: null as string | null, label: 'All websites' },
        ...websiteOptions,
    ];
    // Website Admins cannot assign Super Admin or Website Admin roles.
    const PRIVILEGED_ROLES = ['Super Admin', 'Website Admin'];
    const roleOptions = roles
        .filter((r) => !claimedWebsiteId || !PRIVILEGED_ROLES.includes(r.name))
        .map((r) => ({ value: r.id, label: r.name }));

    const createMutation = useMutation({
        mutationFn: adminUsersApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['roles'] });
            setCreateOpen(false);
            form.resetFields();
            toast.success('Admin user created successfully.');
        },
        onError: () => toast.error('Failed to create user. Username or email may already exist.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof adminUsersApi.update>[1] }) =>
            adminUsersApi.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['roles'] });
            setEditUser(null);
            toast.success('User updated successfully.');
        },
        onError: () => toast.error('Failed to update user.'),
    });

    const deleteMutation = useMutation({
        mutationFn: adminUsersApi.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('User deleted.');
        },
        onError: () => toast.error('Failed to delete user.'),
    });

    const columns: ColumnsType<AdminUserResponseDto> = [
        {
            title: 'Username',
            dataIndex: 'username',
            render: (name: string) => (
                <Space>
                    <UserOutlined className="text-gray-400" />
                    <span className="font-medium">{name}</span>
                </Space>
            ),
        },
        { title: 'Email', dataIndex: 'email' },
        {
            title: 'Role',
            dataIndex: 'roleName',
            render: (role: string) => {
                const colorMap: Record<string, string> = {
                    'Super Admin': 'red',
                    'Website Admin': 'purple',
                    Editor: 'blue',
                    Author: 'green',
                };
                return <Tag color={colorMap[role] ?? 'default'}>{role}</Tag>;
            },
        },
        {
            title: 'Website',
            dataIndex: 'websiteName',
            width: 160,
            render: (_: string, row) =>
                row.websiteId ? (
                    <Tag color="blue">{row.websiteName}</Tag>
                ) : (
                    <Tooltip title="Global access — not scoped to any single website">
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <GlobalOutlined /> Global
                        </span>
                    </Tooltip>
                ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            width: 90,
            render: (active: boolean) => (
                <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
            ),
        },
        {
            title: 'Actions',
            width: 100,
            render: (_, row) => (
                <RowActions
                    onEdit={() => {
                        setEditUser(row);
                        editForm.setFieldsValue({
                            username: row.username,
                            email: row.email,
                            roleId: row.roleId,
                            websiteId: row.websiteId,
                            isActive: row.isActive,
                        });
                    }}
                    onDelete={() =>
                        deleteConfirm({
                            title: `Delete "${row.username}"?`,
                            description: 'This will permanently remove the admin account.',
                            onConfirm: () => deleteMutation.mutateAsync(row.id),
                        })
                    }
                    deleteLoading={deleteMutation.isPending}
                />
            ),
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-4 gap-3">
                {!claimedWebsiteId && (
                    <Select
                        className="w-52"
                        value={filterWebsiteId}
                        onChange={setFilterWebsiteId}
                        options={filterOptions}
                        placeholder="Filter by website"
                    />
                )}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateOpen(true)}
                >
                    New Admin User
                </Button>
            </div>

            {users.length === 0 && !isPending ? (
                <Empty description="No admin users found" />
            ) : (
                <TableCard
                    rowKey="id"
                    dataSource={users}
                    columns={columns}
                    loading={isPending}
                    pagination={false}
                />
            )}

            {/* Create user modal */}
            <ActionModal
                title="Create Admin User"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
                okText="Create"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(vals) =>
                        createMutation.mutate({
                            username: vals.username,
                            email: vals.email,
                            password: vals.password,
                            roleId: vals.roleId,
                            websiteId: vals.websiteId ?? null,
                        })
                    }
                >
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true }, { type: 'email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true }, { min: 8, message: 'Minimum 8 characters' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
                        <Select options={roleOptions} placeholder="Select a role" />
                    </Form.Item>
                    {!claimedWebsiteId && (
                        <Form.Item
                            name="websiteId"
                            label="Website"
                            help="Assign this user to a specific website. Leave blank for Super Admins with global access."
                        >
                            <Select
                                options={websiteOptionsWithNull}
                                placeholder="None (global access)"
                                allowClear
                            />
                        </Form.Item>
                    )}
                </Form>
            </ActionModal>

            {/* Edit user modal */}
            <ActionModal
                title={`Edit "${editUser?.username}"`}
                open={!!editUser}
                onCancel={() => setEditUser(null)}
                onOk={() => editForm.submit()}
                confirmLoading={updateMutation.isPending}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(vals) =>
                        updateMutation.mutate({
                            id: editUser!.id,
                            dto: {
                                username: vals.username,
                                email: vals.email,
                                password: vals.password || undefined,
                                roleId: vals.roleId,
                                websiteId: vals.websiteId ?? null,
                                isActive: vals.isActive,
                            },
                        })
                    }
                >
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true }, { type: 'email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="New Password"
                        help="Leave blank to keep the current password"
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
                        <Select options={roleOptions} placeholder="Select a role" />
                    </Form.Item>
                    {!claimedWebsiteId && (
                        <Form.Item
                            name="websiteId"
                            label="Website"
                            help="Assign to a website, or leave blank for global (Super Admin) access."
                        >
                            <Select
                                options={websiteOptionsWithNull}
                                placeholder="None (global access)"
                                allowClear
                            />
                        </Form.Item>
                    )}
                    <Form.Item name="isActive" label="Active" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </ActionModal>
        </>
    );
}
