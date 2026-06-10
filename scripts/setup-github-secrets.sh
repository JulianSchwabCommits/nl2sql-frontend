#!/bin/bash
# Script to set up GitHub secrets for nl2sql-frontend CI/CD pipeline
# This script configures all necessary secrets for GitHub Actions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  NL2SQL Frontend - GitHub Secrets Setup${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository (auto-detect or ask)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    echo -e "${YELLOW}Enter your GitHub repository (format: owner/repo):${NC}"
    read -r REPO
fi

echo -e "${GREEN}Setting up secrets for repository: ${REPO}${NC}"
echo ""

# ============================================
# AWS Configuration
# ============================================
echo -e "${YELLOW}1. AWS Configuration${NC}"

# AWS Region
AWS_REGION="eu-central-2"
echo "AWS Region: $AWS_REGION"

# AWS Role ARN for OIDC
echo -e "${YELLOW}Enter AWS Role ARN for GitHub OIDC (from backend setup):${NC}"
read -r AWS_ROLE_ARN

gh secret set AWS_REGION -b "$AWS_REGION" -R "$REPO"
gh secret set AWS_ROLE_ARN -b "$AWS_ROLE_ARN" -R "$REPO"

echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo ""

# ============================================
# ECR Configuration
# ============================================
echo -e "${YELLOW}2. ECR Configuration${NC}"

ECR_REPOSITORY_NAME="nl2sql-prod-frontend"
echo "ECR Repository Name: $ECR_REPOSITORY_NAME"

gh secret set ECR_REPOSITORY_NAME -b "$ECR_REPOSITORY_NAME" -R "$REPO"

echo -e "${GREEN}✅ ECR repository configured${NC}"
echo ""

# ============================================
# ECS Configuration
# ============================================
echo -e "${YELLOW}3. ECS Configuration${NC}"

ECS_CLUSTER_NAME="nl2sql-prod-frontend-cluster"
ECS_SERVICE_NAME="nl2sql-prod-frontend"
ECS_TASK_DEFINITION_FAMILY="nl2sql-prod-frontend"

echo "ECS Cluster: $ECS_CLUSTER_NAME"
echo "ECS Service: $ECS_SERVICE_NAME"
echo "ECS Task Definition Family: $ECS_TASK_DEFINITION_FAMILY"

gh secret set ECS_CLUSTER_NAME -b "$ECS_CLUSTER_NAME" -R "$REPO"
gh secret set ECS_SERVICE_NAME -b "$ECS_SERVICE_NAME" -R "$REPO"
gh secret set ECS_TASK_DEFINITION_FAMILY -b "$ECS_TASK_DEFINITION_FAMILY" -R "$REPO"

echo -e "${GREEN}✅ ECS configuration set${NC}"
echo ""

# ============================================
# Backend API Configuration
# ============================================
echo -e "${YELLOW}4. Backend API Configuration${NC}"

VITE_API_URL="http://nl2sql-prod-alb-1537341742.eu-central-2.elb.amazonaws.com"
echo "Backend API URL: $VITE_API_URL"
echo -e "${YELLOW}Press Enter to use the default or enter a different URL:${NC}"
read -r CUSTOM_API_URL
if [ -n "$CUSTOM_API_URL" ]; then
    VITE_API_URL="$CUSTOM_API_URL"
fi

gh secret set VITE_API_URL -b "$VITE_API_URL" -R "$REPO"

echo -e "${GREEN}✅ Backend API URL configured${NC}"
echo ""

# ============================================
# Frontend ALB DNS (optional - will be set after deployment)
# ============================================
echo -e "${YELLOW}5. Frontend ALB DNS (Optional)${NC}"
echo "This will be available after Terraform deployment."
echo -e "${YELLOW}Enter Frontend ALB DNS name (or press Enter to skip):${NC}"
read -r FRONTEND_ALB_DNS_NAME

if [ -n "$FRONTEND_ALB_DNS_NAME" ]; then
    gh secret set FRONTEND_ALB_DNS_NAME -b "$FRONTEND_ALB_DNS_NAME" -R "$REPO"
    echo -e "${GREEN}✅ Frontend ALB DNS configured${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped - You can set this later after Terraform deployment${NC}"
fi
echo ""

# ============================================
# Summary
# ============================================
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  ✅ GitHub Secrets Setup Complete!${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
echo "The following secrets have been configured for $REPO:"
echo "  - AWS_REGION: $AWS_REGION"
echo "  - AWS_ROLE_ARN: $AWS_ROLE_ARN"
echo "  - ECR_REPOSITORY_NAME: $ECR_REPOSITORY_NAME"
echo "  - ECS_CLUSTER_NAME: $ECS_CLUSTER_NAME"
echo "  - ECS_SERVICE_NAME: $ECS_SERVICE_NAME"
echo "  - ECS_TASK_DEFINITION_FAMILY: $ECS_TASK_DEFINITION_FAMILY"
echo "  - VITE_API_URL: $VITE_API_URL"
if [ -n "$FRONTEND_ALB_DNS_NAME" ]; then
    echo "  - FRONTEND_ALB_DNS_NAME: $FRONTEND_ALB_DNS_NAME"
fi
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Run ./scripts/setup-terraform-vars.sh to populate Terraform variables"
echo "  2. Run 'cd terraform && terraform init && terraform plan'"
echo "  3. Run 'cd terraform && terraform apply' to deploy infrastructure"
echo "  4. Push to the 'develop' branch to trigger the CI/CD pipeline"
echo ""
