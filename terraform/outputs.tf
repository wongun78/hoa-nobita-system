output "backend_url" {
  description = "Cloud Run backend URL"
  value       = module.cloud_run.backend_url
}

output "frontend_url" {
  description = "Cloud Run frontend URL"
  value       = module.cloud_run.frontend_url
}

output "backend_image_repo" {
  description = "Artifact Registry path — backend"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.app_name}-repo/backend"
}

output "frontend_image_repo" {
  description = "Artifact Registry path — frontend"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.app_name}-repo/frontend"
}

output "run_sa_email" {
  description = "Cloud Run service account email"
  value       = module.iam.run_sa_email
}

output "wif_provider" {
  description = "Workload Identity Provider (GitHub Actions)"
  value       = module.iam.wif_provider_name
}

output "uploads_bucket" {
  description = "GCS bucket cho file uploads"
  value       = module.gcs_uploads.bucket_name
}
