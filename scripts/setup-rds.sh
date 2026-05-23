#!/bin/bash
# =============================================================================
# RecruAI — AWS RDS PostgreSQL Setup
# =============================================================================
# Creates an RDS PostgreSQL instance with pgvector support in your existing VPC.
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - A VPC with at least one public and one private subnet
#   - Existing EC2 instance in the same VPC
#
# Usage:
#   chmod +x scripts/setup-rds.sh
#   ./scripts/setup-rds.sh
# =============================================================================
set -euo pipefail

# ---- Config ----
DB_INSTANCE_IDENTIFIER="recruai-db"
DB_USERNAME="recruai"
DB_PASSWORD="${RDS_PASSWORD:?Must set RDS_PASSWORD env var}"
DB_NAME="recruai"
DB_INSTANCE_CLASS="db.t3.micro"
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
DB_STORAGE="20"  # GB
DB_STORAGE_TYPE="gp3"
DB_PORT="5432"
VPC_ID="${VPC_ID:?Must set VPC_ID env var}"
EC2_SECURITY_GROUP_ID="${EC2_SG_ID:?Must set EC2_SG_ID env var}"

# ---- 1. Create DB subnet group ----
echo "=== Creating DB subnet group ==="
aws rds create-db-subnet-group \
  --db-subnet-group-name "${DB_INSTANCE_IDENTIFIER}-subnet-group" \
  --db-subnet-group-description "Subnet group for RecruAI RDS" \
  --subnet-ids "$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query 'Subnets[].SubnetId' --output text | tr '\t' ' ')"

# ---- 2. Create RDS security group ----
echo "=== Creating RDS security group ==="
RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name "${DB_INSTANCE_IDENTIFIER}-sg" \
  --description "Security group for RecruAI RDS PostgreSQL" \
  --vpc-id "${VPC_ID}" \
  --query 'GroupId' --output text)

# Allow PostgreSQL from EC2 security group only
aws ec2 authorize-security-group-ingress \
  --group-id "${RDS_SG_ID}" \
  --protocol tcp \
  --port 5432 \
  --source-group "${EC2_SECURITY_GROUP_ID}"

echo "RDS Security Group ID: ${RDS_SG_ID}"

# ---- 3. Create RDS instance ----
echo "=== Creating RDS PostgreSQL instance ==="
aws rds create-db-instance \
  --db-instance-identifier "${DB_INSTANCE_IDENTIFIER}" \
  --db-name "${DB_NAME}" \
  --db-instance-class "${DB_INSTANCE_CLASS}" \
  --engine "${DB_ENGINE}" \
  --engine-version "${DB_ENGINE_VERSION}" \
  --master-username "${DB_USERNAME}" \
  --master-user-password "${DB_PASSWORD}" \
  --allocated-storage "${DB_STORAGE}" \
  --storage-type "${DB_STORAGE_TYPE}" \
  --vpc-security-group-ids "${RDS_SG_ID}" \
  --db-subnet-group-name "${DB_INSTANCE_IDENTIFIER}-subnet-group" \
  --port "${DB_PORT}" \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --auto-minor-version-version-upgrade \
  --storage-encrypted \
  --deletion-protection \
  --no-publicly-accessible \
  --tags Key=Project,Value=RecruAI Key=Environment,Value=Production

echo ""
echo "=== RDS instance being created ==="
echo "This takes 5–10 minutes. Monitor with:"
echo "  aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_IDENTIFIER} --query 'DBInstances[0].DBInstanceStatus'"
echo ""
echo "Once available, get the endpoint:"
echo "  aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_IDENTIFIER} --query 'DBInstances[0].Endpoint.Address' --output text"
echo ""
echo "Then enable pgvector:"
echo "  CREATE EXTENSION vector;"
echo ""
echo "Connection string:"
echo "  postgresql://${DB_USERNAME}:${DB_PASSWORD}@<endpoint>:${DB_PORT}/${DB_NAME}"
