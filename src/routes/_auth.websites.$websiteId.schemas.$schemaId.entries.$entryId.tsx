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
    Card,
    Spin,
    message,
    Typography,
    Space,
    Tag,
    Alert,
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    TranslationOutlined,
    PlusOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { schemasApi, websitesApi, contentApi } from '../lib/api';
import { toLocaleOptions, useLocales } from '../lib/locales';
import { SchemaForm } from '../components/SchemaForm';
import type { ContentStatus } from '../lib/types';
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
    const [messageApi, contextHolder] = message.useMessage();
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
            messageApi.success('Entry created!');
            navigate({
                to: '/websites/$websiteId/schemas/$schemaId/entries/$entryId',
                params: { websiteId, schemaId, entryId: created.id },
            });
        },
        onError: () => messageApi.error('Failed to create entry.'),
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
            messageApi.success('Entry saved!');
        },
        onError: () => messageApi.error('Failed to save entry.'),
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
            messageApi.success(`Translation for "${activeLocale}" created!`);
        },
        onError: () => messageApi.error('Failed to create localization.'),
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
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                    )}
                </span>
            ),
        };
    });

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {contextHolder}
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="!px-0 !text-gray-500 mb-2"
                        onClick={() =>
                            navigate({
                                to: '/websites/$websiteId/schemas/$schemaId',
                                params: { websiteId, schemaId },
                            })
                        }
                    >
                        Back to {schema.name}
                    </Button>
                    <Title level={4} className="!mb-0">
                        {isNew ? 'New Entry' : 'Edit Entry'}
                    </Title>
                    {!isNew && entry && (
                        <Space className="mt-1">
                            <Tag color={entry.status === 'published' ? 'green' : 'gold'}>
                                {entry.status.toUpperCase()}
                            </Tag>
                            <Text type="secondary" className="text-xs">
                                Updated {new Date(entry.updatedAt).toLocaleString()}
                            </Text>
                        </Space>
                    )}
                </div>

                <Space>
                    <Button
                        icon={<SaveOutlined />}
                        onClick={() => handleSave('draft')}
                        loading={isSaving}
                    >
                        Save Draft
                    </Button>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => handleSave('published')}
                        loading={isSaving}
                    >
                        Publish
                    </Button>
                </Space>
            </div>

            {/* Locale Tabs */}
            {!isNew && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TranslationOutlined className="text-[#213E9A]" />
                        <Text strong className="text-sm">
                            Translations
                        </Text>
                    </div>
                    <Tabs
                        activeKey={activeLocale}
                        onChange={setActiveLocale}
                        items={tabItems}
                        size="small"
                        type="card"
                    />
                    {!currentLocaleEntry && !isNew && (
                        <Alert
                            type="info"
                            className="mb-4"
                            message={`No translation for "${activeLocale}" yet. Fill the form below and click "Publish" to create it.`}
                            showIcon
                        />
                    )}
                </div>
            )}

            {/* Form */}
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                {!isNew && entryLoading ? (
                    <div className="flex justify-center py-12">
                        <Spin />
                    </div>
                ) : (
                    <Form form={form} layout="vertical" size="middle">
                        <SchemaForm definition={schema.definition} />

                        {isNew && (
                            <Form.Item name="_locale" label="Initial Locale" initialValue={website?.defaultLocale ?? 'en'}>
                                <Select
                                    options={localeOptions}
                                    onChange={(v) => setActiveLocale(v)}
                                />
                            </Form.Item>
                        )}
                    </Form>
                )}
            </Card>

            {/* Bottom action bar */}
            <div className="flex justify-end gap-3 mt-6">
                <Button onClick={() => handleSave('draft')} loading={isSaving} icon={<SaveOutlined />}>
                    Save Draft
                </Button>
                <Button
                    type="primary"
                    onClick={() => handleSave('published')}
                    loading={isSaving}
                    icon={<SendOutlined />}
                >
                    Publish
                </Button>
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
