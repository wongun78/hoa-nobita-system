variable "project_id" {
  type = string
}

variable "run_sa_email" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}
