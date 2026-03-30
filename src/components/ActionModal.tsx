// Standard create/edit modal that submits a connected Ant Design Form.
import { Modal } from 'antd';
import type { ReactNode } from 'react';

interface ActionModalProps {
    title: string;
    open: boolean;
    onCancel: () => void;
    onOk: () => void;
    okText?: string;
    confirmLoading?: boolean;
    width?: number;
    children: ReactNode;
}

export function ActionModal({
    title,
    open,
    onCancel,
    onOk,
    okText = 'Save',
    confirmLoading = false,
    width = 520,
    children,
}: ActionModalProps) {
    return (
        <Modal
            title={title}
            open={open}
            onCancel={onCancel}
            onOk={onOk}
            okText={okText}
            confirmLoading={confirmLoading}
            destroyOnHidden
            width={width}
        >
            <div className="mt-4">{children}</div>
        </Modal>
    );
}
