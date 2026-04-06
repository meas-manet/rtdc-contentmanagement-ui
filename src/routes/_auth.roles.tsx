// Authenticated sub-layout shell for all /roles/* routes
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/roles')({
    component: () => <Outlet />,
});
