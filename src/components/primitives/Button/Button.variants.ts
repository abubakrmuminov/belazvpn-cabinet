import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base styles — mechanical industrial terminal button
  [
    'inline-flex items-center justify-center gap-2',
    'font-bold uppercase tracking-wider transition-all duration-[80ms]',
    'focus-visible:outline-none focus-visible:ring-0',
    'disabled:pointer-events-none disabled:opacity-45',
    'select-none rounded-none border-2 cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          /* Industrial Yellow — black text for maximum 8:1+ contrast */
          'bg-accent-500 text-on-accent',
          'border-black shadow-[3px_3px_0_0_#000]',
          'hover:bg-accent-400 hover:shadow-[4px_4px_0_0_#000]',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]',
        ],
        secondary: [
          /* Graphite steel panel */
          'bg-dark-800 text-dark-100',
          'border-dark-600 shadow-[3px_3px_0_0_#000]',
          'hover:bg-dark-700 hover:border-dark-400 hover:text-dark-50',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]',
        ],
        ghost: [
          /* Transparent utility button */
          'bg-transparent text-dark-300',
          'border-transparent shadow-none',
          'hover:bg-dark-800 hover:border-dark-600 hover:text-dark-50',
          'active:bg-dark-700',
        ],
        destructive: [
          /* Red alert */
          'bg-error-500/10 text-error-400',
          'border-error-500/40 shadow-[3px_3px_0_0_rgba(0,0,0,0.6)]',
          'hover:bg-error-500/20 hover:border-error-400 hover:text-error-300',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_rgba(0,0,0,0.6)]',
        ],
        outline: [
          /* Bordered secondary */
          'border-dark-600 text-dark-200 bg-transparent',
          'shadow-[2px_2px_0_0_#000]',
          'hover:bg-dark-800 hover:border-dark-400 hover:text-dark-50',
          'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0_0_#000]',
        ],
        'accent-outline': [
          /* Lower-emphasis accent CTA — e.g. "buy another" once one purchase already exists */
          'bg-accent-500/10 text-accent-500',
          'border-black shadow-[2px_2px_0_0_#000]',
          'hover:bg-accent-500/20',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]',
        ],
        link: [
          'bg-transparent text-accent-400 border-transparent shadow-none',
          'hover:text-accent-300 hover:underline',
          'active:text-accent-500',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
