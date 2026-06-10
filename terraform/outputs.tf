output "ecr_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_repository_name" {
  description = "Frontend ECR repository name"
  value       = aws_ecr_repository.frontend.name
}

output "ecs_cluster_name" {
  description = "Frontend ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_id" {
  description = "Frontend ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "ecs_task_definition_family" {
  description = "Frontend ECS task definition family"
  value       = aws_ecs_task_definition.frontend.family
}

output "alb_dns_name" {
  description = "Frontend ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "Frontend ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Frontend ALB Zone ID (for Route53)"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "Frontend ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_tasks_security_group_id" {
  description = "Frontend ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}
