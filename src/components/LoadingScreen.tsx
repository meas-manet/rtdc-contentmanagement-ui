// Full-screen centered spinner used while primary data is loading.
import { Spin } from 'antd';

export function LoadingScreen() {
    return (
        <div className="flex items-center justify-center h-64">
            <Spin size="large" />
        </div>
    );
}
