variable "atlas_org_id" {
  type = string
}

variable "atlas_project_id" {
  type = string
}

variable "atlas_public_key" {
  type = string
  sensitive = true
}

variable "atlas_private_key" {
  type = string
  sensitive = true
}

variable "allowed_cidrs" {
  type = list(string)
  default = []
}

variable "aws_account_id" {
  type = string
}

variable "aws_region" {
  type = string
  default = "us-east-1"
}

variable "redis_api_key" {
  type      = string
  sensitive = true
}

variable "redis_api_secret" {
  type      = string
  sensitive = true
}

variable "redis_subscription_name" {
  type = string
}

variable "redis_payment_method_id" {
  type = number
}

variable "redis_cloud_region" {
  type    = string
  default = "us-east-1"
}

variable "neon_api_key" {
  type      = string
  sensitive = true
}

variable "neon_org_id" {
  type = string
}

variable "neon_project_name" {
  type = string
}

variable "neon_branch_name" {
  type    = string
  default = "main"
}

variable "algolia_app_id" {
  type = string
}

variable "algolia_admin_key" {
  type      = string
  sensitive = true
}

variable "elastic_endpoint" {
  type = string
}

variable "elastic_username" {
  type = string
}

variable "elastic_password" {
  type      = string
  sensitive = true
}

variable "s3_media_domain" {
  type = string
}

variable "s3_marketing_domain" {
  type = string
}

variable "pinecone_api_key" {
  type      = string
  sensitive = true
}

variable "pinecone_environment" {
  type = string
}
