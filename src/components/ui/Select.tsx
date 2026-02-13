import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export const Select = RadixSelect.Root;

export const SelectValue = RadixSelect.Value;

interface TriggerProps extends React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> {
  className?: string;
}

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  TriggerProps
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={clsx(
      'inline-flex items-center justify-between gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm',
      'hover:border-slate-300 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20',
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon>
      <ChevronDown className="h-4 w-4 text-slate-500" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={clsx(
        'z-50 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg',
        className
      )}
      {...props}
    >
      <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={clsx(
      'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm text-slate-700 outline-none',
      'focus:bg-slate-100 focus:text-slate-900',
      className
    )}
    {...props}
  >
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <Check className="h-3 w-3" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = 'SelectItem';

