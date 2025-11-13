## Goals
- Web-based recon platform with Dockerized services and non-default host port mappings.
- Configurable pipelines, continuous monitoring, evidence storage, notifications.

## Tech Stack
- Frontend: Next.js (React, TypeScript)
- Backend API: FastAPI (Python)
- Workers: Celery + Redis
- Database: PostgreSQL
- Artifacts: MinIO (S3-compatible)
- Optional: OpenSearch + Dashboards

## Docker Compose Architecture (Custom Host Ports)
- `frontend` (Next.js)
  - Container port: `3000`
  - Host port: `4500` → `http://localhost:4500`
- `api` (FastAPI)
  - Container port: `8000`
  - Host port: `4501` → `http://localhost:4501`
- `scheduler` (Celery beat)
  - No host port
- `worker` (Celery)
  - No host port
- `redis`
  - No host port (internal only)
- `postgres`
  - No host port by default; optional `4505:5432` if needed
- `minio`
  - S3 endpoint: host `4510:9000`
  - Console: host `4511:9001` → `http://localhost:4511`
- `opensearch` (optional)
  - Host `4512:9200`
- `opensearch-dashboards` (optional)
  - Host `4513:5601` → `http://localhost:4513`
- Notes
  - Internal service ports remain defaults; host mappings changed to the 4500–4515 range.
  - Only `frontend`, `api`, `minio` endpoints, and optional search UI are exposed.

## Pipelines (MVP)
- Subdomains: `subfinder`, `amass`, `assetfinder` → dedupe → `dnsx`.
- Probing: `httpx` (HTTP) and controlled `naabu` (ports).
- Crawling/Endpoints: `katana`; historic via `gau`/`waybackurls`.
- Screenshots: `playwright`; store in MinIO.
- Vulnerabilities: `nuclei`; evidence storage.
- Correlation: normalize schemas; dedup; tagging and keyword filters.

## UI Workflow
- Target management with scope and schedules; pipeline selection.
- Dashboards for assets/endpoints/findings; evidence viewer; live run status.

## Scheduling & Limits
- Celery beat for cron-like schedules; per-tool concurrency caps; per-target rate limits.

## Security
- JWT auth; scope enforcement; proxy support; secrets via env vars.

## Milestones
- Week 1: Compose stack with custom ports; API/UI skeleton.
- Week 2: Subdomains + probing; UI lists.
- Week 3: Crawl/endpoints + screenshots; evidence storage.
- Week 4: Nuclei + findings UI + notifications.
- Week 5: Scheduling, rate limiting, diffs.
- Week 6: Polishing and tests.

## References
- reNgine overview/features: https://github.com/yogeshojha/rengine

## Next Step
- Confirm the custom port range and stack. On approval, I’ll scaffold the Docker Compose with these mappings and implement the MVP pipelines.