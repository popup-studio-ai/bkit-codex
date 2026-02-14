# {feature} Design Document (Enterprise)

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Level**: Enterprise
> **Planning Doc**: [{feature}.plan.md](../01-plan/features/{feature}.plan.md)

---

## 1. Architecture Overview

### 1.1 System Context

```
External Users -> Load Balancer -> API Gateway -> Microservices -> Databases
                                       |
                                  Message Queue -> Workers
```

### 1.2 Service Boundaries

| Service | Responsibility | Tech Stack |
|---------|---------------|------------|
| {service-a} | {responsibility} | Python FastAPI |
| {service-b} | {responsibility} | Node.js Express |

### 1.3 Communication Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| Sync (REST) | Real-time queries | HTTP/gRPC |
| Async (Events) | Background processing | RabbitMQ/SQS |

---

## 2. Data Architecture

### 2.1 Database Strategy

| Service | Database | Type | Justification |
|---------|----------|------|---------------|
| {service} | PostgreSQL | RDBMS | Transactional data |
| {service} | Redis | Cache | Session, rate limiting |

### 2.2 Data Model

```sql
-- {table_name}
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.3 Data Flow

```
Client -> API Gateway -> Service A -> DB A
                      -> Service B -> DB B
                      -> Event Bus -> Worker -> DB C
```

---

## 3. API Design

### 3.1 External API

| Method | Path | Service | Auth |
|--------|------|---------|------|
| GET | /api/v1/{resource} | {service} | JWT |
| POST | /api/v1/{resource} | {service} | JWT |

### 3.2 Internal API

| Method | Path | From | To |
|--------|------|------|-----|
| GET | /internal/{resource} | {service-a} | {service-b} |

### 3.3 Event Schema

```json
{
  "eventType": "{domain}.{action}",
  "timestamp": "ISO-8601",
  "source": "{service}",
  "data": {}
}
```

---

## 4. Infrastructure

### 4.1 Kubernetes Architecture

```yaml
Namespace: {project}-{env}
  Deployments:
    - {service-a}: replicas 2-5
    - {service-b}: replicas 2-3
  Services:
    - ClusterIP for internal
    - Ingress for external
```

### 4.2 Terraform Modules

| Module | Resources |
|--------|-----------|
| networking | VPC, Subnets, Security Groups |
| compute | EKS Cluster, Node Groups |
| database | RDS, ElastiCache |
| storage | S3 Buckets |

---

## 5. Security

### 5.1 Authentication Flow

```
Client -> OAuth 2.0/OIDC -> JWT -> API Gateway -> Services
```

### 5.2 Security Checklist

- [ ] mTLS between services
- [ ] Secrets in AWS Secrets Manager
- [ ] IAM role-based access
- [ ] VPC network isolation
- [ ] Rate limiting per API key

---

## 6. Observability

### 6.1 Monitoring Stack

| Component | Tool |
|-----------|------|
| Metrics | Prometheus + Grafana |
| Logging | ELK / CloudWatch |
| Tracing | Jaeger / X-Ray |
| Alerting | PagerDuty / Slack |

### 6.2 SLA Targets

| Metric | Target |
|--------|--------|
| Availability | 99.9% |
| P95 Latency | < 200ms |
| Error Rate | < 0.1% |

---

## 7. Deployment Strategy

| Environment | Strategy | Automation |
|-------------|----------|-----------|
| Staging | Auto-deploy on merge | ArgoCD Auto Sync |
| Production | Blue/Green or Canary | ArgoCD Manual Sync |

---

## 8. Implementation Order

1. [ ] Infrastructure setup (Terraform)
2. [ ] Core service scaffolding
3. [ ] Data model and migrations
4. [ ] API implementation
5. [ ] Frontend integration
6. [ ] Security hardening
7. [ ] Observability setup
8. [ ] Load testing
9. [ ] Production deployment

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
