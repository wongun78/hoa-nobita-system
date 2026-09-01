#!/usr/bin/env bash
# =============================================================================
# GCP Deployment cho Hoà Nobita TOPIK Platform
# =============================================================================
# Dùng:
#   chmod +x deploy.sh
#   ./deploy.sh setup       # Config gcloud + Enable APIs
#   ./deploy.sh registry    # Tạo Artifact Registry
#   ./deploy.sh network     # VPC + VPC Connector
#   ./deploy.sh database    # Cloud SQL PostgreSQL
#   ./deploy.sh secrets     # Secret Manager
#   ./deploy.sh storage     # GCS bucket cho file uploads
#   ./deploy.sh build       # Build & Push Docker images
#   ./deploy.sh deploy      # Deploy Cloud Run
#   ./deploy.sh status      # Kiểm tra toàn bộ
#   ./deploy.sh destroy     # Xóa toàn bộ resources
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIG
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a
else
  echo "ERROR: File .env không tồn tại!"
  echo "  Tạo: cp .env.example .env → điền giá trị thật"
  exit 1
fi

# Validate
for VAR in GCP_PROJECT_ID DB_PASSWORD JWT_SECRET; do
  if [[ -z "${!VAR:-}" ]]; then
    echo "ERROR: Biến $VAR chưa set trong .env"
    exit 1
  fi
done

PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-southeast1}"
AR_REPO="hoanobita-repo"
VPC_NAME="hoanobita-vpc"
CONNECTOR_NAME="hoanobita-connector"
SQL_INSTANCE="hoanobita-db"
DB_NAME="hoanobita_db"
BUCKET_NAME="${GCP_PROJECT_ID}-hoanobita-uploads"
BACKEND_SERVICE="hoanobita-backend"
FRONTEND_SERVICE="hoanobita-frontend"
RUN_SA="hoanobita-run-sa"

BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/backend:latest"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/frontend:latest"
RUN_SA_EMAIL="${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

# =============================================================================
# HELPERS
# =============================================================================
info()    { echo ""; echo "▶ $*"; }
success() { echo "✓ $*"; }
warn()    { echo "⚠ $*"; }

# =============================================================================
# STEP: setup
# =============================================================================
cmd_setup() {
  info "Config gcloud project"
  gcloud config set project "$PROJECT_ID"
  gcloud config set compute/region "$REGION"
  success "Project: $PROJECT_ID | Region: $REGION"

  info "Enable APIs"
  gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    vpcaccess.googleapis.com \
    secretmanager.googleapis.com \
    servicenetworking.googleapis.com \
    cloudresourcemanager.googleapis.com \
    storage.googleapis.com
  success "APIs enabled"
}

# =============================================================================
# STEP: registry
# =============================================================================
cmd_registry() {
  info "Tạo Artifact Registry"
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Hoà Nobita Docker images" \
    || warn "Repository đã tồn tại"

  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  success "Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
}

# =============================================================================
# STEP: network
# =============================================================================
cmd_network() {
  info "Tạo VPC"
  gcloud compute networks create "$VPC_NAME" \
    --subnet-mode=auto \
    || warn "VPC đã tồn tại"
  success "VPC: $VPC_NAME"

  info "Tạo VPC Access Connector"
  gcloud compute networks vpc-access connectors create "$CONNECTOR_NAME" \
    --region="$REGION" \
    --network="$VPC_NAME" \
    --range="10.8.0.0/28" \
    --min-instances=2 \
    --max-instances=3 \
    --machine-type=e2-micro \
    || warn "Connector đã tồn tại"
  success "VPC Connector: $CONNECTOR_NAME"

  info "Private Service Connection cho Cloud SQL"
  gcloud compute addresses create "google-managed-services-${VPC_NAME}" \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network="$VPC_NAME" \
    || warn "Address đã tồn tại"

  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges="google-managed-services-${VPC_NAME}" \
    --network="$VPC_NAME" \
    || warn "Peering đã tồn tại"

  info "Firewall rule: VPC Connector → Cloud SQL"
  gcloud compute firewall-rules create "allow-connector-to-sql" \
    --network="$VPC_NAME" \
    --allow="tcp:5432" \
    --source-ranges="10.8.0.0/28" \
    --description="Allow VPC connector to reach Cloud SQL" \
    || warn "Firewall rule đã tồn tại"

  success "Network ready"
}

