output "cluster_name" {
  value = mongodbatlas_advanced_cluster.global.name
}

output "connection_string" {
  value     = mongodbatlas_advanced_cluster.global.connection_strings[0].standard_srv
  sensitive = true
}

output "db_username" {
  value = mongodbatlas_database_user.app.username
}

output "kms_key_arn" {
  value = aws_kms_key.csfle.arn
}
