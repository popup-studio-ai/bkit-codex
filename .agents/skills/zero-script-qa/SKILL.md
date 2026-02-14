---
name: zero-script-qa
description: |
  Zero Script QA methodology: log-based testing without writing test scripts.
  Uses Docker logs, curl commands, and runtime verification for quality assurance.
  Triggers: zero script qa, log-based testing, docker logs, QA, test without scripts,
  제로 스크립트 QA, 로그 기반 테스트, ゼロスクリプトQA, ログベーステスト,
  零脚本QA, 日志测试, QA sin scripts, QA sans script, skriptloses QA
  Do NOT use for: unit testing frameworks (use standard test tools), deployment (use $phase-9-deployment).
---

# Zero Script QA Skill

> Quality assurance through logs and runtime verification, no test scripts needed.

## What is Zero Script QA?

Zero Script QA verifies application quality by analyzing runtime behavior through Docker container logs and HTTP responses, eliminating the need to write traditional test scripts.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin QA session | `$zero-script-qa start` |
| `verify` | Verify specific feature | `$zero-script-qa verify auth` |
| `report` | Generate QA report | `$zero-script-qa report` |

## Methodology

### Step 1: Start Application with Docker

```bash
docker compose up -d
docker compose logs -f app
```

### Step 2: API Endpoint Verification

Test each endpoint with curl:

```bash
# Health check
curl -s http://localhost:3000/api/health | jq .

# Create user
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test User","password":"pass123"}' | jq .

# Login
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}' | jq .

# Authenticated request
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}' | jq -r '.access_token')

curl -s http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Step 3: Log Analysis

Check Docker logs for each operation:

```bash
# Check for errors
docker compose logs app --tail 100 | grep -i error

# Check for warnings
docker compose logs app --tail 100 | grep -i warn

# Check database queries
docker compose logs db --tail 50

# Monitor real-time
docker compose logs -f --tail 0 app
```

### Step 4: Edge Case Verification

```bash
# Invalid input (expect 400)
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":"","password":"short"}' | jq .

# Unauthorized access (expect 401)
curl -s http://localhost:3000/api/users/me | jq .

# Not found (expect 404)
curl -s http://localhost:3000/api/users/nonexistent-id | jq .

# Duplicate creation (expect 409)
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Duplicate","password":"pass123"}' | jq .
```

### Step 5: Performance Check

```bash
# Response time measurement
time curl -s http://localhost:3000/api/health > /dev/null

# Multiple requests
for i in {1..10}; do
  time curl -s http://localhost:3000/api/users > /dev/null 2>&1
done

# Container resource usage
docker stats --no-stream
```

## QA Report Template

```markdown
# Zero Script QA Report

## Environment
- Date: YYYY-MM-DD
- Docker version: X.X.X
- Containers: app, db, redis

## Endpoint Tests

| Endpoint | Method | Expected | Actual | Status |
|----------|--------|----------|--------|--------|
| /api/health | GET | 200 | 200 | PASS |
| /api/users | POST | 201 | 201 | PASS |
| /api/auth/login | POST | 200 | 200 | PASS |
| /api/users (no auth) | GET | 401 | 401 | PASS |

## Error Log Summary
- Errors found: X
- Warnings found: X
- Details: [list each error]

## Performance
- Average response time: Xms
- Container memory: X MB
- Container CPU: X%

## Verdict: PASS / FAIL
```

## QA Methodology Reference

See `references/qa-methodology.md` for detailed Zero Script QA patterns.

## When to Use

- Rapid prototyping QA (no time for test scripts)
- API verification during development
- Integration testing after Phase 6
- Pre-deployment smoke testing
- BaaS application testing (bkend.ai)
