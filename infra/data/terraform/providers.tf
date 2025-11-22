terraform {
  required_version = ">= 1.6.0"
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.21"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    rediscloud = {
      source  = "RedisLabs/rediscloud"
      version = "~> 1.6"
    }
    neon = {
      source  = "neondatabase/neon"
      version = "~> 0.2"
    }
    algolia = {
      source  = "algolia/algolia"
      version = "~> 1.0"
    }
    elasticstack = {
      source  = "elastic/elasticstack"
      version = "~> 0.7"
    }
    pinecone = {
      source  = "pinecone-io/pinecone"
      version = "~> 0.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

provider "aws" {
  region = var.aws_region
}

provider "rediscloud" {
  api_key    = var.redis_api_key
  api_secret = var.redis_api_secret
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "algolia" {
  app_id = var.algolia_app_id
  api_key = var.algolia_admin_key
}

provider "elasticstack" {
  kibana {
    endpoint = var.elastic_endpoint
    username = var.elastic_username
    password = var.elastic_password
  }
}

provider "pinecone" {
  api_key    = var.pinecone_api_key
  environment = var.pinecone_environment
}

provider "random" {}
