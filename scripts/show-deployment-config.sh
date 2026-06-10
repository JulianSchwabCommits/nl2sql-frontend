#!/bin/bash
# Script to display current deployment configuration for nl2sql-frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  NL2SQL Frontend - Deployment Configuration${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

# Check if terraform directory exists
if [ ! -d "terraform" ]; then
    echo -e "${RED}❌ Terraform directory not found${NC}"
    exit 1
fi

cd terraform

# Check if terraform is initialized
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}⚠️  Terraform not initialized${NC}"
    echo "Run: terraform init"
    echo ""
fi

# Check if state exists
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}⚠️  No infrastructure deployed yet${NC}"
    echo ""
    echo "To deploy:"
    echo "  ./scripts/setup-complete-deployment.sh"
    echo ""
    exit 0
fi

# Get outputs
echo -e "${GREEN}Infrastructure Details:${NC}"
echo ""

ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "Not available")
ECR_REPO_NAME=$(terraform output -raw ecr_repository_name 2>/dev/null || echo "Not available")
ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "Not available")
ECS_SERVICE_NAME=$(terraform output -raw ecs_service_name 2>/dev/null || echo "Not available")
ALB_DNS_NAME=$(terraform output -raw alb_dns_name 2>/dev/null || echo "Not available")
FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "Not available")

echo -e "${YELLOW}ECR Repository:${NC}"
echo "  URL: $ECR_REPO_URL"
echo "  Name: $ECR_REPO_NAME"
echo ""

echo -e "${YELLOW}ECS Configuration:${NC}"
echo "  Cluster: $ECS_CLUSTER_NAME"
echo "  Service: $ECS_SERVICE_NAME"
echo ""

echo -e "${YELLOW}Load Balancer:${NC}"
echo "  DNS Name: $ALB_DNS_NAME"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# Get ECS service status
if [ "$ECS_CLUSTER_NAME" != "Not available" ] && [ "$ECS_SERVICE_NAME" != "Not available" ]; then
    echo -e "${YELLOW}ECS Service Status:${NC}"
    aws ecs describe-services \
        --cluster "$ECS_CLUSTER_NAME" \
        --services "$ECS_SERVICE_NAME" \
        --region eu-central-2 \
        --query 'services[0].[status,runningCount,desiredCount]' \
        --output text 2>/dev/null | while read -r status running desired; do
        echo "  Status: $status"
        echo "  Running Tasks: $running"
        echo "  Desired Tasks: $desired"
    done
    echo ""
fi

# Get latest ECR images
if [ "$ECR_REPO_NAME" != "Not available" ]; then
    echo -e "${YELLOW}Latest ECR Images:${NC}"
    aws ecr describe-images \
        --repository-name "$ECR_REPO_NAME" \
        --region eu-central-2 \
        --query 'reverse(sort_by(imageDetails, &imagePushedAt))[:5].[imageTags[0],imagePushedAt]' \
        --output table 2>/dev/null || echo "  No images found"
    echo ""
fi

cd ..

# Check GitHub secrets
echo -e "${YELLOW}GitHub Secrets Status:${NC}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -n "$REPO" ]; then
    echo "  Repository: $REPO"
    gh secret list -R "$REPO" 2>/dev/null | grep -E "(AWS_|ECR_|ECS_|VITE_|FRONTEND_)" || echo "  No secrets found"
else
    echo "  Not in a Git repository"
fi
echo ""

# Summary
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Quick Commands${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/nl2sql-prod-frontend --follow --region eu-central-2"
echo ""
echo "Force new deployment:"
echo "  aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --force-new-deployment --region eu-central-2"
echo ""
echo "Access application:"
echo "  $FRONTEND_URL"
echo ""
