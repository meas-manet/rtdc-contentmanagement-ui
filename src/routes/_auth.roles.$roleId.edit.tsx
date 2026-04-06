// Role permission matrix editor
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Checkbox,
    Form,
    Input,
    Spin,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ArrowLeftOutlined,
    LockOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import { PageHeader } from '../shared/components/PageHeader';
import { useAppToast } from '../shared/hooks/useAppToast';
import { rolesApi } from '../features/roles/api';
import {
    PERMISSION_MODULES,
    EMPTY_PERMISSIONS,
} from '../features/roles/types';
import type { ModulePermissionsDto } from '../features/roles/types';

export const Route = createFileRoute('/_auth/roles/$roleId/edit')({
    component: RoleEditPage,
});

const ACTIONS: Array<{ key: keyof ModulePermissionsDto; label: string }> = [
    { key: 'create', label: 'Create' },
    { key: 'read', label: 'Read' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' },
    { key: 'publish', label: 'Publish' },
];

// ── Row type for the matrix table ─────────────────────────────────────────────
interface MatrixRow {
    moduleKey: string;
    moduleLabel: string;
    permissions: ModulePermissionsDto;
}

function RoleEditPage() {
    const { roleId } = Route.useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const [form] = Form.useForm();

    const { data: role, isPending } = useQuery({
        queryKey: ['roles', roleId],
        queryFn: () => rolesApi.getById(roleId),
    });

    // Populate the form when data arrives
    useEffect(() => {
        if (!role) return;

        form.setFieldsValue({ name: role.name, description: role.description });

        // Build per-module field values
        const permFields: Record<string, Record<string, boolean>> = {};
        for (const { key: mod } of PERMISSION_MODULES) {
            const existingPerms = role.permissions[mod] ?? EMPTY_PERMISSIONS;
            permFields[mod] = { ...existingPerms };
        }
        form.setFieldsValue({ permissions: permFields });
    }, [role, form]);

    const updateMutation = useMutation({
        mutationFn: (vals: Parameters<typeof rolesApi.update>[1]) =>
            rolesApi.update(roleId, vals),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role updated successfully.');
            navigate({ to: '/roles/' });
        },
        onError: () => toast.error('Failed to save role.'),
    });

    const handleSave = () => {
        form.validateFields().then((vals) => {
            const permissions: Record<string, ModulePermissionsDto> = {};
            for (const { key: mod } of PERMISSION_MODULES) {
                permissions[mod] = vals.permissions?.[mod] ?? EMPTY_PERMISSIONS;
            }
            updateMutation.mutate({
                name: vals.name,
                description: vals.description,
                permissions,
            });
        });
    };

    // Build columns: Module | Create | Read | Update | Delete | Publish | All
    const columns: ColumnsType<MatrixRow> = [
        {
            title: 'Module',
            dataIndex: 'moduleLabel',
            width: 160,
            render: (label: string) => (
                <span className="font-medium text-gray-800">{label}</span>
            ),
        },
        ...ACTIONS.map(({ key: action, label }) => ({
            title: label,
            dataIndex: action,
            width: 90,
            align: 'center' as const,
            render: (_: unknown, row: MatrixRow) => (
                <Form.Item
                    name={['permissions', row.moduleKey, action]}
                    valuePropName="checked"
                    noStyle
                >
                    <Checkbox disabled={role?.isSystem && role.name === 'Super Admin'} />
                </Form.Item>
            ),
        })),
        {
            title: (
                <Tooltip title="Toggle all permissions for a module">All</Tooltip>
            ),
            width: 70,
            align: 'center' as const,
            render: (_, row: MatrixRow) => {
                const allOn = ACTIONS.every(
                    (a) => form.getFieldValue(['permissions', row.moduleKey, a.key]) === true,
                );
                return (
                    <Switch
                        size="small"
                        checked={allOn}
                        disabled={role?.isSystem && role.name === 'Super Admin'}
                        onChange={(checked) => {
                            const patch: Record<string, boolean> = {};
                            for (const { key } of ACTIONS) patch[key] = checked;
                            form.setFieldValue(['permissions', row.moduleKey], patch);
                        }}
                    />
                );
            },
        },
    ];

    const dataSource: MatrixRow[] = PERMISSION_MODULES.map(({ key, label }) => ({
        moduleKey: key,
        moduleLabel: label,
        permissions:
            (role?.permissions[key] as ModulePermissionsDto | undefined) ?? EMPTY_PERMISSIONS,
    }));

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="p-8">
                <Typography.Text type="danger">Role not found.</Typography.Text>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        {role.isSystem && (
                            <Tooltip title="This is a built-in system role">
                                <LockOutlined className="text-gray-400" />
                            </Tooltip>
                        )}
                        Edit Role: {role.name}
                        {role.isSystem && (
                            <Tag color="purple" className="ml-1">
                                System
                            </Tag>
                        )}
                    </span>
                }
                subtitle="Configure granular permissions per module"
                actions={
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate({ to: '/roles/' })}
                    >
                        Back
                    </Button>
                }
            />

            <Form form={form} layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                        name="name"
                        label="Role Name"
                        rules={[{ required: true }]}
                    >
                        <Input disabled={role.isSystem} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input disabled={role.isSystem} />
                    </Form.Item>
                </div>

                {/* Permission matrix */}
                <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6 mb-6">
                    <Typography.Title level={5} className="mb-4!">
                        Permission Matrix
                    </Typography.Title>

                    {role.isSystem && role.name === 'Super Admin' ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
                            Super Admin has unrestricted access to all modules. Permissions cannot be modified.
                        </div>
                    ) : (
                        <Table
                            dataSource={dataSource}
                            columns={columns}
                            rowKey="moduleKey"
                            pagination={false}
                            size="middle"
                            className="permission-matrix"
                        />
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button onClick={() => navigate({ to: '/roles/' })}>Cancel</Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={updateMutation.isPending}
                        onClick={handleSave}
                        disabled={role.isSystem && role.name === 'Super Admin'}
                    >
                        Save Changes
                    </Button>
                </div>
            </Form>
        </div>
    );
}
