---
name: enterprise
description: |
  Enterprise-grade system development with microservices, Kubernetes, Terraform.
  Includes AI Native methodology and Monorepo patterns.
  Project initialization with "init enterprise".
  Actions: init->system setup, strategy->architecture decisions,
  infra->infrastructure design, review->architecture review.
  Triggers: microservices, kubernetes, terraform, k8s, AWS, monorepo,
  마이크로서비스, 쿠버네티스, マイクロサービス, 微服务,
  microservicios, microservices, Microservices, microservizi
  Do NOT use for: simple websites (use $starter), BaaS apps (use $dynamic).
---

# Advanced (Enterprise) Skill

> Enterprise-grade system development with microservices, Kubernetes, and Terraform.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization | `$enterprise init my-platform` |
| `guide` | Development guide | `$enterprise guide` |
| `help` | MSA/Infrastructure help | `$enterprise help` |

### init (Project Initialization)

1. Create Turborepo monorepo structure
2. Set up apps/, packages/, services/, infra/ folders
3. Create AGENTS.md (Level: Enterprise specified)
4. Create docs/ 5-category structure
5. Generate infra/terraform/, infra/k8s/ base templates
6. Initialize .pdca-status.json

### guide (Development Guide)

- AI Native 10-Day development cycle
- Microservices architecture patterns
- Phase 1-9 full Pipeline (Enterprise version)

### help (Infrastructure Help)

- Kubernetes basic concepts
- Terraform IaC patterns
- AWS EKS, RDS configuration guide

## Target Audience

- Senior developers / CTOs / Architects
- Large-scale system operators
- Teams building production-grade platforms

## Tech Stack

```
Frontend:
- Next.js 14+ (Turborepo monorepo)
- TypeScript, Tailwind CSS
- TanStack Query, Zustand

Backend:
- Python FastAPI (microservices)
- PostgreSQL (schema separation)
- Redis (cache, Pub/Sub)
- RabbitMQ / SQS (message queue)

Infrastructure:
- AWS (EKS, RDS, S3, CloudFront)
- Kubernetes (Kustomize)
- Terraform (IaC)
- ArgoCD (GitOps)

CI/CD:
- GitHub Actions, Docker
```

## Project Structure

```
project/
├── apps/                        # Frontend apps (Turborepo)
│   ├── web/                    # Main web app
│   ├── admin/                  # Admin
│   └── docs/                   # Documentation site
├── packages/                    # Shared packages
│   ├── ui/                     # UI components
│   ├── api-client/             # API client
│   └── config/                 # Shared config
├── services/                    # Backend microservices
│   ├── auth/                   # Auth service
│   ├── user/                   # User service
│   └── shared/                 # Shared modules
├── infra/                       # Infrastructure code
│   ├── terraform/
│   │   ├── modules/            # Reusable modules
│   │   └── environments/       # Per-env config
│   └── k8s/
│       ├── base/               # Common manifests
│       └── overlays/           # Per-env patches
├── docs/                        # PDCA documents
│   ├── 00-requirement/
│   ├── 01-development/
│   ├── 02-scenario/
│   ├── 03-refactoring/
│   └── 04-operation/
├── turbo.json
└── pnpm-workspace.yaml
```

## Clean Architecture (4-Layer)

```
API Layer           -> FastAPI routers, Request/Response DTOs, Auth middleware
Application Layer   -> Service classes, Use Cases, Transaction management
Domain Layer        -> Entity classes (pure Python), Repository interfaces (ABC)
Infrastructure      -> Repository implementations (SQLAlchemy), External APIs
```

Dependency direction: Top -> Bottom. Domain Layer depends on nothing.

## Core Patterns

### Repository Pattern

```python
# domain/repositories/user_repository.py (interface)
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, id: str) -> User | None: pass

    @abstractmethod
    async def save(self, user: User) -> User: pass

# infrastructure/repositories/user_repository_impl.py
class UserRepositoryImpl(UserRepository):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, id: str) -> User | None:
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == id)
        )
        return result.scalar_one_or_none()
```

### Inter-service Communication

```python
# Synchronous (Internal API)
async def get_user_info(user_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{USER_SERVICE_URL}/internal/users/{user_id}",
            headers={"X-Internal-Token": INTERNAL_TOKEN}
        )
        return response.json()

# Asynchronous (message queue)
await message_queue.publish(
    topic="user.created",
    message={"user_id": user.id, "email": user.email}
)
```

### Terraform Module

```hcl
resource "aws_eks_cluster" "this" {
  name     = "${var.environment}-${var.project_name}-eks"
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version
  vpc_config {
    subnet_ids = var.subnet_ids
  }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: user-service
          resources:
            requests: { cpu: "100m", memory: "256Mi" }
            limits: { cpu: "500m", memory: "512Mi" }
          livenessProbe:
            httpGet: { path: /health, port: 8000 }
```

## Environment Configuration

| Environment | Infrastructure | Deployment |
|-------------|---------------|------------|
| Local | Docker Compose | Manual |
| Staging | EKS | ArgoCD Auto Sync |
| Production | EKS | ArgoCD Manual Sync |

## Security Rules

Allowed: Secrets Manager, IAM role-based access, VPC internal, mTLS
Prohibited: Hardcoded secrets, DB in public subnet, root account, excessive IAM

## AI Native 10-Day Pattern

| Day | Focus | Output |
|-----|-------|--------|
| 1 | Architecture | Market analysis + System architecture |
| 2-3 | Core | Auth, User + Business services |
| 4-5 | UX | PO feedback -> Documentation -> Implementation |
| 6-7 | QA | Zero Script QA + bug fixes |
| 8 | Infra | Terraform + GitOps |
| 9-10 | Production | Security review + Deployment |

## Pipeline Flow (Enterprise)

```
Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
```

All 9 phases required. Use PDCA cycle within each phase.

## SoR Priority

1. Codebase (source of truth for implementation)
2. AGENTS.md / Convention docs
3. docs/ design documents (for understanding intent)
