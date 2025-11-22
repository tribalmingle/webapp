variable "org_id" {
  type = string
}

variable "project_name" {
  type = string
}

variable "branch_name" {
  type    = string
  default = "main"
}

variable "compute_size" {
  type    = string
  default = "standard-small"
}
