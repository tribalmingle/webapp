module "mongodb" {
  source            = "./modules/mongodb-atlas"
  org_id            = var.atlas_org_id
  project_id        = var.atlas_project_id
  allowed_cidrs     = var.allowed_cidrs
  aws_account_id    = var.aws_account_id
  aws_region        = var.aws_region
  db_user_password  = random_password.mongo_app.result
}

resource "random_password" "mongo_app" {
  length  = 24
  special = true
}

module "redis" {
  source              = "./modules/redis-enterprise"
  subscription_name   = var.redis_subscription_name
  payment_method_id   = var.redis_payment_method_id
  region              = var.redis_cloud_region
}

module "neon" {
  source       = "./modules/neon-postgres"
  org_id       = var.neon_org_id
  project_name = var.neon_project_name
  branch_name  = var.neon_branch_name
}

module "search" {
  source        = "./modules/search"
  algolia_app_id = var.algolia_app_id
  algolia_prefix = "tribalmingle-${terraform.workspace}"
}

module "storage" {
  source            = "./modules/storage"
  s3_media_domain   = var.s3_media_domain
  s3_marketing_domain = var.s3_marketing_domain
  aws_region        = var.aws_region
}

module "pinecone" {
  source       = "./modules/pinecone"
  project_name = "tribalmingle-${terraform.workspace}"
}
