# Design System Guide Reference

## Component Architecture

### File Structure per Component
```
src/components/ui/
├── Button/
│   ├── Button.tsx          # Component implementation
│   ├── Button.test.tsx     # Tests
│   ├── Button.stories.tsx  # Storybook stories
│   └── index.ts            # Barrel export
├── Input/
│   ├── Input.tsx
│   └── index.ts
└── index.ts                # Root barrel export
```

### Component Template
```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover',
        secondary: 'bg-secondary text-white hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-gray-50',
        ghost: 'bg-transparent hover:bg-gray-100',
        danger: 'bg-error text-white hover:bg-error/80',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ variant, size, loading, className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={loading} {...props}>
      {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
      {children}
    </button>
  );
}
```

## Design Token System

### Token Layers
```
Global Tokens (raw values)
  -> Alias Tokens (semantic meaning)
    -> Component Tokens (specific usage)

Example:
  blue-500: #3B82F6           (global)
  color-primary: blue-500      (alias)
  button-bg-primary: primary   (component)
```

### Dark Mode Strategy
```css
/* Light mode (default) */
:root {
  --color-bg: #FFFFFF;
  --color-text: #111827;
  --color-border: #E5E7EB;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg: #1F2937;
  --color-text: #F9FAFB;
  --color-border: #374151;
}
```

### Tailwind Dark Mode
```typescript
// Use class-based dark mode
module.exports = {
  darkMode: 'class',
  // ...
};

// Usage in components
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

## Core Components Reference

### Input Component
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          error ? 'border-error' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
```

### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6' };
  return (
    <div className={cn('rounded-lg border border-border bg-white shadow-sm', paddingMap[padding], className)}>
      {children}
    </div>
  );
}
```

### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
```

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-0 | 0 | Reset |
| space-1 | 4px (0.25rem) | Tight elements |
| space-2 | 8px (0.5rem) | Related elements |
| space-3 | 12px (0.75rem) | Standard gap |
| space-4 | 16px (1rem) | Section padding |
| space-6 | 24px (1.5rem) | Card padding |
| space-8 | 32px (2rem) | Section spacing |
| space-12 | 48px (3rem) | Large spacing |
| space-16 | 64px (4rem) | Page padding |

## Typography Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| text-xs | 12px | 400 | 16px | Labels, captions |
| text-sm | 14px | 400 | 20px | Body small, table cells |
| text-base | 16px | 400 | 24px | Body text |
| text-lg | 18px | 500 | 28px | Subheadings |
| text-xl | 20px | 600 | 28px | Card titles |
| text-2xl | 24px | 700 | 32px | Section headings |
| text-3xl | 30px | 700 | 36px | Page headings |
| text-4xl | 36px | 800 | 40px | Hero headings |

## Icon System

Recommended: Lucide React (tree-shakeable, consistent style)

```typescript
import { Search, User, Settings, ChevronRight } from 'lucide-react';

// Standard sizes
<Search className="h-4 w-4" />  // Small (inline)
<Search className="h-5 w-5" />  // Medium (default)
<Search className="h-6 w-6" />  // Large (standalone)
```
