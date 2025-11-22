resource "pinecone_index" "recommendations" {
  name      = "${var.project_name}-recs"
  dimension = var.dimension
  metric    = "cosine"
  pods      = 1
  replicas  = 1
  pod_type  = "p1.x1"
  source_collection = null
  metadata_config = jsonencode({
    indexed = ["userId", "context"]
  })
  tags = {
    env = terraform.workspace
  }
}
