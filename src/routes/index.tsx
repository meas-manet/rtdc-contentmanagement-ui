import { createFileRoute } from '@tanstack/react-router'
import { Button } from 'antd'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="p-4 space-y-4">
            <h1 className="text-3xl font-bold text-slate-800">
                React 19 + TanStack + Antd
            </h1>
            <Button type="primary" size="large">
                This is an Ant Design Button
            </Button>
        </div>
    )
}