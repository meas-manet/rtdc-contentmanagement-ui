// Top navigation bar — extracted from the authenticated layout shell.
import { Link, useNavigate } from '@tanstack/react-router';
import { Avatar, Dropdown, Typography } from 'antd';
import { LogoutOutlined, UserOutlined, TranslationOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

export function AppNavbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    };

    const userMenu = [
        {
            key: 'translations',
            icon: <TranslationOutlined />,
            label: 'Manage Locales',
            onClick: () => navigate({ to: '/translations' }),
        },
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
                        Admin
                    </Text>
                </button>
            </Dropdown>
        </header>
    );
}
