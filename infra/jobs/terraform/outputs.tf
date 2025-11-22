output "msk_cluster_arn" {
  value = aws_msk_cluster.this.arn
}

output "bootstrap_brokers_tls" {
  value = aws_msk_cluster.this.bootstrap_brokers_tls
}

output "scram_secret_arn" {
  value = aws_secretsmanager_secret.kafka_creds.arn
}
