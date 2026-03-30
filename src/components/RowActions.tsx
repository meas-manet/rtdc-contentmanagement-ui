// Edit + Delete icon-button pair used in table action columns.
import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface RowActionsProps {
    onEdit: () => void;
    onDelete: () => void;
    deleteConfirmTitle?: string;
    deleteConfirmDescription?: string;
    editTooltip?: string;
}

export function RowActions({
    onEdit,
    onDelete,
    deleteConfirmTitle = 'Delete this item?',
    deleteConfirmDescription,
    editTooltip = 'Edit',
}: RowActionsProps) {
    return (
        <Space size={4}>
            <Tooltip title={editTooltip}>
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onEdit}
                />
            </Tooltip>
            <Popconfirm
                title={deleteConfirmTitle}
                description={deleteConfirmDescription}
                onConfirm={onDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
        </Space>
    );
}
