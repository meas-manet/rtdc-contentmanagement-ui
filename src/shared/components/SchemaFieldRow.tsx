/**
 * SchemaFieldRow
 *
 * One row inside the schema builder's Form.List.
 *
 * When the field type is "relation", an expandable sub-panel appears with:
 *   - Target Content-Type: a Select populated with ALL schemas for this website
 *     (Step 1 — define the structure / choose the schema)
 *   - Cardinality: one-to-one | one-to-many | many-to-many
 *   - Display field: optional field name used as label in the entry editor
 *
 * Used by both the Create Schema and Edit Schema routes.
 */
import { Form, Input, Select, Switch, Button, Tag, Spin } from 'antd';
import { MinusCircleOutlined, LinkOutlined, PictureOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { schemasApi } from '../../features/schemas/api';
import { FIELD_TYPES, RELATION_TYPES, MEDIA_ASSET_TYPES } from '../../features/schemas/fieldTypes';

interface SchemaFieldRowProps {
    /** Index from Form.List — builds nested field name paths. */
    name: number;
    /** Spread-forwarded props from Form.List (fieldKey, isListField, …). */
    restField: object;
    onRemove: () => void;
    /** Website ID used to fetch the list of available target schemas. */
    websiteId: string;
}

export function SchemaFieldRow({ name, restField, onRemove, websiteId }: SchemaFieldRowProps) {
    const fieldType = Form.useWatch(['definition', name, 'type']);
    const isRelation = fieldType === 'relation';
    const isMedia = fieldType === 'media';

    // Fetch all schemas for this website so the user can pick a target.
    // Only runs when the relation sub-panel is visible.
    const { data: schemas = [], isPending: schemasLoading } = useQuery({
        queryKey: ['schemas', websiteId],
        queryFn: () => schemasApi.getAll(websiteId),
        enabled: isRelation,
        staleTime: 60_000,
    });

    const schemaOptions = schemas.map((s) => ({
        label: (
            <span className="flex items-center gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-gray-400 font-mono">{s.slug}</span>
            </span>
        ),
        value: s.slug,
    }));

    return (
        <div className="bg-app-bg rounded-xl border border-surface-border hover:border-primary/40 transition-colors duration-200 p-3">

            {/* ── Base row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-[1fr_160px_80px_40px] items-start gap-2">
                <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Required' }]}
                    className="mb-0"
                >
                    <Input placeholder="field_name" size="middle" />
                </Form.Item>

                <Form.Item
                    {...restField}
                    name={[name, 'type']}
                    className="mb-0"
                >
                    <Select
                        options={FIELD_TYPES}
                        size="middle"
                        optionRender={(opt) =>
                            opt.value === 'relation' ? (
                                <span className="flex items-center gap-1.5">
                                    <LinkOutlined style={{ color: '#7c3aed' }} />
                                    {opt.label}
                                    <Tag color="purple" style={{ fontSize: 10, marginLeft: 'auto' }}>link</Tag>
                                </span>
                            ) : opt.value === 'media' ? (
                                <span className="flex items-center gap-1.5">
                                    <PictureOutlined style={{ color: '#0ea5e9' }} />
                                    {opt.label}
                                    <Tag color="blue" style={{ fontSize: 10, marginLeft: 'auto' }}>media</Tag>
                                </span>
                            ) : (
                                <span>{opt.label}</span>
                            )
                        }
                    />
                </Form.Item>

                <Form.Item
                    {...restField}
                    name={[name, 'required']}
                    valuePropName="checked"
                    className="mb-0 flex justify-center"
                >
                    <Switch size="small" checkedChildren="Req" unCheckedChildren="Opt" />
                </Form.Item>

                <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={onRemove}
                    className="mt-1"
                    size="small"
                />
            </div>
            {/* ── Media config sub-panel ─────────────────────────────────────────── */}
            {isMedia && (
                <div className="mt-3 pt-3 border-t border-dashed border-sky-200">
                    <p className="text-xs font-medium text-sky-700 mb-3 flex items-center gap-1.5">
                        <PictureOutlined />
                        Media configuration — single asset or multiple assets from the media library
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* ── Asset type ───────────────────────────────────── */}
                        <Form.Item
                            {...restField}
                            name={[name, 'mediaAssetType']}
                            label={
                                <span className="text-xs font-semibold text-gray-600">
                                    Asset selection
                                </span>
                            }
                            initialValue="single"
                            rules={[{ required: true, message: 'Select asset type' }]}
                            className="mb-0"
                        >
                            <Select
                                size="middle"
                                options={MEDIA_ASSET_TYPES.map((m) => ({
                                    label: (
                                        <span>
                                            <span className="font-medium">{m.label}</span>
                                            <span className="text-xs text-gray-400 ml-1">— {m.description}</span>
                                        </span>
                                    ),
                                    value: m.value,
                                }))}
                            />
                        </Form.Item>
                    </div>
                </div>
            )}
            {/* ── Relation config sub-panel ────────────────────────────
                Step 1: define the structure — which schema to link to    */}
            {isRelation && (
                <div className="mt-3 pt-3 border-t border-dashed border-purple-200">
                    <p className="text-xs font-medium text-purple-700 mb-3 flex items-center gap-1.5">
                        <LinkOutlined />
                        Relation configuration — define which Content-Type this field links to
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* ── Target Content-Type (schema dropdown) ──── */}
                        <Form.Item
                            {...restField}
                            name={[name, 'targetSchemaSlug']}
                            label={
                                <span className="text-xs font-semibold text-gray-600">
                                    Target Content-Type
                                </span>
                            }
                            rules={[{ required: true, message: 'Select a target schema' }]}
                            className="mb-0"
                        >
                            <Select
                                placeholder={
                                    schemasLoading ? 'Loading schemas…' : 'Select a Content-Type'
                                }
                                options={schemaOptions}
                                size="middle"
                                showSearch
                                optionFilterProp="value"
                                notFoundContent={
                                    schemasLoading ? (
                                        <Spin size="small" />
                                    ) : (
                                        <span className="text-xs text-gray-400">No schemas found</span>
                                    )
                                }
                            />
                        </Form.Item>

                        {/* ── Cardinality ──────────────────────────────── */}
                        <Form.Item
                            {...restField}
                            name={[name, 'relationType']}
                            label={
                                <span className="text-xs font-semibold text-gray-600">
                                    Cardinality
                                </span>
                            }
                            initialValue="one-to-many"
                            className="mb-0"
                        >
                            <Select
                                size="middle"
                                options={RELATION_TYPES.map((r) => ({
                                    label: (
                                        <span>
                                            <span className="font-medium">{r.label.split('—')[0]}</span>
                                            <span className="text-xs text-gray-400 ml-1">
                                                — {r.value}
                                            </span>
                                        </span>
                                    ),
                                    value: r.value,
                                }))}
                            />
                        </Form.Item>

                        {/* ── Display field ─────────────────────────────── */}
                        <Form.Item
                            {...restField}
                            name={[name, 'labelField']}
                            label={
                                <span className="text-xs font-semibold text-gray-600">
                                    Display field <span className="font-normal text-gray-400">(optional)</span>
                                </span>
                            }
                            className="mb-0"
                        >
                            <Input placeholder="name, title, label…" size="middle" />
                        </Form.Item>
                    </div>
                </div>
            )}
        </div>
    );
}
