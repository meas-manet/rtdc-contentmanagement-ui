// Universal schema-driven form engine
import { Form, Input, InputNumber, Switch, DatePicker, Select } from 'antd';
import { RichTextEditor } from './RichTextEditor';
import type { SchemaFieldDto } from '../../features/schemas/types';

interface SchemaFormProps {
    definition: SchemaFieldDto[];
    /** Ant Design Form instance — caller controls open/submit */
    disabled?: boolean;
}

export function SchemaForm({ definition, disabled }: SchemaFormProps) {
    return (
        <>
            {definition.map((field) => (
                <Form.Item
                    key={field.name}
                    name={field.name}
                    label={
                        <span className="capitalize font-medium">
                            {field.name.replace(/_/g, ' ')}
                        </span>
                    }
                    rules={field.required ? [{ required: true }] : []}
                    valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
                    getValueFromEvent={
                        field.type === 'richtext' ? (html: string) => html : undefined
                    }
                >
                    {renderInput(field, disabled)}
                </Form.Item>
            ))}
        </>
    );
}

function renderInput(field: SchemaFieldDto, disabled?: boolean) {
    switch (field.type) {
        case 'richtext':
            return <RichTextEditor placeholder={`Enter ${field.name}…`} />;

        case 'number':
            return <InputNumber className="w-full" disabled={disabled} />;

        case 'boolean':
            return <Switch disabled={disabled} />;

        case 'date':
            return <DatePicker className="w-full" disabled={disabled} />;

        case 'array':
            return (
                <Select
                    mode="tags"
                    className="w-full"
                    placeholder="Type and press Enter to add items"
                    disabled={disabled}
                />
            );

        case 'object':
            return (
                <Input.TextArea
                    rows={4}
                    placeholder='{ "key": "value" }'
                    disabled={disabled}
                />
            );

        default:
            return (
                <Input
                    placeholder={field.defaultValue ?? `Enter ${field.name}…`}
                    disabled={disabled}
                />
            );
    }
}
