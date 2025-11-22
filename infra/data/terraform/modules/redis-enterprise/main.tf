resource "rediscloud_subscription" "global" {
  name                 = var.subscription_name
  payment_method_id    = var.payment_method_id
  memory_storage       = "ram"
  persistent_storage   = "none"
  throughput_measurement_by = "operations-per-second"

  creation_plan {
    memory_limit_in_gb = var.memory_limit_gb
    quantity           = 1
    replication        = "single"
    support_oss_cluster_api = true
    modules = [
      "redisjson",
      "redisbloom",
      "redisgears"
    ]
    cloud_provider {
      provider  = "AWS"
      region    = var.region
      networking {
        deployment_cidr = "10.34.0.0/24"
      }
    }
  }
}

resource "rediscloud_database" "active_active" {
  subscription_id = rediscloud_subscription.global.id
  name            = "tribalmingle-cache"
  protocol        = "redis"
  memory_limit_in_gb = 5
  replication     = true
  throughput_measurement_by = "operations-per-second"
  throughput_measurement_value = 10000
  modules = [
    "redisjson"
  ]
}
