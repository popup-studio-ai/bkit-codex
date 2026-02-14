---
name: starter
description: |
  Static web development guide for beginners. Covers HTML/CSS/JavaScript
  and Next.js App Router basics. Project initialization with "init starter".
  Triggers: static website, portfolio, landing page, HTML CSS, beginner,
  정적 웹, 포트폴리오, 초보자, 静的サイト, 初心者, 静态网站, 初学者,
  sitio web estático, site statique, statische Website, sito web statico
  Do NOT use for: fullstack apps (use $dynamic), enterprise (use $enterprise).
---

# Beginner (Starter) Skill

> Static web development for beginners and non-developers.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization | `$starter init my-portfolio` |
| `guide` | Display development guide | `$starter guide` |
| `help` | Beginner help | `$starter help` |

### init (Project Initialization)

1. Create project directory structure (HTML/CSS/JS or Next.js)
2. Generate package.json (when Next.js selected)
3. Create AGENTS.md (Level: Starter specified)
4. Create docs/ folder structure (for PDCA documents)
5. Initialize .pdca-status.json

### guide (Development Guide)

- Analyze current project state
- Suggest next steps appropriate for Starter level
- Phase 1-3 focused Pipeline guide (1 -> 2 -> 3 -> 6 -> 9)

### help (Beginner Help)

- Explain HTML/CSS/JS basic concepts
- Answer frequently asked questions
- Provide example code

## Target Audience

- Those learning programming for the first time
- Those who want to create a simple website
- Those who need a portfolio site

## Tech Stack

### Option A: Pure HTML/CSS/JS (For Complete Beginners)

```
HTML5        -> Web page structure
CSS3         -> Styling
JavaScript   -> Dynamic features (optional)
```

### Option B: Next.js (Using Framework)

```
Next.js 14+  -> React-based framework
Tailwind CSS -> Utility CSS
TypeScript   -> Type safety (optional)
```

### Language Tier Guidance

> Recommended: Tier 1 languages only (Python, TypeScript, JavaScript)

| Tier | Allowed | Reason |
|------|---------|--------|
| Tier 1 | Yes | Full AI support, Vibe Coding optimized |
| Tier 2 | Limited | Consider Dynamic level instead |
| Tier 3-4 | No | Upgrade to Dynamic/Enterprise |

## Project Structure

### Option A: HTML/CSS/JS

```
project/
├── index.html          # Main page
├── about.html          # About page
├── css/
│   └── style.css       # Styles
├── js/
│   └── main.js         # JavaScript
├── images/             # Image files
├── docs/               # PDCA documents
│   ├── 01-plan/
│   └── 02-design/
└── README.md
```

### Option B: Next.js

```
project/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Common layout
│   │   ├── page.tsx        # Main page
│   │   └── about/
│   │       └── page.tsx    # About page
│   └── components/         # Reusable components
├── public/                 # Static files
├── docs/                   # PDCA documents
├── package.json
├── tailwind.config.js
└── README.md
```

## Core Concepts

### HTML (Web Page Structure)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>Header</header>
    <main>Main content</main>
    <footer>Footer</footer>
</body>
</html>
```

### CSS (Styling)

```css
body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

@media (max-width: 768px) {
    .container { padding: 10px; }
}
```

### Next.js App Router

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Welcome!</h1>
    </main>
  );
}
```

## Deployment Methods

### GitHub Pages (Free)

1. Create GitHub repository
2. Push code
3. Settings -> Pages -> Source: main branch
4. Access at https://username.github.io/repo-name

### Vercel (Recommended for Next.js)

1. Sign up at vercel.com (GitHub integration)
2. "New Project" -> Select repository
3. Click "Deploy"

## Limitations

- No login/registration (requires server)
- No data storage (requires database)
- No admin pages (requires backend)
- No payment features (requires backend)

## When to Upgrade

Move to **Dynamic Level** ($dynamic) if you need:

- Login functionality
- Data storage
- Admin page
- User communication features

## Pipeline Flow (Starter)

```
Phase 1 -> 2 -> 3 -> 6(static) -> 9
```

Skip API (Phase 4), Design System (Phase 5 optional), SEO only in Phase 7.

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Image not showing | Check path (`./images/photo.jpg`) |
| CSS not applied | Check link tag path |
| Page navigation not working | Check href path (`./about.html`) |
| Broken on mobile | Check `<meta name="viewport">` tag |
