// Top navigation bar — extracted from the authenticated layout shell.
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Dropdown, Typography } from 'antd';
import { LogoutOutlined, UserOutlined, TranslationOutlined, SafetyCertificateOutlined, AuditOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useJwtClaims } from '../../core/auth/AuthContext';
import { useAuth } from '../../core/auth/AuthContext';

const { Text } = Typography;

export function AppNavbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const claims = useJwtClaims();

    const username = claims['sub'] ?? 'Admin';
    const isSuperAdmin = claims['role'] === 'Super Admin';

    const handleLogout = () => {
        logout();
        queryClient.clear();
        navigate({ to: '/login' });
    };

    const userMenu = [
        {
            key: 'translations',
            icon: <TranslationOutlined />,
            label: 'Manage Locales',
            onClick: () => navigate({ to: '/translations' }),
        },
        ...(isSuperAdmin ? [{
            key: 'roles',
            icon: <SafetyCertificateOutlined />,
            label: 'Roles & Access Control',
            onClick: () => navigate({ to: '/roles' }),
        }, {
            key: 'audit-logs',
            icon: <AuditOutlined />,
            label: 'Audit Log',
            onClick: () => navigate({ to: '/audit-logs' }),
        }] : []),
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Sign out',
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <header className="bg-primary-dark! flex items-center justify-between px-8 h-16 border-b border-white/10">
            <Link to="/websites" className="flex items-center gap-2.5 no-underline">
                <div className="w-14 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-sm font-bold">
                    RTDC
                </div>
            </Link>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <button className="flex items-center gap-2.5 cursor-pointer bg-transparent border-0 p-0 rounded-lg hover:bg-white/10 px-2 py-1.5 transition-colors">
                    <Avatar size={30} icon={<UserOutlined />} className="bg-primary!" />
                    <Text className="text-white/80! text-sm hidden sm:inline font-medium">
                        {username}
                    </Text>
                </button>
            </Dropdown>
        </header>
    );
}
