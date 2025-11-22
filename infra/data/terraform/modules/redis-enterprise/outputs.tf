output "subscription_id" {
  value = rediscloud_subscription.global.id
}

output "database_id" {
  value = rediscloud_database.active_active.id
}

output "database_endpoint" {
  value = rediscloud_database.active_active.public_endpoint
}
