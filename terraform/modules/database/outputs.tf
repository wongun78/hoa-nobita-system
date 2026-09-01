output "db_ip" {
  description = "Private IP của Cloud SQL instance"
  value       = google_sql_database_instance.main.private_ip_address
}

output "db_name" {
  value = google_sql_database.db.name
}

output "instance_name" {
  value = google_sql_database_instance.main.name
}
