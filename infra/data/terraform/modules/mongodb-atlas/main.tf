resource "aws_kms_key" "csfle" {
  description             = "MongoDB CSFLE master key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action = "kms:*"
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "csfle" {
  name          = "alias/mongodb-csfle"
  target_key_id = aws_kms_key.csfle.key_id
}

resource "mongodbatlas_project_ip_access_list" "cidrs" {
  count      = length(var.allowed_cidrs)
  project_id = var.project_id
  cidr_block = var.allowed_cidrs[count.index]
  comment    = "Terraform managed"
}

resource "mongodbatlas_advanced_cluster" "global" {
  project_id   = var.project_id
  name         = var.cluster_name
  cluster_type = "GEOSHARDED"
  backing_provider_name = "AWS"
  termination_protection_enabled = true

  replication_specs {
    num_shards = 1
    region_configs {
      priority      = 7
      region_name   = "US_EAST_1"
      electable_nodes = 3
      read_only_nodes = 0
      analytics_nodes = 1
      instance_size = "M10"
    }
    region_configs {
      priority      = 6
      region_name   = "EU_WEST_1"
      electable_nodes = 3
      read_only_nodes = 0
      analytics_nodes = 1
      instance_size = "M10"
    }
  }

  tags = {
    env = terraform.workspace
  }
}

resource "mongodbatlas_database_user" "app" {
  username     = var.db_username
  password     = var.db_user_password
  project_id   = var.project_id
  auth_database_name = "admin"

  roles {
    role_name     = "readWriteAnyDatabase"
    database_name = "admin"
  }

  labels {
    key   = "app"
    value = "tribalmingle"
  }
}

resource "mongodbatlas_encryption_at_rest" "csfle" {
  project_id = var.project_id

  aws_kms {
    enabled                   = true
    customer_master_key_id    = aws_kms_key.csfle.arn
    region                    = var.aws_region
    role_id                   = aws_iam_role.atlas_kms_role.id
  }
}

resource "aws_iam_role" "atlas_kms_role" {
  name = "mongodb-atlas-kms"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::515241653916:root" # MongoDB Atlas Management
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "atlas_kms" {
  name = "mongodb-atlas-kms"
  role = aws_iam_role.atlas_kms_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:DescribeKey",
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.csfle.arn
      }
    ]
  })
}
