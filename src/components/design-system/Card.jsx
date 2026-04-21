import { cn } from '@/lib/utils';

/**
 * Card — ground-elevated surface (brief §1.3: "Cards are NOT glass").
 *
 * Props:
 *   padding: 'none' | 'sm' | 'md' | 'lg' (default 'md' → 16px)
 *   elevated: boolean (default true) — false drops shadow for flat variant
 *   className, children
 */
export default function Card({ padding = 'md', elevated = true, className, children, ...rest }) {
    const paddings = {
        none: '',
        sm: 'p-c-3',
        md: 'p-c-4',
        lg: 'p-c-5',
    };
    return (
        <div
            className={cn(
                'bg-c-ground-elevated border border-c-border-hairline rounded-c-lg',
                elevated && 'shadow-c-sm',
                paddings[padding],
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
}
