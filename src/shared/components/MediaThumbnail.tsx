/**
 * MediaThumbnail
 *
 * Resolves a media asset ID (or array of IDs) and renders a compact
 * avatar/thumbnail for use inside table cells.
 *
 * - Single ID  → one 40×40 rounded-square thumbnail
 * - Array IDs  → up to 3 thumbnails side-by-side, then an overflow badge
 * - Missing / not an image → fallback icon or first letter of the entry name
 */
import { Avatar, Tooltip } from 'antd';
import { PictureOutlined, FileOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../../features/media/api';

// ── shared styles ─────────────────────────────────────────────────────────────

const AVATAR_SIZE = 40;
const AVATAR_RADIUS = 8;

const baseStyle: React.CSSProperties = {
    borderRadius: AVATAR_RADIUS,
    flexShrink: 0,
};

// ── SingleAssetAvatar — fetches one asset and renders it ──────────────────────

interface SingleAssetAvatarProps {
    assetId: string;
    websiteId: string;
    /** First-letter fallback sourced from the entry name / title field */
    fallbackLetter?: string;
}

function SingleAssetAvatar({ assetId, websiteId, fallbackLetter }: SingleAssetAvatarProps) {
    const { data: asset } = useQuery({
        queryKey: ['media-asset', websiteId, assetId],
        queryFn: () => mediaApi.getById(websiteId, assetId),
        staleTime: 60_000,
    });

    // Still loading or failed to resolve
    if (!asset) {
        return (
            <Avatar
                size={AVATAR_SIZE}
                shape="square"
                style={{ ...baseStyle, backgroundColor: '#f0f0f0', color: '#9ca3af' }}
            >
                {fallbackLetter
                    ? <span style={{ fontSize: 16, fontWeight: 600 }}>{fallbackLetter.toUpperCase()}</span>
                    : <PictureOutlined />}
            </Avatar>
        );
    }

    const isImage = asset.contentType.startsWith('image/');

    return (
        <Tooltip title={asset.fileName} mouseEnterDelay={0.5}>
            {isImage ? (
                <Avatar
                    size={AVATAR_SIZE}
                    shape="square"
                    src={asset.url}
                    style={baseStyle}
                />
            ) : (
                <Avatar
                    size={AVATAR_SIZE}
                    shape="square"
                    style={{ ...baseStyle, backgroundColor: '#f0f0f0', color: '#6b7280' }}
                    icon={<FileOutlined />}
                />
            )}
        </Tooltip>
    );
}

// ── MediaThumbnail — public component ────────────────────────────────────────

export interface MediaThumbnailProps {
    /** Raw value from entry data — single asset id or array of ids */
    value: string | string[] | undefined | null;
    websiteId: string;
    /** Text used to produce the first-letter fallback (e.g. entry name/title) */
    fallbackLabel?: string;
}

export function MediaThumbnail({ value, websiteId, fallbackLabel }: MediaThumbnailProps) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
            <Avatar
                size={AVATAR_SIZE}
                shape="square"
                icon={<PictureOutlined />}
                style={{ ...baseStyle, backgroundColor: '#f5f5f5', color: '#d1d5db' }}
            />
        );
    }

    const idList = Array.isArray(value) ? value : [value];
    const visibleIds = idList.slice(0, 3);
    const overflow = idList.length - visibleIds.length;
    const fallbackLetter = fallbackLabel?.trim()[0];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {visibleIds.map((id) => (
                <SingleAssetAvatar
                    key={id}
                    assetId={id}
                    websiteId={websiteId}
                    fallbackLetter={fallbackLetter}
                />
            ))}
            {overflow > 0 && (
                <Avatar
                    size={AVATAR_SIZE}
                    shape="square"
                    style={{ ...baseStyle, backgroundColor: '#f0f0f0', color: '#6b7280', fontSize: 11, fontWeight: 600 }}
                >
                    +{overflow}
                </Avatar>
            )}
        </div>
    );
}
