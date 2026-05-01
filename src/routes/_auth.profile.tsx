// Profile page — lets the signed-in user update their display info and password.
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Button, Typography, Spin, Tooltip } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    LockOutlined,
    SaveOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
    CalendarOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { authApi } from '../features/auth/api';
import { useAppToast } from '../shared/hooks/useAppToast';
import type { UpdateProfileDto, ChangePasswordDto } from '../features/auth/types';

const { Text, Title } = Typography;

export const Route = createFileRoute('/_auth/profile')({
    component: ProfilePage,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name
        .split(/[\s_-]/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// ── Page ───────────────────────────────────────────────────────────────────────

function ProfilePage() {
    const qc = useQueryClient();
    const toast = useAppToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const { data: me, isPending } = useQuery({
        queryKey: ['me'],
        queryFn: authApi.getMe,
    });

    useEffect(() => {
        if (me) profileForm.setFieldsValue({ username: me.username, email: me.email });
    }, [me, profileForm]);

    const profileMutation = useMutation({
        mutationFn: (dto: UpdateProfileDto) => authApi.updateProfile(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile updated successfully.');
        },
        onError: () => toast.error('Failed to update profile. Please try again.'),
    });

    const passwordMutation = useMutation({
        mutationFn: (dto: ChangePasswordDto) => authApi.changePassword(dto),
        onSuccess: () => {
            passwordForm.resetFields();
            toast.success('Password changed successfully.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(msg ?? 'Current password is incorrect.');
        },
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => authApi.uploadAvatar(file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile picture updated.');
        },
        onError: (err: unknown) => {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(msg ?? 'Failed to upload picture. Use JPEG, PNG or WebP under 5 MB.');
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) avatarMutation.mutate(file);
        // Reset so the same file can be re-selected if needed
        e.target.value = '';
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spin size="large" />
            </div>
        );
    }

    const initials = getInitials(me?.username ?? 'U');

    return (
        <div className="min-h-screen bg-app-bg">
            <div className="max-w-5xl mx-auto px-6 pt-10 pb-12">
                {/* ── Header row ──────────────────────────────────────────── */}
                <div className="flex flex-col items-center gap-3 mb-10">
                    {/* Avatar with click-to-upload */}
                    <Tooltip title="Change profile picture" placement="bottom">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarMutation.isPending}
                            className="relative w-24 h-24 rounded-2xl shrink-0 overflow-hidden group cursor-pointer border-0 p-0 bg-transparent shadow-md"
                        >
                            {me?.avatarUrl ? (
                                <img
                                    src={me.avatarUrl}
                                    alt={me.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary flex items-center justify-center">
                                    <span className="text-white font-bold text-3xl tracking-wide leading-none">
                                        {initials}
                                    </span>
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {avatarMutation.isPending
                                    ? <Spin size="small" className="[&_.ant-spin-dot-item]:bg-white!" />
                                    : <CameraOutlined className="text-white text-xl" />
                                }
                            </div>
                        </button>
                    </Tooltip>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <div className="text-center">
                        <Title level={4} className="mb-0! text-gray-900 font-bold!">
                            {me?.username}
                        </Title>
                        <Text className="text-muted text-sm">{me?.email}</Text>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left sidebar: account info ─────────────────────── */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-xs">
                            <Text className="text-xs font-semibold uppercase tracking-wider text-muted block mb-4">
                                Account info
                            </Text>

                            <div className="space-y-4">
                                <InfoRow
                                    icon={<SafetyCertificateOutlined className="text-primary" />}
                                    label="Role"
                                    value={me?.roleName ?? '—'}
                                />
                                <InfoRow
                                    icon={<GlobalOutlined className="text-primary" />}
                                    label="Website scope"
                                    value={me?.websiteName ?? 'All websites'}
                                />
                                <InfoRow
                                    icon={<CalendarOutlined className="text-primary" />}
                                    label="Member since"
                                    value={me?.createdAt ? formatDate(me.createdAt) : '—'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Right: edit panels ──────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Edit profile */}
                        <SectionCard
                            title="Profile details"
                            description="Update your display name and email address."
                        >
                            <Form
                                form={profileForm}
                                layout="vertical"
                                onFinish={(v) => profileMutation.mutate(v)}
                                requiredMark={false}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        rules={[
                                            { required: true, message: 'Username is required' },
                                            { max: 50, message: 'Max 50 characters' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<UserOutlined className="text-muted" />}
                                            size="large"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            { required: true, message: 'Email is required' },
                                            { type: 'email', message: 'Enter a valid email' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined className="text-muted" />}
                                            size="large"
                                        />
                                    </Form.Item>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        size="large"
                                        loading={profileMutation.isPending}
                                    >
                                        Save changes
                                    </Button>
                                </div>
                            </Form>
                        </SectionCard>

                        {/* Change password */}
                        <SectionCard
                            title="Change password"
                            description="Use a strong password you don't use elsewhere."
                            accent
                        >
                            <Form
                                form={passwordForm}
                                layout="vertical"
                                onFinish={(v) =>
                                    passwordMutation.mutate({
                                        currentPassword: v.currentPassword,
                                        newPassword: v.newPassword,
                                    })
                                }
                                requiredMark={false}
                            >
                                <Form.Item
                                    name="currentPassword"
                                    label="Current password"
                                    rules={[{ required: true, message: 'Enter your current password' }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-muted" />}
                                        size="large"
                                    />
                                </Form.Item>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                                    <Form.Item
                                        name="newPassword"
                                        label="New password"
                                        rules={[
                                            { required: true, message: 'Enter a new password' },
                                            { min: 8, message: 'Minimum 8 characters' },
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined className="text-muted" />}
                                            size="large"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm new password"
                                        dependencies={['newPassword']}
                                        rules={[
                                            { required: true, message: 'Please confirm your password' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value)
                                                        return Promise.resolve();
                                                    return Promise.reject(new Error('Passwords do not match'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined className="text-muted" />}
                                            size="large"
                                        />
                                    </Form.Item>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        htmlType="submit"
                                        icon={<LockOutlined />}
                                        size="large"
                                        loading={passwordMutation.isPending}
                                        className="border-red-400! text-red-500! hover:bg-red-50!"
                                    >
                                        Update password
                                    </Button>
                                </div>
                            </Form>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0 text-sm">
                {icon}
            </div>
            <div className="min-w-0">
                <Text className="text-xs text-muted block">{label}</Text>
                <Text className="text-sm font-medium text-gray-800 block truncate">{value}</Text>
            </div>
        </div>
    );
}

function SectionCard({
    title,
    description,
    children,
    accent = false,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <div className="bg-white rounded-2xl border border-surface-border shadow-xs overflow-hidden">
            <div className={`px-6 py-4 border-b border-surface-border ${accent ? 'bg-red-50/60' : 'bg-gray-50/60'}`}>
                <Text strong className="text-sm text-gray-800 block">{title}</Text>
                <Text className="text-xs text-muted">{description}</Text>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
