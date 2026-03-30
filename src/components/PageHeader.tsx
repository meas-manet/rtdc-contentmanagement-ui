// Reusable page-level header: title, subtitle, and an optional right-hand action area.
import { Typography } from 'antd';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
                <Title level={2} className="mb-0! font-bold! text-gray-900!">
                    {title}
                </Title>
                {subtitle && (
                    <Text className="text-muted! text-sm">{subtitle}</Text>
                )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
