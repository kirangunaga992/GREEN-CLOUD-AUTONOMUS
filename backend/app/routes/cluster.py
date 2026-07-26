# ============================================
# Cluster / K8s Pods Endpoint
# ============================================
import logging
import subprocess
import json
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()


def get_docker_containers():
    """Get all containers from Docker (simulating K8s pods)."""
    try:
        result = subprocess.run(
            ["docker", "ps", "-a", "--format", "{{json .}}"],
            capture_output=True, text=True, timeout=5
        )
        pods = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            try:
                c = json.loads(line)
                pods.append({
                    "name": c.get("Names", "unknown"),
                    "image": c.get("Image", ""),
                    "status": c.get("State", "unknown"),  # running / exited
                    "ports": c.get("Ports", ""),
                    "created": c.get("CreatedAt", ""),
                    "type": "docker"
                })
            except Exception:
                continue
        return pods
    except Exception as e:
        logger.warning(f"Docker ps failed: {e}")
        return []


def get_k8s_pods():
    """Get K8s pods (if kubectl available)."""
    try:
        result = subprocess.run(
            ["kubectl", "get", "pods", "-A", "-o", "json"],
            capture_output=True, text=True, timeout=5
        )
        data = json.loads(result.stdout)
        pods = []
        for item in data.get("items", []):
            pods.append({
                "name": item["metadata"]["name"],
                "namespace": item["metadata"]["namespace"],
                "status": item["status"]["phase"],
                "node": item["spec"].get("nodeName", "-"),
                "type": "k8s"
            })
        return pods
    except Exception:
        return []


@router.get("/pods")
async def get_all_pods():
    """Return list of all pods (Docker containers + K8s pods)."""
    docker_pods = get_docker_containers()
    k8s_pods = get_k8s_pods()
    
    return {
        "success": True,
        "docker_containers": docker_pods,
        "k8s_pods": k8s_pods,
        "total_running": sum(1 for p in docker_pods if p["status"] == "running") + len(k8s_pods),
        "total": len(docker_pods) + len(k8s_pods),
    }
