output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "media_cdn_domain" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "marketing_bucket" {
  value = aws_s3_bucket.marketing.bucket
}

output "marketing_cdn_domain" {
  value = aws_cloudfront_distribution.marketing.domain_name
}
