#!/bin/bash
# Quick setup script for GitHub secrets - uses values from backend
# Run this after setup-terraform-vars.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up GitHub secrets for nl2sql-frontend...${NC}"
echo ""

# Get AWS Role ARN from backend
cd ../nl2sql-backend
AWS_ROLE_ARN=$(gh secret list | grep AWS_ROLE_ARN -A 0 | awk '{print $1}')
if [ -z "$AWS_ROLE_ARN" ]; then
    echo -e "${YELLOW}Could not fetch AWS_ROLE_ARN from backend.${NC}"
    echo "Please run ./scripts/setup-github-secrets.sh instead."
    exit 1
fi

cd ../nl2sql-frontend

# Set secrets
gh secret set AWS_REGION -b "eu-central-2"
gh secret set AWS_ROLE_ARN -b "$(cd ../nl2sql-backend && gh secret get AWS_ROLE_ARN 2>/dev/null || echo 'arn:aws:iam::YOUR_ACCOUNT:role/github-actions-role')"
gh secret set ECR_REPOSITORY_NAME -b "nl2sql-prod-frontend"
gh secret set ECS_CLUSTER_NAME -b "nl2sql-prod-frontend-cluster"
gh secret set ECS_SERVICE_NAME -b "nl2sql-prod-frontend"
gh secret set ECS_TASK_DEFINITION_FAMILY -b "nl2sql-prod-frontend"
gh secret set VITE_API_URL -b "http://nl2sql-prod-alb-1537341742.eu-central-2.elb.amazonaws.com"

echo -e "${GREEN}✅ GitHub secrets configured!${NC}"
echo ""
echo "Next: cd terraform && terraform init && terraform plan"
