# ============================================
# GreenOps Autonomous - Makefile
# ============================================

.PHONY: help setup build up down logs clean k8s-apply k8s-delete

help:
	@echo "GreenOps Autonomous - Available Commands"
	@echo "----------------------------------------"
	@echo "make setup       - Install dependencies"
	@echo "make build       - Build Docker images"
	@echo "make up          - Start with Docker Compose"
	@echo "make down        - Stop Docker Compose"
	@echo "make logs        - View all logs"
	@echo "make clean       - Remove containers and volumes"
	@echo "make k8s-apply   - Apply all Kubernetes manifests"
	@echo "make k8s-delete  - Delete all Kubernetes resources"

setup:
	@echo "Setting up backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Setting up frontend dependencies..."
	cd frontend && npm install

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans

k8s-apply:
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/rbac.yaml
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/mongodb.yaml
	kubectl apply -f k8s/prometheus.yaml
	kubectl apply -f k8s/grafana.yaml
	kubectl apply -f k8s/backend.yaml
	kubectl apply -f k8s/gateway.yaml
	kubectl apply -f k8s/workload.yaml
	kubectl apply -f k8s/frontend.yaml
	kubectl apply -f k8s/ingress.yaml

k8s-delete:
	kubectl delete namespace greenops

k8s-status:
	kubectl get all -n greenops
