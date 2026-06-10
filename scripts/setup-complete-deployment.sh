#!/bin/bash
# Complete deployment setup script for nl2sql-frontend
# This script orchestrates the entire deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  NL2SQL Frontend - Complete Deployment Setup${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed.${NC}"
    exit 1
fi

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not installed.${NC}"
    exit 1
fi

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    exit 1
fi

# Check GitHub authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Setup Terraform variables
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Step 1: Setting up Terraform variables${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

./scripts/setup-terraform-vars.sh

echo ""

# Step 2: Initialize and apply Terraform
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Step 2: Deploying Infrastructure with Terraform${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

cd terraform

echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

echo ""
echo -e "${YELLOW}Running Terraform plan...${NC}"
terraform plan -out=tfplan

echo ""
echo -e "${YELLOW}Do you want to apply this plan? (y/n):${NC}"
read -r APPLY_CONFIRM

if [ "$APPLY_CONFIRM" = "y" ] || [ "$APPLY_CONFIRM" = "Y" ]; then
    echo -e "${YELLOW}Applying Terraform...${NC}"
    terraform apply tfplan
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
    
    # Get outputs
    ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
    ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
    ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    
    echo ""
    echo -e "${GREEN}Infrastructure Details:${NC}"
    echo "  ECR Repository: $ECR_REPO_URL"
    echo "  ECS Cluster: $ECS_CLUSTER_NAME"
    echo "  ECS Service: $ECS_SERVICE_NAME"
    echo "  ALB DNS: $ALB_DNS_NAME"
    echo ""
    
    # Update GitHub secret with ALB DNS
    echo -e "${YELLOW}Updating GitHub secret FRONTEND_ALB_DNS_NAME...${NC}"
    cd ..
    gh secret set FRONTEND_ALB_DNS_NAME -b "$ALB_DNS_NAME"
    echo -e "${GREEN}✅ GitHub secret updated${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping Terraform apply${NC}"
    cd ..
    exit 0
fi

cd ..

# Step 3: Setup GitHub secrets
echo ""
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Step 3: Setting up GitHub Secrets${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

./scripts/setup-github-secrets.sh

# Step 4: Build and push initial Docker image
echo ""
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Step 4: Building and Pushing Initial Docker Image${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

echo -e "${YELLOW}Do you want to build and push the initial Docker image? (y/n):${NC}"
read -r BUILD_CONFIRM

if [ "$BUILD_CONFIRM" = "y" ] || [ "$BUILD_CONFIRM" = "Y" ]; then
    # Get ECR repository URL
    cd terraform
    ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
    cd ..
    
    # Login to ECR
    echo -e "${YELLOW}Logging in to ECR...${NC}"
    aws ecr get-login-password --region eu-central-2 | docker login --username AWS --password-stdin "$ECR_REPO_URL"
    
    # Build Docker image
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build \
        --build-arg VITE_API_URL=http://nl2sql-prod-alb-1537341742.eu-central-2.elb.amazonaws.com \
        -t "$ECR_REPO_URL:latest" \
        .
    
    # Push to ECR
    echo -e "${YELLOW}Pushing image to ECR...${NC}"
    docker push "$ECR_REPO_URL:latest"
    
    echo -e "${GREEN}✅ Docker image pushed successfully!${NC}"
    
    # Update ECS service to use new image
    echo -e "${YELLOW}Updating ECS service...${NC}"
    cd terraform
    ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name)
    cd ..
    
    aws ecs update-service \
        --cluster "$ECS_CLUSTER_NAME" \
        --service "$ECS_SERVICE_NAME" \
        --force-new-deployment \
        --region eu-central-2
    
    echo -e "${GREEN}✅ ECS service updated!${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping Docker build${NC}"
fi

# Final summary
echo ""
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  🎉 Deployment Complete!${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""
echo -e "${GREEN}Your nl2sql-frontend is now deployed!${NC}"
echo ""
echo "Access your application at:"
cd terraform
ALB_DNS_NAME=$(terraform output -raw alb_dns_name 2>/dev/null || echo "Check AWS Console")
cd ..
echo -e "${GREEN}  http://$ALB_DNS_NAME${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the application in your browser"
echo "  2. Push changes to the 'develop' branch to trigger CI/CD"
echo "  3. Monitor deployments in GitHub Actions"
echo "  4. View logs in CloudWatch: /ecs/nl2sql-prod-frontend"
echo ""
echo -e "${YELLOW}To set up a custom domain:${NC}"
echo "  1. Create an ACM certificate in AWS Certificate Manager"
echo "  2. Update terraform.tfvars with domain_name and acm_certificate_arn"
echo "  3. Run 'terraform apply' again"
echo "  4. Create a CNAME record pointing to the ALB DNS"
echo ""
