// Wraps an Ant Design Table in the standard card shell used throughout the app.
import { Table } from 'antd';
import type { TableProps } from 'antd';

type TableCardProps<T extends object> = TableProps<T>;

export function TableCard<T extends object>(props: TableCardProps<T>) {
    return (
        <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
            <Table {...props} />
        </div>
    );
}
