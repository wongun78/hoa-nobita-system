output "bucket_name" {
  description = "GCS bucket name cho file uploads"
  value       = google_storage_bucket.uploads.name
}

output "bucket_url" {
  description = "GCS bucket URL"
  value       = google_storage_bucket.uploads.url
}
