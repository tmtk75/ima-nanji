import {
  to = github_repository.this
  id = "ima-nanji"
}

resource "github_repository" "this" {
  name        = var.repo_name
  description = "Timezone comparison SPA"
  visibility  = "public"

  has_issues   = true
  has_projects = false
  has_wiki     = false

  allow_merge_commit = false
  allow_squash_merge = true
  allow_rebase_merge = false

  delete_branch_on_merge = true

  pages {
    build_type = "workflow"
  }
}