# =============================================================================
# STEP: database
# =============================================================================
cmd_database() {
  info "Tạo Cloud SQL PostgreSQL (~10-15 phút)"
  gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --no-assign-ip \
    --network="$VPC_NAME" \
    --storage-type=HDD \
    --storage-size=10GB \
    --no-backup \
    || warn "Instance đã tồn tại"

  info "Tạo database"
  gcloud sql databases create "$DB_NAME" \
    --instance="$SQL_INSTANCE" \
    || warn "Database đã tồn tại"

  info "Set password"
  gcloud sql users set-password postgres \
    --instance="$SQL_INSTANCE" \
    --password="$DB_PASSWORD"

  success "Cloud SQL: $SQL_INSTANCE / $DB_NAME"
}

# =============================================================================
# STEP: secrets
# =============================================================================
cmd_secrets() {
  info "Tạo Service Account"
  gcloud iam service-accounts create "$RUN_SA" \
    --display-name="Hoà Nobita Cloud Run SA" \
    || warn "SA đã tồn tại"

  for ROLE in roles/cloudsql.client roles/artifactregistry.writer \
              roles/run.developer roles/iam.serviceAccountUser \
              roles/storage.objectAdmin roles/secretmanager.secretAccessor; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${RUN_SA_EMAIL}" \
      --role="$ROLE" \
      --quiet >/dev/null 2>&1
  done
  success "IAM roles granted"

  info "Tạo secrets"
  for SECRET_NAME in db-password jwt-secret; do
    gcloud secrets create "$SECRET_NAME" \
      --replication-policy="automatic" \
      2>/dev/null || true
  done

  echo -n "$DB_PASSWORD" | gcloud secrets versions add db-password --data-file=-
  echo -n "$JWT_SECRET"  | gcloud secrets versions add jwt-secret  --data-file=-

  # Grant SA access
  for SECRET_NAME in db-password jwt-secret; do
    gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
      --member="serviceAccount:${RUN_SA_EMAIL}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet >/dev/null 2>&1
  done
  success "Secrets created"
}

# =============================================================================
# STEP: storage
# =============================================================================
cmd_storage() {
  info "Tạo GCS bucket cho file uploads"
  gsutil mb -p "$PROJECT_ID" -l "$REGION" -b on "gs://${BUCKET_NAME}" \
    2>/dev/null || warn "Bucket đã tồn tại"

  gsutil cors set /dev/stdin "gs://${BUCKET_NAME}" <<'EOF'
[{"origin":["*"],"method":["GET","HEAD","PUT","POST"],"responseHeader":["Content-Type","Authorization"],"maxAgeSeconds":3600}]
EOF

  success "GCS bucket: gs://${BUCKET_NAME}"
}

# =============================================================================
# STEP: build
# =============================================================================
cmd_build() {
  info "Build & Push backend image"
  docker build -t "$BACKEND_IMAGE" -f backend/Dockerfile backend/
  docker push "$BACKEND_IMAGE"
  success "Backend image pushed"

  info "Build & Push frontend image"
  BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --region="$REGION" \
    --format='value(status.url)' 2>/dev/null || echo "https://placeholder.run.app")

  docker build \
    -t "$FRONTEND_IMAGE" \
    -f frontend/Dockerfile \
    --build-arg "VITE_API_BASE_URL=${BACKEND_URL}/api" \
    frontend/
  docker push "$FRONTEND_IMAGE"
  success "Frontend image pushed"
}

