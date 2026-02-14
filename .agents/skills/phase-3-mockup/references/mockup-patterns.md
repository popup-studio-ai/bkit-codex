# Mockup Patterns Reference

## Layout Patterns

### Sidebar Layout (Dashboard)
```
+--------+----------------------------+
| Logo   | Breadcrumb    [User Menu]  |
+--------+----------------------------+
| Nav    |                            |
| Item   |   Main Content Area        |
| Item   |                            |
| Item   |   +------+ +------+       |
| Item   |   |Card 1| |Card 2|       |
|        |   +------+ +------+       |
+--------+----------------------------+
```
Best for: Admin panels, dashboards, complex apps.
Mobile: Sidebar becomes hamburger drawer.

### Top Navigation Layout
```
+-----------------------------------+
| Logo  [Nav1] [Nav2] [Nav3] [User] |
+-----------------------------------+
|                                   |
|        Main Content               |
|                                   |
+-----------------------------------+
|           Footer                  |
+-----------------------------------+
```
Best for: Marketing sites, blogs, portfolios.

### Split Layout (Auth Pages)
```
+------------------+----------------+
|                  |                |
|   Brand/Image    |   Login Form   |
|   Illustration   |   [Email]      |
|                  |   [Password]   |
|                  |   [Submit]     |
+------------------+----------------+
```
Best for: Login, register, onboarding.

## Form Patterns

### Single Column Form
```
+-----------------------------+
|  Form Title                 |
|  Label                      |
|  [Input Field          ]    |
|  Label                      |
|  [Input Field          ]    |
|  [Cancel]  [Submit]         |
+-----------------------------+
```

### Multi-Step Form (Wizard)
```
Step 1 --*-- Step 2 --o-- Step 3 --o-- Done

+-----------------------------+
|  Step 1: Basic Info         |
|  [Name]  [Email]            |
|           [Next ->]         |
+-----------------------------+
```

### Inline Edit
```
  Username: John Doe [Edit]
  -> After clicking:
  Username: [John Doe  ] [Save]
```

## List Patterns

### Data Table
```
+----+----------+--------+--------+--------+
|    | Name     | Email  | Role   | Actions|
+----+----------+--------+--------+--------+
| [] | John Doe | j@...  | Admin  | Edit X |
| [] | Jane Doe | j@...  | User   | Edit X |
+----+----------+--------+--------+--------+
|  Showing 1-10 of 50    [< 1 2 3 4 5 >]  |
+------------------------------------------+
```

### Card Grid
```
+----------+ +----------+ +----------+
|  [Image] | |  [Image] | |  [Image] |
|  Title   | |  Title   | |  Title   |
|  Desc... | |  Desc... | |  Desc... |
|  [Action]| |  [Action]| |  [Action]|
+----------+ +----------+ +----------+
```

### List with Filters
```
+-----------------------------------+
| [Search...    ] [Filter v] [+]   |
+-----------------------------------+
| | Item Title          Status  |  |
| | Description...      [Edit]  |  |
+-----------------------------------+
```

## State Patterns

### Empty State
```
+-----------------------------------+
|        [Illustration]             |
|    No items yet                   |
|    Create your first item         |
|    [+ Create Item]                |
+-----------------------------------+
```

### Loading State
```
+-----------------------------------+
| ████████░░░░░░░░░░ (skeleton)     |
| ██████████████░░░░░               |
| ████████░░░░░░░░░░                |
+-----------------------------------+
```

### Error State
```
+-----------------------------------+
|        [Error Icon]               |
|    Something went wrong           |
|    We couldn't load the data      |
|    [Try Again]                    |
+-----------------------------------+
```

## Responsive Breakpoints

| Token | Min Width | Typical Devices |
|-------|----------|-----------------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Grid Column Rules

| Breakpoint | Columns | Sidebar | Content |
|-----------|---------|---------|---------|
| Mobile | 1 | Hidden (drawer) | Full width |
| Tablet | 2 | Collapsed (icons) | Remaining |
| Desktop | 3-4 | Full (240px) | Remaining |

## Navigation Patterns

### Breadcrumb
```
Home > Products > Electronics > Laptop Model X
```

### Tab Navigation
```
[Overview] [Details] [Reviews] [Related]
-------------------------------------
   Active tab content here...
```

### Bottom Navigation (Mobile)
```
+-----------------------------------+
|        App Content                |
+-----------------------------------+
|  Home   Search   Profile          |
+-----------------------------------+
```
