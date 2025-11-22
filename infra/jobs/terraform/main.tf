resource "aws_msk_configuration" "default" {
  name = "${var.cluster_name}-config"
  kafka_versions = [var.kafka_version]
  server_properties = <<EOF
auto.create.topics.enable = true
num.partitions = 6
log.retention.hours = 168
min.insync.replicas = 2
EOF
}

resource "aws_msk_cluster" "this" {
  cluster_name           = var.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_broker_nodes
  broker_node_group_info {
    instance_type  = var.broker_instance_type
    client_subnets = var.private_subnet_ids
    security_groups = var.security_group_ids
  }
  configuration_info {
    arn      = aws_msk_configuration.default.arn
    revision = aws_msk_configuration.default.latest_revision
  }
  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }
}

resource "aws_msk_scram_secret_association" "etl" {
  cluster_arn = aws_msk_cluster.this.arn
  secret_arn  = aws_secretsmanager_secret.kafka_creds.arn
}

resource "aws_secretsmanager_secret" "kafka_creds" {
  name = "${var.cluster_name}-scram"
}

resource "aws_secretsmanager_secret_version" "kafka_creds" {
  secret_id     = aws_secretsmanager_secret.kafka_creds.id
  secret_string = jsonencode({ username = "etl", password = random_password.kafka_pw.result })
}

resource "random_password" "kafka_pw" {
  length  = 24
  special = true
}
