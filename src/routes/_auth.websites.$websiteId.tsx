// Website layout: sidebar with schemas as nav items
import {
    createFileRoute,
    Outlet,
    useNavigate,
    useParams,
    useMatchRoute,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Spin, Tag, Typography, Tooltip } from 'antd';
import {
    DatabaseOutlined,
    PictureOutlined,
    ArrowLeftOutlined,
    PlusOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { websitesApi, schemasApi } from '../lib/api';

const { Text } = Typography;

export const Route = createFileRoute('/_auth/websites/$websiteId')({
    component: WebsiteLayout,
});

// ── Pill nav item ─────────────────────────────────────────────────────────────
function NavItem({
    icon,
    label,
    active,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 text-left ${
                active
                    ? 'bg-[#213E9A]/10 text-[#213E9A]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-transparent'
            }`}
        >
            <span className={`text-base leading-none ${active ? 'text-[#213E9A]' : 'text-gray-400'}`}>
                {icon}
            </span>
            <span className="truncate leading-none">{label}</span>
        </button>
    );
}

function WebsiteLayout() {
    const { websiteId } = useParams({ from: '/_auth/websites/$websiteId' });
    const navigate = useNavigate();
    const matchRoute = useMatchRoute();

    const { data: website } = useQuery({
        queryKey: ['websites', websiteId],
        queryFn: () => websitesApi.getById(websiteId),
    });

    const { data: schemas, isPending: schemasLoading } = useQuery({
        queryKey: ['schemas', websiteId],
        queryFn: () => schemasApi.getAll(websiteId),
    });

    const isMedia = !!matchRoute({
        to: '/websites/$websiteId/media',
        params: { websiteId },
        fuzzy: true,
    });

    // Activates only on the exact schemas list page, not on schema detail children
    const isSchemasManage =
        !!matchRoute({ to: '/websites/$websiteId/schemas', params: { websiteId } }) &&
        !(schemas ?? []).some((s) =>
            matchRoute({
                to: '/websites/$websiteId/schemas/$schemaId',
                params: { websiteId, schemaId: s.id },
                fuzzy: true,
            }),
        );

    const activeSchemaId = (() => {
        for (const s of schemas ?? []) {
            if (
                matchRoute({
                    to: '/websites/$websiteId/schemas/$schemaId',
                    params: { websiteId, schemaId: s.id },
                    fuzzy: true,
                })
            )
                return s.id;
        }
        return null;
    })();

    return (
        <div className="flex min-h-[calc(100vh-64px)]">
            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside className="w-60 shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden">
                {/* Site identity */}
                <div className="p-4 border-b border-surface-border">
                    <button
                        onClick={() => navigate({ to: '/websites' })}
                        className="flex items-center gap-1.5 text-muted text-xs hover:text-gray-800 transition-colors mb-3 bg-transparent border-0 cursor-pointer px-0 font-medium"
                    >
                        <ArrowLeftOutlined />
                        <span>All websites</span>
                    </button>
                    {website ? (
                        <div>
                            <Text strong className="block text-sm text-gray-900 leading-tight">
                                {website.name}
                            </Text>
                            <Tag color="blue" className="mt-1.5 text-xs">
                                {website.slug}
                            </Tag>
                        </div>
                    ) : (
                        <div className="h-10 animate-pulse bg-gray-100 rounded-lg" />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-3 px-2">
                    {/* Content Types section */}
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                            Content Types
                        </span>
                        <Tooltip title="Manage Schemas">
                            <button
                                onClick={() =>
                                    navigate({
                                        to: '/websites/$websiteId/schemas',
                                        params: { websiteId },
                                    })
                                }
                                className="w-5 h-5 flex items-center justify-center rounded text-muted hover:bg-gray-100 hover:text-gray-700 bg-transparent border-0 cursor-pointer"
                            >
                                <PlusOutlined style={{ fontSize: 10 }} />
                            </button>
                        </Tooltip>
                    </div>

                    <div className="space-y-0.5">
                        {schemasLoading ? (
                            <div className="flex justify-center py-4">
                                <Spin size="small" />
                            </div>
                        ) : (
                            (schemas ?? []).map((s) => (
                                <NavItem
                                    key={s.id}
                                    icon={<DatabaseOutlined />}
                                    label={s.name}
                                    active={activeSchemaId === s.id}
                                    onClick={() =>
                                        navigate({
                                            to: '/websites/$websiteId/schemas/$schemaId',
                                            params: { websiteId, schemaId: s.id },
                                        })
                                    }
                                />
                            ))
                        )}
                    </div>

                    <div className="border-t border-surface-border my-3 mx-1" />

                    {/* System nav */}
                    <div className="space-y-0.5">
                        <NavItem
                            icon={<SettingOutlined />}
                            label="Manage Schemas"
                            active={isSchemasManage}
                            onClick={() =>
                                navigate({
                                    to: '/websites/$websiteId/schemas',
                                    params: { websiteId },
                                })
                            }
                        />
                        <NavItem
                            icon={<PictureOutlined />}
                            label="Media Library"
                            active={isMedia}
                            onClick={() =>
                                navigate({
                                    to: '/websites/$websiteId/media',
                                    params: { websiteId },
                                })
                            }
                        />
                    </div>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────────── */}
            <main className="flex-1 bg-app-bg overflow-auto min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
