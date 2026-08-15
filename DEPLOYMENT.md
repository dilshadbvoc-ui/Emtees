# Emtees Backend EC2 Deployment Guide

This document contains the step-by-step instructions to deploy or update the Emtees backend application on the AWS EC2 instance.

## 1. Local Packaging

The deployment archive MUST include both the `server/` and `contracts/` directories (the backend relies on shared types and validation from the contracts workspace). 

Run the automated script to generate the archive:
```bash
./deploy-pack.sh
```
This produces `emtees-deploy-new.tar.gz`.

## 2. Transfer Archive to EC2

Transfer the newly created archive to your EC2 instance using SCP and your private key (`emtees.pem`):
```bash
scp -i ~/Downloads/emtees.pem emtees-deploy-new.tar.gz ubuntu@13.235.19.185:~
```

## 3. SSH into the Server

Connect to the EC2 instance to execute the deployment:
```bash
ssh -i ~/Downloads/emtees.pem ubuntu@13.235.19.185
```

## 4. Install & Build (On EC2)

Once logged into the EC2 instance, follow these steps to extract, install, and build the code:

```bash
# Extract the archive into the deployment directory
tar -xzf emtees-deploy-new.tar.gz -C ~/emtees-api

# Navigate to the server workspace
cd ~/emtees-api/server

# Install ALL dependencies (Dev dependencies are required for TypeScript and workspace linking)
npm install

# Build the TypeScript code
npm run build
```

## 5. Restart PM2

The application is managed using PM2. To restart the process and apply the new build:

```bash
pm2 restart emtees-api
```

### Useful PM2 Commands

- **View Logs:** Check real-time logs for errors or startup issues.
  ```bash
  pm2 logs emtees-api --lines 50
  ```
- **Process Status:** Check CPU and Memory usage of the API.
  ```bash
  pm2 list
  ```
- **Stop Server:**
  ```bash
  pm2 stop emtees-api
  ```
- **Save Configuration:** Run this if you change the startup script or add new environment variables so they persist across server reboots.
  ```bash
  pm2 save
  ```

## 6. Server Infrastructure

- **Node Version Manager (NVM):** Node v24.19.0 is installed via NVM.
- **Port:** The API runs locally on port `3000`.
- **Nginx:** An Nginx process is running on the server proxying requests to port `3000`.
- **Database Connection:** When `NODE_ENV=production`, the application uses `server/global-bundle.pem` (RDS CA Certificate) to authenticate securely with the database over SSL. Ensure the `global-bundle.pem` is always present in the `server/` directory.
