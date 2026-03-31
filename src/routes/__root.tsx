import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App, ConfigProvider } from 'antd';
import { AuthProvider } from '../core/auth/AuthContext';

const antdTheme = {
    token: {
        colorPrimary: '#213E9A',
        borderRadius: 8,
        fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    },
};

export const Route = createRootRoute({
    component: () => (
        <ConfigProvider theme={antdTheme}>
            <App>
                <AuthProvider>
                    <Outlet />
                    <TanStackRouterDevtools position="bottom-right" />
                    <ReactQueryDevtools initialIsOpen={false} />
                </AuthProvider>
            </App>
        </ConfigProvider>
    ),
});