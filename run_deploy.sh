#!/bin/bash
echo "Building server..."
npm run build --workspace=server

echo "Packaging server..."
rm -f server-dist.tar.gz
tar -czf server-dist.tar.gz server/dist/ server/src/ server/package.json server/node_modules/ server/db/ contracts/

echo "Uploading to AWS..."
scp -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no server-dist.tar.gz ubuntu@13.235.19.185:~

echo "Extracting and restarting on AWS..."
ssh -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no ubuntu@13.235.19.185 << 'REMOTE'
  rm -rf /home/ubuntu/emtees-api/server
  mkdir -p /home/ubuntu/emtees-api/server
  tar -xzf server-dist.tar.gz -C /home/ubuntu/emtees-api/
  
  cd /home/ubuntu/emtees-api/server
  npm install
  pm2 restart emtees-api
REMOTE
echo "Done!"
