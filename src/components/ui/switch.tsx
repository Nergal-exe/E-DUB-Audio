import * as React from 'react';
import * as Primitive from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';
export const Switch=React.forwardRef<React.ElementRef<typeof Primitive.Root>,React.ComponentPropsWithoutRef<typeof Primitive.Root>>(({className,...props},ref)=><Primitive.Root ref={ref} className={cn('inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-[var(--border)] transition-colors data-[state=checked]:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',className)} {...props}><Primitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"/></Primitive.Root>);
Switch.displayName='Switch';
