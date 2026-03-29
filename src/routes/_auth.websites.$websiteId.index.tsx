// Website index — redirect to schemas list
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/websites/$websiteId/')({
    beforeLoad: ({ params }) => {
        throw redirect({
            to: '/websites/$websiteId/schemas',
            params: { websiteId: params.websiteId },
        });
    },
    component: () => null,
});
