# ─── Cloud Run Backend ───────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.app_name}-backend"
  project  = var.project_id
  location = var.region

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.run_sa_email

    vpc_access {
      connector = var.connector_id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = var.backend_image

      resources {
        limits = {
          memory = "1Gi"
          cpu    = "1"
        }
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/actuator/health"
          port = 8080
        }
        initial_delay_seconds = 60
        timeout_seconds       = 10
        period_seconds        = 15
        failure_threshold     = 20
      }

      # ─── Env vars (non-sensitive) ─────────────────────────────────────
      env {
        name  = "SPRING_DATASOURCE_URL"
        value = "jdbc:postgresql://${var.db_ip}:5432/${var.db_name}"
      }
      env {
        name  = "SPRING_DATASOURCE_USERNAME"
        value = "postgres"
      }
      env {
        name  = "SPRING_FLYWAY_ENABLED"
        value = "true"
      }
      env {
        name  = "SPRING_JPA_HIBERNATE_DDL_AUTO"
        value = "validate"
      }
      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "prod"
      }
      env {
        name  = "APP_SEED_ENABLED"
        value = "true"
      }
      env {
        name  = "UPLOAD_DIR"
        value = "/tmp/uploads"
      }
      env {
        name  = "APP_STORAGE_TYPE"
        value = "gcs"
      }
      env {
        name  = "APP_STORAGE_GCS_BUCKET"
        value = var.uploads_bucket
      }

      # CORS: nginx proxy xử lý CORS ở frontend, backend chỉ cần cho direct API access
      dynamic "env" {
        for_each = var.cors_allowed_origins != "" ? [1] : []
        content {
          name  = "APP_CORS_ALLOWED_ORIGINS"
          value = var.cors_allowed_origins
        }
      }

      # ─── Secrets (from Secret Manager) ────────────────────────────────
      env {
        name = "SPRING_DATASOURCE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "db-password"
            version = "latest"
          }
        }
      }
      env {
        name = "APP_JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt-secret"
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "backend_noauth" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Cloud Run Frontend ──────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.app_name}-frontend"
  project  = var.project_id
  location = var.region

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.run_sa_email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.frontend_image

      resources {
        limits = {
          memory = "512Mi"
          cpu    = "1"
        }
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/ready"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 5
        failure_threshold     = 6
      }

      liveness_probe {
        http_get {
          path = "/ready"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
      }

      # Backend URL cho nginx reverse proxy
      env {
        name  = "BACKEND_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "frontend_noauth" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
