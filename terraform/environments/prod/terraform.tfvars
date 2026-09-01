# ======================
# GCP Project
# ======================
project_id     = "topik-automation-501015"
project_number = "210786918512"
region         = "asia-southeast1"

# ======================
# Application
# ======================
app_name       = "hoanobita"
github_repo    = "your-org/hoa-nobita-system"

# ======================
# Docker Images
# ======================
backend_image  = "asia-southeast1-docker.pkg.dev/topik-automation-501015/hoanobita-docker/backend"
frontend_image = "asia-southeast1-docker.pkg.dev/topik-automation-501015/hoanobita-docker/frontend"

# ======================
# CORS
# ======================
cors_allowed_origins = "*"

# ======================
# Secrets (set via env: TF_VAR_db_password, TF_VAR_jwt_secret)
# ======================
# db_password = ""
# jwt_secret  = ""
