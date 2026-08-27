#!/bin/bash
set -e

echo "=== Building server ==="
npm run build --workspace=server

echo "=== Building client ==="
npm run build --workspace=client

echo "=== Packaging server (src + db + contracts + config) ==="
rm -f server-dist.tar.gz
tar -czf server-dist.tar.gz \
  server/src/ \
  server/db/ \
  server/dist/ \
  server/package.json \
  server/tsconfig.json \
  server/.env \
  server/global-bundle.pem \
  contracts/

echo "=== Packaging client ==="
rm -f client-dist.tar.gz
tar -czf client-dist.tar.gz client/dist/

echo "=== Uploading to AWS ==="
scp -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no server-dist.tar.gz ubuntu@13.235.19.185:~
scp -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no client-dist.tar.gz ubuntu@13.235.19.185:~

echo "=== Deploying on AWS ==="
ssh -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no ubuntu@13.235.19.185 << 'REMOTE'
  # Extract server (preserve existing node_modules)
  cd /home/ubuntu/emtees-api
  tar -xzf ~/server-dist.tar.gz

  # Install deps natively on Linux (do NOT copy macOS node_modules)
  cd /home/ubuntu/emtees-api/server
  npm install

  # Extract client to nginx root
  sudo rm -rf /var/www/emtees/client/dist
  sudo mkdir -p /var/www/emtees/client/
  tar -xzf ~/client-dist.tar.gz -C /tmp/
  sudo cp -r /tmp/client/dist /var/www/emtees/client/dist
  sudo chown -R www-data:www-data /var/www/emtees/client/dist
  rm -rf /tmp/client

  # Restart server
  pm2 restart emtees-api
  pm2 save
REMOTE

echo "=== Deploy complete! ==="
