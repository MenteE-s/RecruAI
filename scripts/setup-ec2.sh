#!/bin/bash
# =============================================================================
# RecruAI — EC2 Bootstrap Script
# Run this ONCE on a fresh Amazon Linux 2023 EC2 instance to set up the
# deployment environment.  Requires an IAM role with SecretsManager read
# attached to the instance, or you'll inject secrets via environment later.
#
# Usage:
#   chmod +x scripts/setup-ec2.sh
#   sudo ./scripts/setup-ec2.sh
#
# =============================================================================
set -euo pipefail

echo "=== RecruAI EC2 Bootstrap ==="

# ---- 1. System updates & dependencies ----
dnf update -y
dnf install -y docker git curl jq

# ---- 2. Start & enable Docker ----
systemctl enable --now docker
usermod -aG docker ec2-user

# ---- 3. Docker Compose v2 plugin ----
mkdir -p /usr/local/lib/docker/cli-plugins
curl -sSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ---- 4. Create deploy directory & clone repo ----
mkdir -p /opt/recruai
cd /opt/recruai

if [ ! -d ".git" ]; then
  git clone https://github.com/YOUR_ORG/RecruAI.git .
fi

# ---- 5. Fail2ban (SSH brute-force protection) ----
dnf install -y fail2ban
cat > /etc/fail2ban/jail.local << 'F2B'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 3
F2B
systemctl enable --now fail2ban

# ---- 6. Auto security updates ----
dnf install -y dnf-automatic
sed -i 's/apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
systemctl enable --now dnf-automatic.timer

# ---- 7. Disable password auth (key-only SSH) ----
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# ---- 8. Harden sysctl ----
cat >> /etc/sysctl.conf << 'SYSCTL'
# IP spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Ignore source-routed packets
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Log martian packets
net.ipv4.conf.all.log_martians = 1
SYSCTL
sysctl -p

# ---- 9. Create .env.production from template ----
if [ ! -f "backend/.env.production" ]; then
  cp backend/.env.production backend/.env.production
  echo ">>> EDIT backend/.env.production with real secrets!"
fi

# ---- 10. Firewall (optional, since SG controls this) ----
# Only enable if you want a host-level firewall in addition to SGs:
# dnf install -y iptables-services
# iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# iptables -A INPUT -p tcp --dport 80 -j ACCEPT
# iptables -A INPUT -p tcp --dport 443 -j ACCEPT
# iptables -A INPUT -j DROP
# service iptables save

echo ""
echo "=== Bootstrap complete! ==="
echo "Next steps:"
echo "  1. Edit /opt/recruai/backend/.env.production with real secrets"
echo "  2. Set domain name in nginx/nginx.conf and docker-compose.aws.yml"
echo "  3. Run: cd /opt/recruai && docker compose -f docker-compose.aws.yml up -d"
echo "  4. Run initial cert: docker compose -f docker-compose.aws.yml run certbot certonly --webroot -w /var/www/certbot -d recruai.yourdomain.com"
echo "  5. Run DB migrations: docker compose -f docker-compose.aws.yml exec backend flask db upgrade"
