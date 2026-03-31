import { App as AntApp } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import {
    CheckCircleFilled,
    CloseCircleFilled,
    InfoCircleFilled,
    ExclamationCircleFilled
} from '@ant-design/icons';
import type { CSSProperties } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export function useAppToast() {
    const { notification } = AntApp.useApp();

    const getPlacement = (pos: ToastPosition): NotificationPlacement => {
        const map: Record<ToastPosition, NotificationPlacement> = {
            'top-left': 'topLeft',
            'top-right': 'topRight',
            'bottom-left': 'bottomLeft',
            'bottom-right': 'bottomRight',
            'center': 'top', // Ant Design handles "top" as centered horizontally
        };
        return map[pos] || 'topRight';
    };

    const typeLabels: Record<ToastType, string> = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
    };

    const notify = (
        description: string,
        type: ToastType = 'info',
        position: ToastPosition = 'top-right',
    ) => {
        const typeConfig = {
            success: { icon: <CheckCircleFilled style={{ color: '#10b981' }} />, bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
            error: { icon: <CloseCircleFilled style={{ color: '#ef4444' }} />, bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
            warning: { icon: <ExclamationCircleFilled style={{ color: '#f59e0b' }} />, bg: '#fffbeb', border: '#fef3c7', text: '#92400e' },
            info: { icon: <InfoCircleFilled style={{ color: '#3b82f6' }} />, bg: '#eff6ff', border: '#dbeafe', text: '#1e40af' },
        };

        const { icon, bg, border, text } = typeConfig[type];

        notification.open({
            message: (
                <div style={{ fontWeight: 600, fontSize: '14px', color: text, lineHeight: '1.4' }}>
                    {typeLabels[type]}
                </div>
            ),
            description: (
                <div style={{ fontSize: '13px', color: text, opacity: 0.8, marginTop: '2px' }}>
                    {description}
                </div>
            ),
            placement: getPlacement(position),
            duration: 4,
            icon,
            closeIcon: <span style={{ color: text, opacity: 0.5 }}>✕</span>,
            // Removed display: flex to prevent breaking AntD internal layout
            style: {
                borderRadius: '12px',
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                padding: '12px',
                maxWidth: '90vw', // Ensures it doesn't bleed off screen on tiny phones
            } as CSSProperties,
        });
    };

    return {
        success: (msg: string, pos?: ToastPosition) => notify(msg, 'success', pos),
        error: (msg: string, pos?: ToastPosition) => notify(msg, 'error', pos),
        warning: (msg: string, pos?: ToastPosition) => notify(msg, 'warning', pos),
        info: (msg: string, pos?: ToastPosition) => notify(msg, 'info', pos),
    };
}