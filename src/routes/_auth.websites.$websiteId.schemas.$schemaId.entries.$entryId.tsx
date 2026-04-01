// Entry editor: create or edit a content entry with localization tabs
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Form,
    Button,
    Select,
    Tabs,
    Spin,
    Typography,
    Space,
    Tag,
    Alert,
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    SendOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { schemasApi } from '../features/schemas/api';
import { websitesApi } from '../features/websites/api';
import { contentApi } from '../features/entries/api';
import { toLocaleOptions, useLocales } from '../core/locales';
import { SchemaForm } from '../shared/components/SchemaForm';
import { RelationManager } from '../shared/components/RelationManager';
import type { ContentStatus } from '../features/entries/types';
import { useAppToast } from '../shared/hooks/useAppToast';
import { useDeleteConfirm } from '../shared/hooks/useDeleteConfirm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;



export const Route = createFileRoute('/_auth/websites/$websiteId/schemas/$schemaId/entries/$entryId')({
    component: EntryEditorPage,
});

function EntryEditorPage() {
    const { websiteId, schemaId, entryId } = useParams({
        from: '/_auth/websites/$websiteId/schemas/$schemaId/entries/$entryId',
    });
    const isNew = entryId === 'new';
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useAppToast();
    const deleteConfirm = useDeleteConfirm();
    const [activeLocale, setActiveLocale] = useState('en');
    const [form] = Form.useForm();

    const { data: website } = useQuery({
        queryKey: ['websites', websiteId],
        queryFn: () => websitesApi.getById(websiteId),
    });

    const { data: schema } = useQuery({
        queryKey: ['schemas', websiteId, schemaId],
        queryFn: () => schemasApi.getById(websiteId, schemaId),
    });

    // Fetch the base entry (only for edit mode)
    const { data: entry, isPending: entryLoading } = useQuery({
        queryKey: ['entry', entryId],
        queryFn: () =>
            contentApi.getEntry(website!.slug, schema!.slug, entryId, website!.apiKey),
        enabled: !isNew && !!website && !!schema,
    });

    // Fetch all localizations
    const { data: localizations } = useQuery({
        queryKey: ['localizations', entryId],
        queryFn: () =>
            contentApi.getLocalizations(website!.slug, schema!.slug, entryId, website!.apiKey),
        enabled: !isNew && !!website && !!schema,
    });

    // Map: locale -> entry data
    const localeMap: Record<string, typeof entry> = {};
    if (entry) localeMap[entry.locale] = entry;
    localizations?.forEach((l) => { localeMap[l.locale] = l; });

    const existingLocales = Object.keys(localeMap);
    const currentLocaleEntry = localeMap[activeLocale];

    const { data: localeData = [] } = useLocales();
    const localeOptions = toLocaleOptions(website?.supportedLocales ?? ['en'], localeData);

    // Populate form when locale or entry data changes
    useEffect(() => {
        if (currentLocaleEntry) {
            const values = normalizeFormValues(currentLocaleEntry.data, schema?.definition ?? []);
            form.setFieldsValue(values);
        } else {
            form.resetFields();
        }
    }, [activeLocale, currentLocaleEntry, schema, form]);

    const createMutation = useMutation({
        mutationFn: (values: { data: Record<string, unknown>; status: ContentStatus }) =>
            contentApi.create(website!.slug, schema!.slug, { ...values, locale: activeLocale }, website!.apiKey),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['content', websiteId, schemaId] });
            toast.success('The new entry has been created successfully.');
            navigate({
                to: '/websites/$websiteId/schemas/$schemaId/entries/$entryId',
                params: { websiteId, schemaId, entryId: created.id },
            });
        },
        onError: () => toast.error('Something went wrong while creating the entry. Please try again.'),
    });

    const updateMutation = useMutation({
        mutationFn: (values: { data: Record<string, unknown>; status: ContentStatus }) =>
            contentApi.update(
                website!.slug,
                schema!.slug,
                currentLocaleEntry!.id,
                values,
                website!.apiKey
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['content', websiteId, schemaId] });
            qc.invalidateQueries({ queryKey: ['entry', entryId] });
            qc.invalidateQueries({ queryKey: ['localizations', entryId] });
            toast.success('All entry changes have been saved successfully.');
        },
        onError: () => toast.error('Something went wrong while saving the entry. Please try again.'),
    });

    // ── Status-only mutation (unpublish / re-draft) ──────────────────────────
    // The backend has no dedicated PATCH /status endpoint; status is changed
    // through the standard PUT /{id} endpoint — we just preserve existing data.
    const statusMutation = useMutation({
        mutationFn: (status: ContentStatus) =>
            contentApi.update(
                website!.slug,
                schema!.slug,
                entry!.id,
                { data: entry!.data, status },
                website!.apiKey,
            ),
        onSuccess: (_data, status) => {
            qc.invalidateQueries({ queryKey: ['entry', entryId] });
            qc.invalidateQueries({ queryKey: ['localizations', entryId] });
            qc.invalidateQueries({ queryKey: ['content', websiteId, schemaId] });
            const label = status === 'draft' ? 'reverted to draft' : 'published';
            toast.success(`The entry has been ${label} successfully.`);
        },
        onError: (_err, status) => {
            const label = status === 'draft' ? 'unpublish' : 'publish';
            toast.error(`Something went wrong while trying to ${label} the entry. Please try again.`);
        },
    });

    const createLocalizationMutation = useMutation({
        mutationFn: (values: { data: Record<string, unknown>; status: ContentStatus }) =>
            contentApi.createLocalization(
                website!.slug,
                schema!.slug,
                entry!.id,
                { ...values, locale: activeLocale },
                website!.apiKey
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['localizations', entryId] });
            toast.success(`A new localization for "${activeLocale}" has been created successfully.`);
        },
        onError: () => toast.error('Something went wrong while creating the localization. Please try again.'),
    });

    const handleSave = async (status: ContentStatus = 'draft') => {
        try {
            const raw = await form.validateFields();
            const data = serializeFormValues(raw, schema?.definition ?? []);
            if (isNew) {
                createMutation.mutate({ data, status });
            } else if (currentLocaleEntry) {
                updateMutation.mutate({ data, status });
            } else {
                createLocalizationMutation.mutate({ data, status });
            }
        } catch {
            // validation errors shown inline
        }
    };

    if (!website || !schema) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    const isSaving =
        createMutation.isPending ||
        updateMutation.isPending ||
        createLocalizationMutation.isPending;

    const isUnpublishing = statusMutation.isPending;
    const isPublished = !isNew && entry?.status === 'published';

    const tabItems = localeOptions.map((loc) => {
        const exists = existingLocales.includes(loc.value) || (isNew && loc.value === (website?.defaultLocale ?? 'en'));
        return {
            key: loc.value,
            label: (
                <span className="flex items-center gap-1">
                    {loc.label}
                    {exists ? (
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-surface-border inline-block" />
                    )}
                </span>
            ),
        };
    });

    return (
        <div className="min-h-screen bg-app-bg pb-12">

            {/* ── Sticky Header ───────────────────────────────────── */}
            <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-surface-border shadow-sm px-8 py-4 mb-8 flex items-center justify-between transition-all duration-300">
                <div>
                    <button
                        onClick={() =>
                            navigate({
                                to: '/websites/$websiteId/schemas/$schemaId',
                                params: { websiteId, schemaId },
                            })
                        }
                        className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors mb-2 bg-transparent border-0 cursor-pointer px-0 font-medium text-sm group"
                    >
                        <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to {schema.name}</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <Title level={2} className="mb-0! font-bold! text-gray-900! tracking-tight">
                            {isNew ? 'New Entry' : 'Edit Entry'}
                        </Title>
                        {!isNew && entry && (
                            <Tag
                                color={entry.status === 'published' ? 'success' : 'processing'}
                                className="m-0 rounded-full px-3 py-0.5 border-transparent shadow-sm font-semibold"
                            >
                                {entry.status.toUpperCase()}
                            </Tag>
                        )}
                    </div>
                </div>

                <Space className="hidden md:flex" wrap>
                    {/* Unpublish — only visible when the entry is live */}
                    {isPublished && (
                        <Button
                            onClick={() =>
                                deleteConfirm({
                                    title: 'Revert to draft?',
                                    description: 'This entry will no longer be visible on the live site.',
                                    okText: 'Unpublish',
                                    onConfirm: () => statusMutation.mutateAsync('draft'),
                                })
                            }
                            size="large"
                            icon={<EyeInvisibleOutlined />}
                            loading={isUnpublishing}
                            disabled={isSaving}
                            danger
                            className="font-semibold"
                        >
                            Unpublish
                        </Button>
                    )}

                    <Button
                        size="large"
                        icon={<SaveOutlined />}
                        onClick={() => handleSave(isPublished ? 'published' : 'draft')}
                        loading={isSaving}
                        disabled={isUnpublishing}
                        className="font-semibold"
                    >
                        {isPublished ? 'Update' : 'Save Draft'}
                    </Button>

                    {!isPublished && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<SendOutlined />}
                            onClick={() => handleSave('published')}
                            loading={isSaving}
                            disabled={isUnpublishing}
                            className="font-semibold"
                        >
                            Publish
                        </Button>
                    )}
                </Space>
            </div>

            <div className="px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Main content (Form) ─────────────────────────────── */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {/* Locale Tabs */}
                    {!isNew && (
                        <Tabs
                            activeKey={activeLocale}
                            onChange={setActiveLocale}
                            items={tabItems}
                            type="card"
                            className="[&>.ant-tabs-nav::before]:border-b-0 [&_.ant-tabs-nav]:mb-0"
                        />
                    )}

                    {/* Form Card */}
                    <div className={`bg-white border border-surface-border shadow-sm p-8 transition-shadow hover:shadow-md duration-300 ${!isNew ? 'rounded-b-2xl rounded-tr-2xl -mt-px relative z-10' : 'rounded-2xl'}`}>
                        {!currentLocaleEntry && !isNew && (
                            <Alert
                                type="info"
                                className="mb-6 rounded-xl border-blue-200 bg-blue-50/50"
                                title={`No translation for "${activeLocale}" yet. Fill the form below and click "Publish" to create it.`}
                                showIcon
                            />
                        )}

                        <div className="mb-6 pb-4 border-b border-surface-border">
                            <h3 className="text-lg font-semibold text-gray-800 m-0">Entry Content</h3>
                            <p className="text-muted text-sm mt-1 mb-0">Fill out the fields below based on the {schema.name} schema.</p>
                        </div>

                        {!isNew && entryLoading ? (
                            <div className="flex justify-center py-20">
                                <Spin size="large" />
                            </div>
                        ) : (
                            <Form form={form} layout="vertical" size="large" className="space-y-6">
                                <SchemaForm definition={schema.definition} />

                                {isNew && (
                                    <Form.Item name="_locale" label="Initial Locale" initialValue={website?.defaultLocale ?? 'en'} className="mb-0 pt-4 border-t border-surface-border">
                                        <Select
                                            options={localeOptions}
                                            onChange={(v) => setActiveLocale(v)}
                                            size="large"
                                            className="w-full md:w-1/2"
                                        />
                                    </Form.Item>
                                )}
                            </Form>
                        )}
                    </div>

                    {/* Relations — below entry content */}
                    {!isNew && entry && (() => {
                        const relationFields = schema.definition.filter(
                            (f) => f.type === 'relation' && f.targetSchemaSlug,
                        );
                        if (relationFields.length === 0) return null;
                        return (
                            <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-6 mt-6">
                                <h3 className="text-base font-semibold text-gray-800 mb-1 pb-3 border-b border-surface-border">
                                    Relations
                                </h3>
                                <p className="text-muted text-xs mt-3 mb-4">
                                    Select records from the linked Content-Types.
                                    Populate them on fetch with{' '}
                                    <code className="bg-gray-100 px-1 rounded text-xs">
                                        ?include=&lt;fieldName&gt;
                                    </code>.
                                </p>
                                <div className="space-y-6 divide-y divide-surface-border">
                                    {relationFields.map((f, i) => (
                                        <div key={f.name} className={i > 0 ? 'pt-6' : ''}>
                                            <RelationManager
                                                siteSlug={website!.slug}
                                                parentSchemaSlug={schema.slug}
                                                parentId={entry.id}
                                                apiKey={website!.apiKey}
                                                relationName={f.name}
                                                relationType={f.relationType ?? 'one-to-many'}
                                                targetSchemaSlug={f.targetSchemaSlug!}
                                                labelField={f.labelField}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* ── Right Sidebar (Metadata & Mobile actions) ────────── */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-32 space-y-6">

                        {/* Publishing Meta Card */}
                        <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-surface-border">Publishing Info</h3>

                            <div className="space-y-4">
                                <div>
                                    <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">Current Status</Text>
                                    {isNew ? (
                                        <Tag className="m-0 rounded-md">NEW</Tag>
                                    ) : (
                                        <Tag color={entry?.status === 'published' ? 'success' : 'processing'} className="m-0 rounded-md py-0.5 px-2 font-medium">
                                            {entry?.status.toUpperCase() || 'UNKNOWN'}
                                        </Tag>
                                    )}
                                </div>

                                {!isNew && entry && (
                                    <div>
                                        <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">Last Updated</Text>
                                        <Text className="text-sm font-medium text-gray-700">
                                            {dayjs(entry.updatedAt).format('MMM D, YYYY • h:mm A')}
                                        </Text>
                                    </div>
                                )}

                                {!isNew && entry && (
                                    <div>
                                        <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-1 block">Entry ID</Text>
                                        <Text className="text-xs font-mono bg-gray-50 p-1.5 rounded border border-gray-100 break-all">
                                            {entry.id}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Actions Card (Fallback for smaller screens) */}
                        <div className="bg-white rounded-2xl border border-surface-border shadow-sm p-6 md:hidden">
                            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-3 border-b border-surface-border">Actions</h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    size="large"
                                    icon={<SaveOutlined />}
                                    onClick={() => handleSave(isPublished ? 'published' : 'draft')}
                                    loading={isSaving}
                                    disabled={isUnpublishing}
                                    block
                                >
                                    {isPublished ? 'Update' : 'Save Draft'}
                                </Button>

                                {!isPublished && (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<SendOutlined />}
                                        onClick={() => handleSave('published')}
                                        loading={isSaving}
                                        disabled={isUnpublishing}
                                        block
                                    >
                                        Publish
                                    </Button>
                                )}

                                {isPublished && (
                                    <Button
                                        onClick={() =>
                                            deleteConfirm({
                                                title: 'Revert to draft?',
                                                description: 'This entry will no longer be visible on the live site.',
                                                okText: 'Unpublish',
                                                onConfirm: () => statusMutation.mutateAsync('draft'),
                                            })
                                        }
                                        size="large"
                                        icon={<EyeInvisibleOutlined />}
                                        loading={isUnpublishing}
                                        disabled={isSaving}
                                        danger
                                        block
                                    >
                                        Unpublish
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Prepare initial form values from server data (handle dayjs for dates)
function normalizeFormValues(
    data: Record<string, unknown>,
    definition: { name: string; type: string }[]
): Record<string, unknown> {
    const out: Record<string, unknown> = { ...data };
    definition.forEach((f) => {
        if (f.type === 'date' && out[f.name]) {
            out[f.name] = dayjs(out[f.name] as string);
        }
    });
    return out;
}

// Serialize form values back (convert dayjs → ISO, keep booleans, etc.)
function serializeFormValues(
    values: Record<string, unknown>,
    definition: { name: string; type: string }[]
): Record<string, unknown> {
    const out: Record<string, unknown> = { ...values };
    definition.forEach((f) => {
        if (f.type === 'date' && out[f.name] && dayjs.isDayjs(out[f.name])) {
            out[f.name] = (out[f.name] as dayjs.Dayjs).toISOString();
        }
        // Remove internal form-only keys
        delete out['_locale'];
    });
    return out;
}
