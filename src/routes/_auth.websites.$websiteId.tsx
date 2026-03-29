// Website layout: sidebar with schemas as nav items
import {
    createFileRoute,
    Outlet,
    useNavigate,
    useParams,
    Link,
    useMatchRoute,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout, Menu, Spin, Button, Tag, Typography, Tooltip } from 'antd';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    PictureOutlined,
    ArrowLeftOutlined,
    PlusOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { websitesApi, schemasApi } from '../lib/api';

const { Sider, Content } = Layout;
const { Text } = Typography;

export const Route = createFileRoute('/_auth/websites/$websiteId')({
    component: WebsiteLayout,
});

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

    const isMedia = matchRoute({ to: '/websites/$websiteId/media', params: { websiteId }, fuzzy: true });
    const isSchemas = matchRoute({ to: '/websites/$websiteId/schemas', params: { websiteId }, fuzzy: true });

    const schemaItems =
        schemas?.map((s) => ({
            key: `schema-${s.id}`,
            icon: <DatabaseOutlined />,
            label: s.name,
            onClick: () =>
                navigate({
                    to: '/websites/$websiteId/schemas/$schemaId',
                    params: { websiteId, schemaId: s.id },
                }),
        })) ?? [];

    const selectedKeys: string[] = [];
    if (isMedia) selectedKeys.push('media');
    if (isSchemas) selectedKeys.push('schemas-manage');
    // detect active schema
    schemas?.forEach((s) => {
        const match = matchRoute({
            to: '/websites/$websiteId/schemas/$schemaId',
            params: { websiteId, schemaId: s.id },
            fuzzy: true,
        });
        if (match) selectedKeys.push(`schema-${s.id}`);
    });

    return (
        <Layout className="min-h-[calc(100vh-56px)]">
            <Sider
                width={240}
                className="!bg-white border-r border-gray-100 shadow-sm"
                breakpoint="lg"
                collapsedWidth={0}
            >
                <div className="p-4 border-b border-gray-100">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        size="small"
                        onClick={() => navigate({ to: '/websites' })}
                        className="!text-gray-500 !px-0 mb-2"
                    >
                        All websites
                    </Button>
                    {website && (
                        <div>
                            <Text strong className="block text-sm">
                                {website.name}
                            </Text>
                            <Tag color="purple" className="mt-1 text-xs">
                                {website.slug}
                            </Tag>
                        </div>
                    )}
                </div>

                <div className="py-2">
                    <div className="px-4 py-2 flex items-center justify-between">
                        <Text type="secondary" className="text-xs uppercase tracking-wider font-medium">
                            Content Types
                        </Text>
                        <Tooltip title="New Schema">
                            <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    navigate({
                                        to: '/websites/$websiteId/schemas',
                                        params: { websiteId },
                                    })
                                }
                            />
                        </Tooltip>
                    </div>

                    {schemasLoading ? (
                        <div className="flex justify-center py-4">
                            <Spin size="small" />
                        </div>
                    ) : (
                        <Menu
                            mode="inline"
                            selectedKeys={selectedKeys}
                            items={schemaItems}
                            className="border-0 !bg-transparent"
                        />
                    )}

                    <div className="px-2 mt-2 border-t border-gray-100 pt-2">
                        <Menu
                            mode="inline"
                            selectedKeys={selectedKeys}
                            className="border-0 !bg-transparent"
                            items={[
                                {
                                    key: 'schemas-manage',
                                    icon: <SettingOutlined />,
                                    label: 'Manage Schemas',
                                    onClick: () =>
                                        navigate({
                                            to: '/websites/$websiteId/schemas',
                                            params: { websiteId },
                                        }),
                                },
                                {
                                    key: 'media',
                                    icon: <PictureOutlined />,
                                    label: 'Media Library',
                                    onClick: () =>
                                        navigate({
                                            to: '/websites/$websiteId/media',
                                            params: { websiteId },
                                        }),
                                },
                            ]}
                        />
                    </div>
                </div>
            </Sider>

            <Content className="bg-gray-50 overflow-auto">
                <Outlet />
            </Content>
        </Layout>
    );
}
