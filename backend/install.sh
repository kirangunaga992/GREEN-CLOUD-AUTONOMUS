#!/bin/bash

# ============================================
# GreenOps - Safe Package Installer
# Installs one by one with retry on timeout
# ============================================

echo "============================================"
echo " GreenOps Backend - Safe Package Installer"
echo "============================================"

# pip install with timeout and retry settings
PIP="pip install --timeout=120 --retries=5 --no-cache-dir"

install_package() {
    PACKAGE=$1
    echo ""
    echo ">>> Installing: $PACKAGE"
    
    for attempt in 1 2 3; do
        echo "    Attempt $attempt..."
        $PIP "$PACKAGE" && echo "    [OK] $PACKAGE installed" && return 0
        echo "    [RETRY] Failed, waiting 5 seconds..."
        sleep 5
    done
    
    echo "    [FAILED] Could not install $PACKAGE after 3 attempts"
    return 1
}

# ---- Core Web Framework ----
install_package "fastapi==0.109.0"
install_package "uvicorn[standard]==0.27.0"

# ---- Database ----
install_package "pymongo==4.6.1"

# ---- Validation ----
install_package "pydantic==2.5.3"
install_package "python-dotenv==1.0.0"

# ---- HTTP ----
install_package "requests==2.31.0"

# ---- System Metrics ----
install_package "psutil==5.9.7"

# ---- Prometheus ----
install_package "prometheus-client==0.19.0"

# ---- Scheduler ----
install_package "apscheduler==3.10.4"

# ---- Data Science ----
install_package "numpy==1.26.4"
install_package "pandas==2.1.4"

# ---- ML - Prophet (largest package, may take time) ----
echo ""
echo ">>> Installing Prophet (this may take 3-5 minutes)..."
for attempt in 1 2 3; do
    echo "    Attempt $attempt..."
    pip install --timeout=300 --retries=5 --no-cache-dir prophet==1.1.5 && echo "    [OK] Prophet installed" && break
    echo "    [RETRY] waiting 10 seconds..."
    sleep 10
done

# ---- Kubernetes Client ----
install_package "kubernetes==29.0.0"

echo ""
echo "============================================"
echo " Installation Complete!"
echo " Run: python -m app.main"
echo "============================================"
