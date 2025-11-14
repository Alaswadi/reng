from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
import httpx
import asyncio
import re
from typing import List, Dict, Optional


app = FastAPI(title="Recon API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin] if settings.frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "env": settings.app_env}


@app.get("/")
def root():
    return {"name": "Recon API", "version": "0.1.0"}


_DOMAIN_RE = re.compile(r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$")


def _validate_domain(domain: str) -> str:
    domain = domain.strip().lower()
    if not _DOMAIN_RE.match(domain):
        raise HTTPException(status_code=400, detail="Invalid domain")
    return domain


async def _fetch_crtsh(domain: str) -> List[str]:
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    subdomains: set[str] = set()
    timeout = httpx.Timeout(10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            r = await client.get(url, headers={"User-Agent": "recon-api/0.1"})
            if r.status_code != 200:
                return []
            data = r.json()
            for entry in data:
                name_value = entry.get("name_value")
                if not name_value:
                    continue
                for line in str(name_value).split("\n"):
                    name = line.strip().lower()
                    if "*" in name:
                        continue
                    if name.endswith(domain):
                        subdomains.add(name)
        except Exception:
            return []
    return sorted(subdomains)


async def _probe_one(host: str) -> Dict[str, Optional[object]]:
    results: Dict[str, Optional[object]] = {
        "host": host,
        "reachable": False,
        "protocol": None,
        "status_code": None,
        "final_url": None,
        "elapsed_ms": None,
    }
    timeout = httpx.Timeout(5.0)
    limits = httpx.Limits(max_keepalive_connections=10, max_connections=50)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, limits=limits) as client:
        for scheme in ("https", "http"):
            url = f"{scheme}://{host}"
            try:
                r = await client.get(url)
                results["reachable"] = True
                results["protocol"] = scheme
                results["status_code"] = r.status_code
                results["final_url"] = str(r.url)
                results["elapsed_ms"] = int(r.elapsed.total_seconds() * 1000)
                break
            except Exception:
                continue
    return results


@app.get("/subdomains")
async def get_subdomains(domain: str = Query(..., description="Base domain, e.g. example.com")):
    domain = _validate_domain(domain)
    subs = await _fetch_crtsh(domain)
    return {"domain": domain, "count": len(subs), "subdomains": subs}


@app.get("/scan")
async def scan(domain: str = Query(..., description="Base domain, e.g. example.com"), limit: int | None = Query(None, ge=1, le=500)):
    domain = _validate_domain(domain)
    subs = await _fetch_crtsh(domain)
    if limit:
        subs = subs[:limit]
    # probe concurrently
    semaphore = asyncio.Semaphore(50)

    async def wrapped_probe(host: str):
        async with semaphore:
            return await _probe_one(host)

    results = await asyncio.gather(*(wrapped_probe(h) for h in subs))
    alive = sum(1 for r in results if r.get("reachable"))
    return {
        "domain": domain,
        "total": len(subs),
        "alive": alive,
        "results": results,
    }
