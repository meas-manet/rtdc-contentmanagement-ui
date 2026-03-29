import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    beforeLoad: () => {
        const token = localStorage.getItem('jwt');
        if (token) throw redirect({ to: '/websites' });
        throw redirect({ to: '/login' });
    },
    component: () => null,
});