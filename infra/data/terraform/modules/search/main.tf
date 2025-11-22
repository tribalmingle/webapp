resource "algolia_index" "marketing_pages" {
  name = "${var.algolia_prefix}_marketing_pages"
  settings_json = jsonencode({
    attributesToIndex = ["title", "body", "locale"],
    searchableAttributes = ["unordered(title)", "unordered(tags)", "body"],
    attributesForFaceting = ["locale", "category"],
    replicas = []
  })
}

resource "algolia_index" "member_discovery" {
  name = "${var.algolia_prefix}_member_profiles"
  settings_json = jsonencode({
    searchableAttributes = ["unordered(name)", "tribe", "tags", "bio"],
    customRanking = ["desc(match_score)", "asc(distance_km)"]
  })
}

resource "elasticstack_kibana_space" "ops" {
  space_id = var.elastic_space_id
  name     = "Ops"
  description = "Admin observability dashboards"
  initials    = "OP"
  color       = "#F87C56"
}

resource "elasticstack_kibana_data_view" "events" {
  space_id      = elasticstack_kibana_space.ops.space_id
  title         = "events-*"
  name          = "events"
  time_field_name = "@timestamp"
}
