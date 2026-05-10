terraform {
  required_version = ">= 1.6.0"
  required_providers {
    fly      = { source = "fly-apps/fly", version = "~> 0.0.23" }
    vercel   = { source = "vercel/vercel", version = "~> 1.13" }
  }
}

variable "fly_org" { type = string }
variable "vercel_team_id" { type = string }
variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

# --- Fly: Postgres + Redis + API + Worker ---
resource "fly_app" "api" {
  name = "aiready-api"
  org  = var.fly_org
}

resource "fly_app" "worker" {
  name = "aiready-worker"
  org  = var.fly_org
}

# --- Vercel: web ---
resource "vercel_project" "web" {
  name      = "aiready-web"
  framework = "nextjs"
  team_id   = var.vercel_team_id

  root_directory = "apps/web"

  environment = [
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = "https://aiready-api.fly.dev"
      target = ["production", "preview"]
    },
    {
      key       = "ANTHROPIC_API_KEY"
      value     = var.anthropic_api_key
      target    = ["production"]
      sensitive = true
    },
  ]
}
