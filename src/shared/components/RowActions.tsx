// Edit + Delete icon-button pair used in table action columns.
// The delete button now calls onDelete directly — callers use useDeleteConfirm()
// to show the global Modal.confirm before calling onDelete.
import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface RowActionsProps {
    onEdit: () => void;
    onDelete: () => void;
    deleteLoading?: boolean;
    editTooltip?: string;
    deleteTooltip?: string;
}

export function RowActions({
    onEdit,
    onDelete,
    deleteLoading = false,
    editTooltip = 'Edit',
    deleteTooltip = 'Delete',
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
            <Tooltip title={deleteTooltip}>
                <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteLoading}
                    onClick={onDelete}
                />
            </Tooltip>
        </Space>
    );
}
