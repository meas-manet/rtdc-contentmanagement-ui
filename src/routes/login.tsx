import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export const Route = createFileRoute('/login')({
    component: LoginPage,
});

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    const mutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            login(data.accessToken);
            navigate({ to: '/websites' });
        },
        onError: () => {
            messageApi.error('Invalid username or password.');
        },
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1748] via-[#1a3580] to-[#213E9A] flex items-center justify-center p-4">
            {contextHolder}
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
                        <span className="text-2xl">⚡</span>
                    </div>
                    <Title level={3} className="!text-white !mb-1">
                        Content Management
                    </Title>
                    <Text className="!text-blue-200 text-sm">Sign in to your admin portal</Text>
                </div>

                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
                    <Form
                        layout="vertical"
                        onFinish={(values) => mutation.mutate(values)}
                        requiredMark={false}
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[{ required: true, message: 'Please enter your username' }]}
                        >
                            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="admin" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="••••••••"
                            />
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={mutation.isPending}
                                className="h-11"
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
