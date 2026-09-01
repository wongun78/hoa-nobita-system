variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "app_name" {
  type = string
}

variable "run_sa_email" {
  type = string
}

variable "connector_id" {
  type = string
}

variable "db_ip" {
  type = string
}

variable "db_name" {
  type = string
}

variable "backend_image" {
  type = string
}

variable "frontend_image" {
  type = string
}

variable "cors_allowed_origins" {
  type    = string
  default = ""
}

variable "uploads_bucket" {
  type = string
}
