# {feature} Design Document (Starter)

> **Summary**: {One-line description}
>
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Level**: Starter

---

## 1. What Are We Building?

{Simple description of what this feature does}

## 2. Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | / | Main landing page |
| About | /about | About page |
| {page} | /{path} | {description} |

## 3. Layout

```
+------------------------------------+
|  Navigation Bar                    |
+------------------------------------+
|                                    |
|  Page Content                      |
|                                    |
+------------------------------------+
|  Footer                            |
+------------------------------------+
```

## 4. Components

| Component | What It Does |
|-----------|-------------|
| Header | Navigation bar with logo and links |
| Footer | Copyright and social links |
| {Component} | {Description} |

## 5. Styling

- Framework: Tailwind CSS / Plain CSS
- Colors: {primary color}, {secondary color}
- Font: {font family}
- Mobile-first responsive design

## 6. Files to Create

```
src/
  app/
    layout.tsx      # Common layout
    page.tsx        # Home page
    {page}/
      page.tsx      # Additional pages
  components/
    Header.tsx
    Footer.tsx
```

## 7. Deployment

- Platform: Vercel / GitHub Pages
- Domain: {custom domain if any}

## 8. Checklist

- [ ] All pages created
- [ ] Responsive on mobile
- [ ] Images optimized
- [ ] Links working
- [ ] Deployed and accessible

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
