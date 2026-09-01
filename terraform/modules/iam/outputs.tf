output "run_sa_email" {
  value = google_service_account.run_sa.email
}

output "wif_provider_name" {
  description = "Workload Identity Provider name (dùng trong GitHub Actions secrets)"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}
