import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Tag, Select, Input, Tooltip, Typography } from 'antd';
import { AuditOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { PageHeader } from '../shared/components/PageHeader';
import { TableCard } from '../shared/components/TableCard';
import { auditLogsApi } from '../features/audit-logs/api';
import { websitesApi } from '../features/websites/api';
import { parseJwtPayload } from '../core/auth/AuthContext';
import type { AuditLogDto } from '../features/audit-logs/types';

const { Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
    Create: 'green',
    Update: 'blue',
    Delete: 'red',
    RegenerateKey: 'orange',
    Upload: 'purple',
};

const ENTITY_COLORS: Record<string, string> = {
    Website: 'cyan',
    Schema: 'geekblue',
    AdminUser: 'volcano',
    Role: 'gold',
    MediaAsset: 'lime',
};

export const Route = createFileRoute('/_auth/audit-logs')({
    beforeLoad: () => {
        const token = localStorage.getItem('jwt');
        const claims = token ? parseJwtPayload(token) : {};
        if (claims['role'] !== 'Super Admin') throw redirect({ to: '/websites' });
    },
    component: AuditLogsPage,
});

const PAGE_SIZE = 50;

function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [filterWebsiteId, setFilterWebsiteId] = useState<string | null>(null);
    const [filterAction, setFilterAction] = useState<string | null>(null);
    const [filterEntityType, setFilterEntityType] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const { data: websites = [] } = useQuery({
        queryKey: ['websites'],
        queryFn: websitesApi.getAll,
    });

    const { data, isPending } = useQuery({
        queryKey: ['audit-logs', filterWebsiteId, page],
        queryFn: () => auditLogsApi.getAll({ websiteId: filterWebsiteId, page, pageSize: PAGE_SIZE }),
        placeholderData: (prev) => prev,
    });

    const items = (data?.items ?? []).filter((row) => {
        if (filterAction && row.action !== filterAction) return false;
        if (filterEntityType && row.entityType !== filterEntityType) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                row.actorName.toLowerCase().includes(q) ||
                row.entityId.toLowerCase().includes(q) ||
                row.entityType.toLowerCase().includes(q) ||
                row.action.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const websiteMap = Object.fromEntries(websites.map((w) => [w.id, w.name]));

    const columns: ColumnsType<AuditLogDto> = [
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            width: 190,
            render: (ts: string) => (
                <Text className="text-xs text-gray-500 font-mono whitespace-nowrap">
                    {new Date(ts).toLocaleString()}
                </Text>
            ),
        },
        {
            title: 'Actor',
            dataIndex: 'actorName',
            width: 140,
            render: (name: string) => <span className="font-medium text-gray-800">{name}</span>,
        },
        {
            title: 'Action',
            dataIndex: 'action',
            width: 130,
            render: (action: string) => (
                <Tag color={ACTION_COLORS[action] ?? 'default'}>{action}</Tag>
            ),
        },
        {
            title: 'Entity Type',
            dataIndex: 'entityType',
            width: 130,
            render: (type: string) => (
                <Tag color={ENTITY_COLORS[type] ?? 'default'}>{type}</Tag>
            ),
        },
        {
            title: 'Entity ID',
            dataIndex: 'entityId',
            render: (id: string) => (
                <Tooltip title={id}>
                    <Text className="text-xs font-mono text-gray-400">{id.slice(0, 8)}…</Text>
                </Tooltip>
            ),
        },
        {
            title: 'Website',
            dataIndex: 'websiteId',
            width: 160,
            render: (id: string | null) =>
                id ? (
                    <Tag color="blue">{websiteMap[id] ?? id.slice(0, 8)}</Tag>
                ) : (
                    <span className="text-gray-400 text-xs italic">Global</span>
                ),
        },
    ];

    const actionOptions = Object.keys(ACTION_COLORS).map((a) => ({ value: a, label: a }));
    const entityOptions = Object.keys(ENTITY_COLORS).map((e) => ({ value: e, label: e }));
    const websiteOptions = [
        { value: null as string | null, label: 'All websites' },
        ...websites.map((w) => ({ value: w.id, label: w.name })),
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <AuditOutlined /> Audit Log
                    </span>
                }
                subtitle="A complete, append-only record of all admin actions"
            />

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-5">
                <Input
                    prefix={<SearchOutlined className="text-gray-400" />}
                    placeholder="Search actor, entity…"
                    className="w-56"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    allowClear
                />
                <Select
                    className="w-44"
                    options={websiteOptions}
                    value={filterWebsiteId}
                    onChange={(v) => { setFilterWebsiteId(v); setPage(1); }}
                    placeholder="All websites"
                />
                <Select
                    className="w-36"
                    options={[{ value: null, label: 'All actions' }, ...actionOptions]}
                    value={filterAction}
                    onChange={(v) => { setFilterAction(v); setPage(1); }}
                    placeholder="All actions"
                />
                <Select
                    className="w-36"
                    options={[{ value: null, label: 'All entities' }, ...entityOptions]}
                    value={filterEntityType}
                    onChange={(v) => { setFilterEntityType(v); setPage(1); }}
                    placeholder="All entities"
                />
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            <TableCard
                rowKey="id"
                dataSource={items}
                columns={columns}
                loading={isPending}
                pagination={{
                    current: page,
                    pageSize: PAGE_SIZE,
                    total: data?.total ?? 0,
                    onChange: (p) => setPage(p),
                    showSizeChanger: false,
                    showTotal: (total) => `${total} entries`,
                }}
            />
        </div>
    );
}
