# Zero Script QA Methodology Reference

## Philosophy

Traditional QA requires writing and maintaining test scripts. Zero Script QA achieves quality assurance through:

1. **Container logs** - Runtime behavior verification
2. **HTTP requests** - API contract validation
3. **Database queries** - Data integrity checks
4. **Resource monitoring** - Performance baselines

## Test Categories

### 1. Smoke Tests (Critical Path)

Verify the most important user flows:

```bash
#!/bin/bash
# smoke-test.sh - Run manually, not a test framework

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Test health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$STATUS" = "200" ]; then echo "PASS: Health check"; ((PASS++))
else echo "FAIL: Health check (got $STATUS)"; ((FAIL++)); fi

# Test signup
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"test1234","name":"Smoke"}')
if [ "$STATUS" = "201" ] || [ "$STATUS" = "409" ]; then echo "PASS: Signup"; ((PASS++))
else echo "FAIL: Signup (got $STATUS)"; ((FAIL++)); fi

# Test login
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"test1234"}')
TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
if [ -n "$TOKEN" ]; then echo "PASS: Login"; ((PASS++))
else echo "FAIL: Login (no token)"; ((FAIL++)); fi

# Test authenticated endpoint
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer $TOKEN")
if [ "$STATUS" = "200" ]; then echo "PASS: Auth endpoint"; ((PASS++))
else echo "FAIL: Auth endpoint (got $STATUS)"; ((FAIL++)); fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

### 2. Error Handling Tests

```bash
# Invalid JSON
curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d 'not json'
# Expected: 400 Bad Request

# Missing required fields
curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 with field errors

# Invalid field values
curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","name":"a","password":"12"}'
# Expected: 400 with validation errors

# Wrong HTTP method
curl -s -X DELETE "$BASE_URL/api/health"
# Expected: 405 Method Not Allowed
```

### 3. Log Analysis Patterns

```bash
# Count errors in last hour
docker compose logs --since 1h app 2>&1 | grep -c -i "error"

# Find unique error types
docker compose logs app 2>&1 | grep -i "error" | sort -u

# Track request patterns
docker compose logs app 2>&1 | grep "HTTP" | awk '{print $NF}' | sort | uniq -c | sort -rn

# Database slow queries
docker compose logs db 2>&1 | grep "duration:"

# Memory usage over time
docker stats --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}" --no-stream
```

### 4. Data Integrity Checks

```bash
# Connect to database
docker compose exec db psql -U myapp -d myapp

# Check for orphaned records
SELECT p.id FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

# Check for duplicate emails
SELECT email, COUNT(*) as count FROM users
GROUP BY email HAVING COUNT(*) > 1;

# Verify foreign key constraints
SELECT conname, conrelid::regclass
FROM pg_constraint WHERE contype = 'f';

# Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 5. Performance Baselines

```bash
# Measure response times
for endpoint in "/api/health" "/api/users" "/api/posts"; do
  TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$endpoint")
  echo "$endpoint: ${TIME}s"
done

# Concurrent requests (requires Apache Bench)
ab -n 100 -c 10 "$BASE_URL/api/health"

# Container resource snapshot
docker stats --no-stream --format \
  "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

## QA Workflow Integration

### During Development (Phase 4-6)
1. Start Docker containers
2. Run smoke tests after each feature
3. Check logs for errors after each change
4. Verify API contracts with curl

### Pre-Deployment (Phase 8-9)
1. Run full smoke test suite
2. Analyze logs for any warnings/errors
3. Check database integrity
4. Measure performance baselines
5. Generate QA report

### Post-Deployment
1. Run smoke tests against production
2. Monitor logs for first 30 minutes
3. Check error rates in monitoring
4. Compare performance with baselines

## Advantages Over Traditional QA

| Aspect | Traditional | Zero Script QA |
|--------|------------|---------------|
| Setup time | Hours (framework, config) | Minutes (Docker + curl) |
| Maintenance | Update scripts with code | No scripts to maintain |
| Coverage | What you write tests for | Runtime behavior |
| Speed | Depends on suite size | Instant feedback |
| Learning curve | Framework-specific | curl + Docker basics |
| Best for | Regression, CI/CD | Rapid prototyping, MVP |

## Limitations

- No automated regression detection (manual verification)
- Not suitable for complex UI interaction testing
- No code coverage metrics
- Requires developer judgment for edge cases
- Should complement (not replace) unit tests for critical logic
