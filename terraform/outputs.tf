output "pages_url" {
  description = "GitHub Pages URL"
  value       = "https://${var.github_owner}.github.io/${var.repo_name}"
}

output "repo_url" {
  description = "GitHub repository URL"
  value       = github_repository.this.html_url
}
