resource "neon_project" "this" {
  name   = var.project_name
  org_id = var.org_id
}

resource "neon_branch" "analytics" {
  project_id = neon_project.this.id
  name       = var.branch_name
}

resource "neon_database" "snapshots" {
  branch_id = neon_branch.analytics.id
  name      = "analytics_snapshots"
}

resource "neon_role" "etl" {
  branch_id = neon_branch.analytics.id
  name      = "etl_writer"
  password  = random_password.etl.result
}

resource "neon_role" "readonly" {
  branch_id = neon_branch.analytics.id
  name      = "lakehouse_reader"
  password  = random_password.readonly.result
}

resource "random_password" "etl" {
  length  = 24
  special = true
}

resource "random_password" "readonly" {
  length  = 24
  special = true
}
