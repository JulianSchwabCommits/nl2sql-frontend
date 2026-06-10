variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-central-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nl2sql"
}

# Network Configuration - Import from backend
variable "vpc_id" {
  description = "VPC ID (from backend terraform output)"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs (from backend terraform output)"
  type        = list(string)
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_enable_container_insights" {
  description = "Enable CloudWatch Container Insights for ECS"
  type        = bool
  default     = false
}

variable "ecs_log_retention_days" {
  description = "CloudWatch log retention in days for ECS"
  type        = number
  default     = 7
}

variable "app_port" {
  description = "Application port (nginx serves on 80)"
  type        = number
  default     = 80
}

variable "app_image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# Backend API Configuration
variable "backend_api_url" {
  description = "Backend API URL for VITE_API_URL build arg"
  type        = string
}

# ALB Configuration
variable "alb_enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = false
}

# SSL Certificate
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (optional)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the frontend (e.g., app.example.com)"
  type        = string
  default     = ""
}

# CIDR blocks for ALB access
variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB (0.0.0.0/0 for public access)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Backend ALB Security Group (for allowing frontend to communicate with backend)
variable "backend_alb_security_group_id" {
  description = "Security group ID of the backend ALB"
  type        = string
}

# Tags
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
