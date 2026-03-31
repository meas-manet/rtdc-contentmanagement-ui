/**
 * RelationManager
 *
 * Entry-level component — Step 2 of the Strapi-style relation flow.
 * Once a schema has a relation field configured, this component lets
 * the editor select specific records from the target Content-Type.
 *
 * UX per relationType:
 *   one-to-one   → single searchable Select; selecting replaces any existing link.
 *   one-to-many  → multi searchable Select; tag list below shows linked items.
 *   many-to-many → multi searchable Select; tag cloud shows linked items.
 *
 * The Select fetches ALL entries from the target schema (up to 100) and
 * filters out already-linked entries so the user only sees valid choices.
 * Selecting an option immediately fires linkMutation (optimistic update).
 * Each linked item has an × button that fires unlinkMutation (optimistic).
 */
import { useMemo } from 'react';
import {
    Avatar,
    List,
    Select,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd';
import { LinkOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../features/entries/api';
import type { RelationType } from '../../features/relations/types';
import { useRelations } from '../../features/relations/useRelations';
import { useAppToast } from '../hooks/useAppToast';

const { Text } = Typography;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabel(
    data: Record<string, unknown>,
    fallbackId: string,
    labelField?: string,
): string {
    if (labelField && typeof data[labelField] === 'string') {
        return data[labelField] as string;
    }
    for (const f of ['name', 'title', 'label', 'heading', 'slug']) {
        if (typeof data[f] === 'string' && (data[f] as string).length > 0) {
            return data[f] as string;
        }
    }
    return fallbackId.slice(0, 8) + '…';
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RelationManagerProps {
    siteSlug: string;
    parentSchemaSlug: string;
    parentId: string;
    apiKey: string;
    /** Field name used as the relation key, e.g. "authors", "tags". */
    relationName: string;
    relationType: RelationType;
    /** Slug of the schema whose entries appear in the Select. */
    targetSchemaSlug: string;
    /** Which field inside the child entry's data to use as the option label. */
    labelField?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RelationManager({
    siteSlug,
    parentSchemaSlug,
    parentId,
    apiKey,
    relationName,
    relationType,
    targetSchemaSlug,
    labelField,
}: RelationManagerProps) {
    const toast = useAppToast();
    const isMulti = relationType !== 'one-to-one';

    const { query: relationsQuery, linkMutation, unlinkMutation } = useRelations(
        siteSlug,
        parentSchemaSlug,
        parentId,
        apiKey,
        relationName,
    );

    const linked = useMemo(() => relationsQuery.data ?? [], [relationsQuery.data]);
    const linkedChildIds = useMemo(() => new Set(linked.map((r) => r.childId)), [linked]);

    // ── Step 2: fetch all entries from the target Content-Type ──────────────
    const { data: targetPage, isPending: targetLoading } = useQuery({
        queryKey: ['relation-candidates', siteSlug, targetSchemaSlug],
        queryFn: () =>
            contentApi.getEntries(siteSlug, targetSchemaSlug, apiKey, {
                pageSize: 100,
                locale: 'en',
            }),
        enabled: Boolean(siteSlug && targetSchemaSlug),
        staleTime: 30_000,
    });

    // Build Select options — exclude already-linked entries
    const selectOptions = useMemo(() => {
        return (targetPage?.data ?? [])
            .filter((e) => !linkedChildIds.has(e.id))
            .map((e) => ({
                label: getLabel(e.data as Record<string, unknown>, e.id, labelField),
                value: e.id,
            }));
    }, [targetPage, linkedChildIds, labelField]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleSelect = (childId: string) => {
        // one-to-one: atomically replace — unlink current first, then link new
        if (!isMulti && linked.length > 0) {
            unlinkMutation.mutate(linked[0].id, {
                onSuccess: () => doLink(childId),
                onError: () => toast.error('Failed to replace the linked entry.'),
            });
        } else {
            doLink(childId);
        }
    };

    const doLink = (childId: string) => {
        linkMutation.mutate(
            { childId, relationType, relationName },
            { onError: () => toast.error('Failed to link entry. Please try again.') },
        );
    };

    const handleUnlink = (relationId: string) => {
        unlinkMutation.mutate(relationId, {
            onError: () => toast.error('Failed to unlink entry. Please try again.'),
        });
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (relationsQuery.isPending) {
        return (
            <div className="flex justify-center py-4">
                <Spin size="small" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <LinkOutlined style={{ color: '#7c3aed', fontSize: 13 }} />
                <Text strong className="capitalize" style={{ fontSize: 13 }}>
                    {relationName.replace(/_/g, ' ')}
                </Text>
                <Tag
                    color="purple"
                    style={{ fontSize: 10, margin: 0 }}
                >
                    {relationType}
                </Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                    → {targetSchemaSlug}
                </Text>
            </div>

            {/* ── Step 2: Searchable Select to pick entries ──────────
                The dropdown lists real records from the target schema.
                Selecting one immediately creates the formal link/join. */}
            <Select
                placeholder={
                    targetLoading
                        ? 'Loading entries…'
                        : `Search ${targetSchemaSlug} entries to link…`
                }
                showSearch
                filterOption={(input, opt) =>
                    String(opt?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                }
                options={selectOptions}
                value={null}
                onSelect={(childId: string | null) => childId && handleSelect(childId)}
                loading={targetLoading || linkMutation.isPending}
                disabled={
                    (!isMulti && linked.length > 0 && !unlinkMutation.isPending) ||
                    linkMutation.isPending
                }
                style={{ width: '100%' }}
                size="middle"
                notFoundContent={
                    targetLoading ? (
                        <Spin size="small" />
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {selectOptions.length === 0 && linked.length > 0
                                ? 'All available entries are already linked.'
                                : `No ${targetSchemaSlug} entries found.`}
                        </Text>
                    )
                }
            />

            {/* one-to-one hint */}
            {!isMulti && linked.length > 0 && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    Unlink the current entry first to select a different one.
                </Text>
            )}

            {/* ── Linked items display ────────────────────────────── */}
            {linked.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    {relationType === 'many-to-many' ? (
                        /* Tag cloud for N:N */
                        <Space size={[6, 8]} wrap>
                            {linked.map((r) => (
                                <Tag
                                    key={r.id}
                                    closable
                                    color="blue"
                                    onClose={(e) => { e.preventDefault(); handleUnlink(r.id); }}
                                    icon={<LinkOutlined />}
                                >
                                    {getLabel(r.childData, r.childId, labelField)}
                                </Tag>
                            ))}
                        </Space>
                    ) : (
                        /* List rows for 1:1 and 1:N */
                        <List
                            size="small"
                            dataSource={linked}
                            renderItem={(r) => {
                                const label = getLabel(r.childData, r.childId, labelField);
                                return (
                                    <List.Item
                                        style={{ paddingLeft: 0, paddingRight: 0 }}
                                        actions={[
                                            <Tag
                                                key="unlink"
                                                closable
                                                color="default"
                                                onClose={(e) => {
                                                    e.preventDefault();
                                                    handleUnlink(r.id);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                unlink
                                            </Tag>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} size={24} />}
                                            title={<Text style={{ fontSize: 13 }}>{label}</Text>}
                                            description={
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {r.childId.slice(0, 8)}… ·{' '}
                                                    <span
                                                        style={{
                                                            color: r.childStatus === 'published'
                                                                ? '#52c41a'
                                                                : '#faad14',
                                                        }}
                                                    >
                                                        {r.childStatus}
                                                    </span>
                                                </Text>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
