import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50', {variants:{variant:{default:'bg-sky-500 text-slate-950 hover:bg-sky-400',outline:'border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]',ghost:'hover:bg-[var(--hover)]',destructive:'bg-red-500 text-white hover:bg-red-600'},size:{default:'h-10 px-4 py-2',sm:'h-8 px-3 text-xs',icon:'h-9 w-9'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export const Button = React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:'button';return <Comp className={cn(buttonVariants({variant,size,className}))} ref={ref} {...props}/>});
Button.displayName='Button';
