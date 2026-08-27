#!/bin/bash
echo "Building client..."
npm run build --workspace=client

echo "Packaging client..."
rm -f client-dist.tar.gz
tar -czf client-dist.tar.gz client/dist/

echo "Uploading to AWS..."
scp -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no client-dist.tar.gz ubuntu@13.235.19.185:~

echo "Extracting on AWS..."
ssh -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no ubuntu@13.235.19.185 << 'REMOTE'
  rm -rf /home/ubuntu/frontend-dist
  mkdir -p /home/ubuntu/frontend-dist
  tar -xzf client-dist.tar.gz -C /home/ubuntu/frontend-dist/
REMOTE
echo "Done!"