# =============================================================================
# STEP: deploy
# =============================================================================
cmd_deploy() {
  DB_IP=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format='value(ipAddresses[0].ipAddress)')

  CONNECTOR="projects/${PROJECT_ID}/locations/${REGION}/connectors/${CONNECTOR_NAME}"

  info "Deploy backend"
  gcloud run deploy "$BACKEND_SERVICE" \
    --image="$BACKEND_IMAGE" \
    --region="$REGION" \
    --service-account="$RUN_SA_EMAIL" \
    --vpc-connector="$CONNECTOR" \
    --vpc-egress=private-ranges-only \
    --set-env-vars="SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_IP}:5432/${DB_NAME}" \
    --set-env-vars="SPRING_DATASOURCE_USERNAME=postgres" \
    --set-env-vars="SPRING_FLYWAY_ENABLED=true" \
    --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=validate" \
    --set-env-vars="APP_SEED_ENABLED=true" \
    --set-env-vars="UPLOAD_DIR=gs://${BUCKET_NAME}" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest" \
    --set-secrets="APP_JWT_SECRET=jwt-secret:latest" \
    --memory=1Gi \
    --cpu=1 \
    --cpu-boost \
    --min-instances=0 \
    --max-instances=3 \
    --port=8080 \
    --timeout=300 \
    --allow-unauthenticated

  BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --region="$REGION" --format='value(status.url)')
  success "Backend: $BACKEND_URL"

  info "Deploy frontend"
  gcloud run deploy "$FRONTEND_SERVICE" \
    --image="$FRONTEND_IMAGE" \
    --region="$REGION" \
    --service-account="$RUN_SA_EMAIL" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=2 \
    --port=8080 \
    --allow-unauthenticated

  FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
    --region="$REGION" --format='value(status.url)')
  success "Frontend: $FRONTEND_URL"

  info "Update CORS"
  gcloud run services update "$BACKEND_SERVICE" \
    --region="$REGION" \
    --update-env-vars="APP_CORS_ALLOWED_ORIGINS=${FRONTEND_URL}"
  success "CORS updated"

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Backend:  $BACKEND_URL"
  echo "  Frontend: $FRONTEND_URL"
  echo "═══════════════════════════════════════════════════════════════"
}

# =============================================================================
# STEP: status
# =============================================================================
cmd_status() {
  info "Cloud Run services"
  gcloud run services list --region="$REGION" --filter="metadata.name:hoanobita" \
    --format="table(metadata.name,status.url,status.conditions[0].type)"

  info "Cloud SQL"
  gcloud sql instances list --filter="name:hoanobita-db" \
    --format="table(name,state,settings.tier,ipAddresses[0].ipAddress)"

  info "GCS Bucket"
  gsutil ls -p "$PROJECT_ID" "gs://${BUCKET_NAME}/" 2>/dev/null | head -5 || echo "(empty)"
}

# =============================================================================
# STEP: destroy
# =============================================================================
cmd_destroy() {
  echo "⚠️  XÓA TOÀN BỘ resources cho hoanobita? (yes/no)"
  read -r CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Hủy."
    return
  fi

  gcloud run services delete "$BACKEND_SERVICE"  --region="$REGION" --quiet 2>/dev/null || true
  gcloud run services delete "$FRONTEND_SERVICE" --region="$REGION" --quiet 2>/dev/null || true
  gcloud sql instances delete "$SQL_INSTANCE"    --quiet 2>/dev/null || true
  gsutil rm -r "gs://${BUCKET_NAME}" 2>/dev/null || true
  gcloud artifacts repositories delete "$AR_REPO" --location="$REGION" --quiet 2>/dev/null || true

  success "Resources destroyed"
}

# =============================================================================
# MAIN
# =============================================================================
case "${1:-help}" in
  setup)    cmd_setup ;;
  registry) cmd_registry ;;
  network)  cmd_network ;;
  database) cmd_database ;;
  secrets)  cmd_secrets ;;
  storage)  cmd_storage ;;
  build)    cmd_build ;;
  deploy)   cmd_deploy ;;
  status)   cmd_status ;;
  destroy)  cmd_destroy ;;
  *)
    echo "Dùng: $0 {setup|registry|network|database|secrets|storage|build|deploy|status|destroy}"
    ;;
esac
