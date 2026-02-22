# Plan Plus Process Guide

## Question Templates by Language

### Intent Discovery Questions

| Phase | EN | KO |
|-------|----|----|
| Problem | "What is the core problem this feature solves?" | "이 기능이 해결하는 핵심 문제는 무엇인가요?" |
| Users | "Who are the target users?" | "대상 사용자는 누구인가요?" |
| Success | "What does success look like?" | "성공의 기준은 무엇인가요?" |
| Constraints | "What constraints exist?" | "어떤 제약조건이 있나요?" |

### Alternatives Template

```
## Approach {N}: "{Name}"

| Aspect | Details |
|--------|---------|
| **Summary** | ... |
| **Pros** | ... |
| **Cons** | ... |
| **Effort** | Low / Medium / High |
| **Best For** | ... |
```

### YAGNI Checklist Format

```
- [x] Must Have: {feature description}
- [ ] Nice to Have: {feature description} -> DEFER to v{next}
- [-] Won't Do: {feature description} -> {reason}
```

## Integration with PDCA

Plan Plus output feeds directly into:
- `$pdca design {feature}` for design document creation
- `bkit_pdca_plan` MCP tool for template generation
- `.pdca-status.json` for state tracking

## Anti-Patterns

1. **Skipping Intent Discovery**: Jumping to solutions without understanding the problem
2. **Single Approach**: Not exploring alternatives leads to suboptimal solutions
3. **Feature Creep**: Not applying YAGNI leads to bloated scope
4. **Big Bang Validation**: Reviewing the entire plan at once misses details
5. **Code Before Plan**: Writing code before the plan is approved wastes effort
