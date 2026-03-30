// Monospace pill badge used to display code values such as locale codes and slugs.
interface CodeBadgeProps {
    children: string;
}

export function CodeBadge({ children }: CodeBadgeProps) {
    return (
        <code className="text-xs bg-primary-light rounded px-2 py-1 text-primary font-mono">
            {children}
        </code>
    );
}
