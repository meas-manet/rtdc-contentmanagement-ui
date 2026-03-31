// Global delete confirmation hook — opens a Modal.confirm with loading state.
// Usage:
//   const deleteConfirm = useDeleteConfirm();
//   deleteConfirm({ title: 'Delete entry?', onConfirm: () => mutation.mutateAsync(id) });
import { App, Typography } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

interface DeleteConfirmOptions {
    /** Bold heading of the confirmation dialog */
    title: string;
    /** Optional descriptive text below the title */
    description?: string;
    /** Label for the confirm button. Defaults to "Delete". */
    okText?: string;
    /** Called when the user clicks the confirm button. Should return a Promise (e.g. mutation.mutateAsync). */
    onConfirm: () => Promise<unknown> | void;
}

export function useDeleteConfirm() {
    const { modal } = App.useApp();

    return ({ title, description, okText = 'Delete', onConfirm }: DeleteConfirmOptions) => {
        modal.confirm({
            title: (
                <span className="font-semibold text-gray-900">{title}</span>
            ),
            content: description ? (
                <Text type="secondary" className="text-sm">
                    {description}
                </Text>
            ) : undefined,
            icon: (
                <ExclamationCircleFilled style={{ color: '#dc2626' }} />
            ),
            okText,
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: {
                danger: true,
                className: 'font-semibold',
            },
            cancelButtonProps: {
                className: 'font-semibold',
            },
            centered: true,
            onOk: onConfirm,
            styles: {
                body: {
                    padding: '8px 0 4px',
                },
            },
        });
    };
}
