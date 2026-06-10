# Security Group for Frontend ALB
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-frontend-alb-sg"
  description = "Security group for frontend Application Load Balancer"
  vpc_id      = var.vpc_id

  # Allow HTTP from anywhere
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Allow HTTPS from anywhere (if SSL certificate is configured)
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-alb-sg"
  }
}

# Security Group for Frontend ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-frontend-ecs-tasks-sg"
  description = "Security group for frontend ECS tasks"
  vpc_id      = var.vpc_id

  # Allow traffic from frontend ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow traffic from itself (for potential clustering)
  ingress {
    description = "All traffic from itself"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  # Allow all outbound traffic (to reach backend API)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-ecs-tasks-sg"
  }
}

# Security group rule to allow frontend ECS tasks to access backend ALB
resource "aws_security_group_rule" "frontend_to_backend" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = var.backend_alb_security_group_id
  source_security_group_id = aws_security_group.ecs_tasks.id
  description              = "Allow frontend to access backend"
}
