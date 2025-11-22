output "algolia_indexes" {
  value = {
    marketing = algolia_index.marketing_pages.name
    members   = algolia_index.member_discovery.name
  }
}

output "kibana_space" {
  value = elasticstack_kibana_space.ops.space_id
}
