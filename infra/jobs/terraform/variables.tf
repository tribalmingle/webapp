variable "aws_region" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "kafka_version" {
  type = string
}

variable "broker_instance_type" {
  type = string
}

variable "number_of_broker_nodes" {
  type = number
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}
