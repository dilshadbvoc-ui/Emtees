#!/bin/bash
git add .
git commit -m "feat: Add department teachers many-to-many relationship"
git push origin main
ssh -i ~/Downloads/emtees.pem -o StrictHostKeyChecking=no ubuntu@13.235.19.185 << 'REMOTE_COMMANDS'
  cd ~/emtees/Emtees/server || cd ~/Emtees/server || cd /home/ubuntu/Emtees/server
  git pull origin main
  npm install
  npm run build
  pm2 restart emtees-api
REMOTE_COMMANDS
