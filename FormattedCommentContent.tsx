import { Fragment, ReactNode } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

/** Splits text and turns URLs into clickable links; preserves newlines. */
function linkifyText(text: string): ReactNode[] {
    if (!text.trim()) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
            <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tmprimary hover:underline inline-flex items-center gap-1 break-all"
            >
                {part}
                <ExternalLink size={12} className="flex-shrink-0" />
            </a>
        ) : (
            <Fragment key={i}>{part}</Fragment>
        )
    );
}

/** Extracts inspection metadata JSON from content if present. */
function extractInspectionMetadata(content: string): { before: string; metadata: Record<string, unknown> | null; after: string } {
    const label = 'Inspection metadata:';
    const idx = content.indexOf(label);
    if (idx === -1) return { before: content, metadata: null, after: '' };
    const afterLabel = content.slice(idx + label.length);
    const braceStart = afterLabel.indexOf('{');
    if (braceStart === -1) return { before: content.slice(0, idx), metadata: null, after: afterLabel };
    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < afterLabel.length; i++) {
        if (afterLabel[i] === '{') depth++;
        if (afterLabel[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i + 1;
                break;
            }
        }
    }
    const jsonStr = afterLabel.slice(braceStart, end);
    const before = content.slice(0, idx).trimEnd();
    const after = afterLabel.slice(end).trimStart();
    let metadata: Record<string, unknown> | null = null;
    try {
        metadata = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
        metadata = null;
    }
    return { before, metadata, after };
}

/** Renders comment content with readable inspection metadata and clickable links. */
export default function FormattedCommentContent({ content }: { content: string }) {
    const safeContent = content != null ? String(content) : '';
    const { before, metadata, after } = extractInspectionMetadata(safeContent);
    const hasMetadata = metadata && Object.keys(metadata).length > 0;
    const labelMap: Record<string, string> = {
        good: 'Good condition',
        critical: 'Critical',
        'needs-repair': 'Needs repair',
        total_items: 'Total items',
        inspection_type: 'Type',
    };

    return (
        <div className="text-sm text-gray-700 whitespace-pre-line space-y-2">
            {before && (
                <span className="block">{linkifyText(before)}</span>
            )}
            {hasMetadata && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mt-2">
                    <div className="flex items-center gap-2 text-gray-600 font-medium mb-2">
                        <FileText size={14} />
                        Inspection summary
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {Object.entries(metadata).map(([key, value]) => (
                            <Fragment key={key}>
                                <dt className="text-gray-500 capitalize">
                                    {labelMap[key] || key.replace(/-/g, ' ')}
                                </dt>
                                <dd className="text-gray-900 font-medium">
                                    {String(value)}
                                </dd>
                            </Fragment>
                        ))}
                    </dl>
                </div>
            )}
            {after && (
                <span className="block">{linkifyText(after)}</span>
            )}
        </div>
    );
}
