variable "subscription_name" {
  type = string
}

variable "payment_method_id" {
  type = number
}

variable "region" {
  type = string
}

variable "memory_limit_gb" {
  type    = number
  default = 25
}
