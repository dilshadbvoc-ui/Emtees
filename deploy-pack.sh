#!/bin/bash
# deploy-pack.sh
# Packages the server and its required workspace dependencies (like contracts) for deployment

echo "Packing Emtees deployment archive..."

# Remove old archive if it exists
rm -f emtees-deploy-new.tar.gz

# Create a new tarball containing both the server and contracts directories
tar -czf emtees-deploy-new.tar.gz server/ contracts/

echo "Done! The archive is saved as: emtees-deploy-new.tar.gz"
echo "You can now SCP it to your EC2 instance:"
echo "scp -i /path/to/emtees.pem emtees-deploy-new.tar.gz ubuntu@13.235.19.185:~"
