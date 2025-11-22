output "project_id" {
  value = neon_project.this.id
}

output "branch_id" {
  value = neon_branch.analytics.id
}

output "analytics_db" {
  value = neon_database.snapshots.name
}

output "etl_role" {
  value = {
    name     = neon_role.etl.name
    password = random_password.etl.result
  }
  sensitive = true
}

output "readonly_role" {
  value = {
    name     = neon_role.readonly.name
    password = random_password.readonly.result
  }
  sensitive = true
}
