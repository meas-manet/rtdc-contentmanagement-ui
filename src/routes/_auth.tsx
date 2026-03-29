// Authenticated shell layout — guards all child routes
import { createFileRoute, Outlet, redirect, useNavigate, Link } from '@tanstack/react-router';
import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import { LogoutOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

export const Route = createFileRoute('/_auth')({
    beforeLoad: () => {
        if (!localStorage.getItem('jwt')) throw redirect({ to: '/login' });
    },
    component: AuthLayout,
});

function AuthLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    };

    const userMenu = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Sign out',
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout className="min-h-screen">
            <Header className="!bg-violet-900 flex items-center justify-between px-6 h-14 shadow-md">
                <Link to="/websites" className="flex items-center gap-2 no-underline">
                    <span className="text-lg font-bold text-white tracking-tight">⚡ RTDC CMS</span>
                </Link>
                <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                    <button className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0">
                        <Avatar size={32} icon={<UserOutlined />} className="bg-violet-600" />
                        <Text className="!text-violet-100 text-sm hidden sm:inline">Admin</Text>
                    </button>
                </Dropdown>
            </Header>
            <Layout>
                <Content className="bg-gray-50">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
