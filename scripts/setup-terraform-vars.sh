#!/bin/bash
# Script to populate terraform.tfvars with values from backend terraform outputs
# This script fetches values from the backend infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  NL2SQL Frontend - Terraform Variables Setup${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""

# Navigate to backend terraform directory
BACKEND_TERRAFORM_DIR="../nl2sql-backend/terraform"

if [ ! -d "$BACKEND_TERRAFORM_DIR" ]; then
    echo -e "${RED}❌ Backend terraform directory not found at: $BACKEND_TERRAFORM_DIR${NC}"
    echo "Please make sure the backend infrastructure is deployed first."
    exit 1
fi

echo -e "${YELLOW}Fetching values from backend terraform outputs...${NC}"
echo ""

# Fetch backend outputs
cd "$BACKEND_TERRAFORM_DIR"

# Check if terraform state exists
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${RED}❌ Backend terraform state not found.${NC}"
    echo "Please run 'terraform apply' in the backend directory first."
    exit 1
fi

# Get outputs
VPC_ID=$(terraform output -raw vpc_id 2>/dev/null || echo "")
PUBLIC_SUBNET_IDS=$(terraform output -json public_subnet_ids 2>/dev/null || echo "[]")
BACKEND_ALB_SG_ID=$(terraform output -raw alb_security_group_id 2>/dev/null || echo "")

if [ -z "$VPC_ID" ] || [ -z "$BACKEND_ALB_SG_ID" ]; then
    echo -e "${RED}❌ Could not fetch required outputs from backend terraform.${NC}"
    echo "Make sure the backend infrastructure is fully deployed."
    exit 1
fi

echo -e "${GREEN}✅ Backend outputs fetched successfully:${NC}"
echo "  VPC ID: $VPC_ID"
echo "  Public Subnet IDs: $PUBLIC_SUBNET_IDS"
echo "  Backend ALB Security Group ID: $BACKEND_ALB_SG_ID"
echo ""

# Return to frontend directory
cd - > /dev/null
cd terraform

# Check if terraform.tfvars already exists
if [ -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}terraform.tfvars already exists.${NC}"
    echo -e "${YELLOW}Do you want to overwrite it? (y/n):${NC}"
    read -r OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo -e "${YELLOW}⏭️  Skipping terraform.tfvars creation${NC}"
        echo "You can manually update the file with these values:"
        echo "  vpc_id = \"$VPC_ID\""
        echo "  public_subnet_ids = $PUBLIC_SUBNET_IDS"
        echo "  backend_alb_security_group_id = \"$BACKEND_ALB_SG_ID\""
        exit 0
    fi
fi

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
# AWS Configuration
aws_region  = "eu-central-2"
environment = "prod"

# Project
project_name = "nl2sql"

# Network Configuration (from backend terraform outputs)
vpc_id             = "$VPC_ID"
public_subnet_ids  = $PUBLIC_SUBNET_IDS
backend_alb_security_group_id = "$BACKEND_ALB_SG_ID"

# Backend API Configuration
backend_api_url = "http://nl2sql-prod-alb-1537341742.eu-central-2.elb.amazonaws.com"

# ECS Configuration
ecs_task_cpu                  = 256   # 0.25 vCPU (frontend needs less than backend)
ecs_task_memory               = 512   # 512 MB
ecs_desired_count             = 1
ecs_enable_container_insights = false
ecs_log_retention_days        = 7

# Application
app_port       = 80
app_image_tag  = "latest"

# Domain & SSL (optional)
domain_name         = ""  # Set your domain, e.g., "app.example.com"
acm_certificate_arn = ""  # Set your ACM certificate ARN

# ALB
alb_enable_deletion_protection = false

# Network Access
allowed_cidr_blocks = ["0.0.0.0/0"]  # Allow public access
EOF

echo -e "${GREEN}✅ terraform.tfvars created successfully!${NC}"
echo ""
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  Next Steps${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
echo "1. Review terraform.tfvars and adjust values if needed"
echo "2. Initialize Terraform:"
echo "   cd terraform"
echo "   terraform init"
echo ""
echo "3. Review the plan:"
echo "   terraform plan"
echo ""
echo "4. Apply the infrastructure:"
echo "   terraform apply"
echo ""
echo "5. After applying, update GitHub secret FRONTEND_ALB_DNS_NAME:"
echo "   terraform output alb_dns_name"
echo "   gh secret set FRONTEND_ALB_DNS_NAME -b \"<alb-dns-name>\""
echo ""
