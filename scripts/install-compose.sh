#!/bin/bash
set -euo pipefail
sudo mkdir -p /usr/local/lib/docker/cli-plugins
LATEST=$(curl -sSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /tmp/docker-compose)
sudo mv /tmp/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
