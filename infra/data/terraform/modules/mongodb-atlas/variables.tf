variable "org_id" {
  type = string
}

variable "project_id" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "tribalmingle-global"
}

variable "aws_account_id" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "allowed_cidrs" {
  type = list(string)
}

variable "db_username" {
  type    = string
  default = "tm_app"
}

variable "db_user_password" {
  type      = string
  sensitive = true
}
