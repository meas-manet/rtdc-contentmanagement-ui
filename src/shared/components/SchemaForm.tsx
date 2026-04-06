// Universal schema-driven form engine
import { Form, Input, InputNumber, Switch, DatePicker, Select } from 'antd';
import { RichTextEditor } from './RichTextEditor';
import { MediaPickerField } from './MediaPickerField';
import type { SchemaFieldDto } from '../../features/schemas/types';
interface SchemaFormProps {
    definition: SchemaFieldDto[];
    /** Ant Design Form instance — caller controls open/submit */
    disabled?: boolean;
    /** Required to load the media library for media-type fields */
    websiteId?: string;
}

export function SchemaForm({ definition, disabled, websiteId }: SchemaFormProps) {
    return (
        <>
            {definition.filter((f) => f.type !== 'relation').map((field) => (
                <Form.Item
                    key={field.name}
                    name={field.name}
                    label={
                        <span className="capitalize font-medium">
                            {field.name.replace(/_/g, ' ')}
                        </span>
                    }
                    rules={[
                        ...(field.required ? [{ required: true }] : []),
                        ...(field.type === 'slug'
                            ? [{ pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug must be lowercase alphanumeric with hyphens (e.g. my-entry).' }]
                            : []),
                    ]}
                    valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
                    getValueFromEvent={
                        field.type === 'richtext' ? (html: string) => html : undefined
                    }
                    extra={field.type === 'slug' ? 'Used for slug-based API lookups. Must be unique per schema and locale.' : undefined}
                >
                    {renderInput(field, disabled, websiteId)}
                </Form.Item>
            ))}
        </>
    );
}

function renderInput(field: SchemaFieldDto, disabled?: boolean, websiteId?: string) {
    switch (field.type) {
        case 'slug':
            return (
                <Input
                    placeholder="e.g. my-entry-title"
                    disabled={disabled}
                    onChange={(e) => {
                        // Auto-format: lowercase, spaces → hyphens, strip invalid chars
                        e.target.value = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')
                            .replace(/-+/g, '-');
                    }}
                />
            );

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

        case 'media':
            return (
                <MediaPickerField
                    websiteId={websiteId ?? ''}
                    assetType={field.mediaAssetType ?? 'single'}
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
