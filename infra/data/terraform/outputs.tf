output "mongodb" {
  value = {
    cluster   = module.mongodb.cluster_name
    user      = module.mongodb.db_username
    conn_str  = module.mongodb.connection_string
    kms_key   = module.mongodb.kms_key_arn
  }
  sensitive = true
}

output "redis" {
  value = {
    subscription_id = module.redis.subscription_id
    database_id     = module.redis.database_id
    endpoint        = module.redis.database_endpoint
  }
}

output "neon" {
  value = {
    project_id    = module.neon.project_id
    branch_id     = module.neon.branch_id
    analytics_db  = module.neon.analytics_db
    etl_role      = module.neon.etl_role
    readonly_role = module.neon.readonly_role
  }
  sensitive = true
}

output "search" {
  value = module.search.algolia_indexes
}

output "storage" {
  value = {
    media_bucket      = module.storage.media_bucket
    media_cdn_domain  = module.storage.media_cdn_domain
    marketing_bucket  = module.storage.marketing_bucket
    marketing_cdn_domain = module.storage.marketing_cdn_domain
  }
}

output "pinecone" {
  value = module.pinecone.index_name
}
