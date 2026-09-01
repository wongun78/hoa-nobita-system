# ─── GCS Bucket cho file uploads ────────────────────────────────────────────
# Hoà Nobita lưu materials, submissions, feedback attachments
# Cloud Run có ephemeral filesystem → phải dùng GCS thay vì local disk

resource "google_storage_bucket" "uploads" {
  name     = var.bucket_name
  project  = var.project_id
  location = var.region

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = false

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# IAM: Cloud Run SA có quyền read/write
resource "google_storage_bucket_iam_member" "run_sa_access" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.run_sa_email}"
}
