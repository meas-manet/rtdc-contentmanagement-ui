// Authenticated shell layout — guards all child routes
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Layout } from 'antd';
import { AppNavbar } from '../shared/components/AppNavbar';

const { Content } = Layout;

export const Route = createFileRoute('/_auth')({
    beforeLoad: () => {
        if (!localStorage.getItem('jwt')) throw redirect({ to: '/login' });
    },
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <Layout className="min-h-screen">
            <AppNavbar />
            <Layout>
                <Content className="bg-app-bg">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
