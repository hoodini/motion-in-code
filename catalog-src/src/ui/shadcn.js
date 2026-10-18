// shadcn/ui components (new-york style), adapted from https://ui.shadcn.com (MIT). Two changes for video:
// 1) every `transition-*` class is removed, because CSS transitions run on the wall clock, not on t;
// 2) moving parts (switch thumb, progress bar) take their position from a prop, so t drives them.
import { EN, T, DIR } from './i18n.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as TabsP from '@radix-ui/react-tabs';
import * as SwitchP from '@radix-ui/react-switch';
import * as SliderP from '@radix-ui/react-slider';
import * as ProgressP from '@radix-ui/react-progress';
export const cn = (...a) => twMerge(clsx(a));

export const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', {
  variants: {
    variant: { default: 'bg-primary text-primary-foreground shadow', accent: 'bg-accent text-accent-foreground shadow', outline: 'border border-input bg-background shadow-sm', secondary: 'bg-secondary text-secondary-foreground shadow-sm', ghost: '' },
    size: { default: 'h-9 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs', lg: 'h-11 rounded-md px-7 text-base', icon: 'h-9 w-9' }
  },
  defaultVariants: { variant: 'default', size: 'default' }
});
export const Button = React.forwardRef(({ className, variant, size, ...p }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...p} />);

export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...p} />;
export const CardHeader = ({ className, ...p }) => <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <div className={cn('font-semibold leading-none tracking-tight', className)} {...p} />;
export const CardDescription = ({ className, ...p }) => <div className={cn('text-sm text-muted-foreground', className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn('p-6 pt-0', className)} {...p} />;

export const badgeVariants = cva('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold focus:outline-none', {
  variants: { variant: { default: 'border-transparent bg-primary text-primary-foreground shadow', accent: 'border-transparent bg-accent text-accent-foreground shadow', secondary: 'border-transparent bg-secondary text-secondary-foreground', outline: 'text-foreground' } },
  defaultVariants: { variant: 'default' }
});
export const Badge = ({ className, variant, ...p }) => <div className={cn(badgeVariants({ variant }), className)} {...p} />;

export const Input = React.forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)} {...p} />);

export const Progress = ({ className, value = 0, dir = DIR, ...p }) => (
  <ProgressP.Root className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)} value={value} {...p}>
    <ProgressP.Indicator className="h-full w-full flex-1 bg-primary" style={{ transform: `translateX(${dir === 'rtl' ? '' : '-'}${100 - value}%)` }} />
  </ProgressP.Root>
);

export const Tabs = TabsP.Root;
export const TabsList = ({ className, ...p }) => <TabsP.List className={cn('inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)} {...p} />;
export const TabsTrigger = ({ className, ...p }) => <TabsP.Trigger className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium focus-visible:outline-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow', className)} {...p} />;
export const TabsContent = ({ className, ...p }) => <TabsP.Content className={cn('mt-2 focus-visible:outline-none', className)} {...p} />;

/** pos: 0 = off, 1 = on (can overshoot a little, because it comes from a spring) */
export const Switch = ({ className, pos = 0, dir = DIR, ...p }) => (
  <SwitchP.Root dir={dir} checked={pos > 0.5} className={cn('peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm focus-visible:outline-none', className)}
    style={{ background: pos > 0.5 ? 'hsl(var(--primary))' : 'hsl(var(--input))' }} {...p}>
    <SwitchP.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0" style={{ transform: `translateX(${(dir === 'rtl' ? -1 : 1) * 16 * pos}px)` }} />
  </SwitchP.Root>
);

export const Slider = ({ className, ...p }) => (
  <SliderP.Root className={cn('relative flex w-full touch-none select-none items-center', className)} {...p}>
    <SliderP.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20"><SliderP.Range className="absolute h-full bg-primary" /></SliderP.Track>
    <SliderP.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow focus-visible:outline-none" />
  </SliderP.Root>
);

export const Alert = ({ className, ...p }) => <div role="alert" className={cn('relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:right-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pr-7', className)} {...p} />;
export const AlertTitle = ({ className, ...p }) => <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...p} />;
export const AlertDescription = ({ className, ...p }) => <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...p} />;
