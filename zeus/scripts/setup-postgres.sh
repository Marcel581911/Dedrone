#!/bin/bash
# setup-postgres.sh — Install PostgreSQL and create the ZEUS database
# Run as root (or with sudo) on Ubuntu 22.04+
set -e

DB_USER="zeus"
DB_NAME="zeus"
DB_PASS=$(openssl rand -hex 16)

echo ""
echo "=== ZEUS PostgreSQL Setup ==="
echo ""

# Install PostgreSQL
apt-get update -q
apt-get install -y postgresql postgresql-contrib

# Ensure PostgreSQL is running
systemctl enable postgresql
systemctl start postgresql

# Create user and database
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || \
  sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true

# PostgreSQL 15+ requires explicit schema privileges
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null || true

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

echo ""
echo "✅ PostgreSQL ready."
echo ""
echo "DATABASE_URL=${DATABASE_URL}"
echo ""
echo "--- Next steps ---"
echo "1. Update your .env file:"
echo "   DATABASE_URL=${DATABASE_URL}"
echo ""
echo "2. Delete old SQLite migrations (they are SQLite-specific SQL):"
echo "   rm -rf zeus/backend/prisma/migrations/2026*"
echo ""
echo "3. Generate fresh PostgreSQL migrations from the schema:"
echo "   cd zeus/backend"
echo "   DATABASE_URL='${DATABASE_URL}' npx prisma migrate dev --name init"
echo ""
echo "4. Seed the database:"
echo "   DATABASE_URL='${DATABASE_URL}' npx prisma db seed"
echo ""
echo "5. Restart the service:"
echo "   systemctl restart zeus"
echo ""
