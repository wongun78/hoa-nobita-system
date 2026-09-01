variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number (dùng cho WIF)"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-southeast1"
}

variable "app_name" {
  description = "Tên app — prefix cho tất cả resources"
  type        = string
  default     = "hoanobita"
}

variable "github_repo" {
  description = "GitHub repo dạng owner/repo (cho WIF)"
  type        = string
}

variable "backend_image" {
  description = "Full Docker image path cho backend"
  type        = string
}

variable "frontend_image" {
  description = "Full Docker image path cho frontend"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Frontend URL for CORS"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "Password cho PostgreSQL user"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (>=32 chars)"
  type        = string
  sensitive   = true
}
