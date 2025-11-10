# GitHub Setup Guide for TripMan

## 🎯 **GitHub Project Setup & Protection**

### **Step 1: Create GitHub Repository (10 minutes)**

#### **1.1 Create New Repository**
```bash
# Go to https://github.com
# Click the "+" icon in top right
# Select "New repository"
# Repository name: "tripman-production"
# Description: "TripMan - Transportation Booking Platform"
# Choose "Private" (recommended for business)
# Don't initialize with README (we have existing code)
# Click "Create repository"
```

#### **1.2 Make Repository Private**
```bash
# In your repository:
# 1. Go to "Settings" tab
# 2. Scroll down to "Danger Zone"
# 3. Click "Change repository visibility"
# 4. Select "Make private"
# 5. Confirm the change
```

### **Step 2: Upload Your Project to GitHub (15 minutes)**

#### **2.1 Initialize Git in Your Project**
```bash
# Open terminal in your TripMan project folder
# Run these commands:

# Initialize git repository
git init

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: TripMan transportation booking platform"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/tripman-production.git

# Push to GitHub
git push -u origin main
```

#### **2.2 Alternative: Upload via GitHub Web Interface**
```bash
# If you prefer web interface:
# 1. Go to your repository on GitHub
# 2. Click "uploading an existing file"
# 3. Drag and drop your TripMan folder
# 4. Add commit message: "Initial commit: TripMan platform"
# 5. Click "Commit changes"
```

### **Step 3: Protect Your Repository (10 minutes)**

#### **3.1 Set Up Branch Protection**
```bash
# In your repository:
# 1. Go to "Settings" → "Branches"
# 2. Click "Add rule"
# 3. Branch name pattern: "main"
# 4. Check "Require pull request reviews before merging"
# 5. Check "Require status checks to pass before merging"
# 6. Check "Require branches to be up to date before merging"
# 7. Click "Create"
```

#### **3.2 Set Up Security Settings**
```bash
# In your repository:
# 1. Go to "Settings" → "Security"
# 2. Enable "Dependency graph"
# 3. Enable "Dependabot alerts"
# 4. Enable "Dependabot security updates"
# 5. Enable "Code scanning"
```

#### **3.3 Add .gitignore File**
```bash
# Create .gitignore file in your project root:
# Add these lines:

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
.next/
out/
build/
dist/

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

### **Step 4: Deploy to Vercel (10 minutes)**

#### **4.1 Connect Repository to Vercel**
```bash
# In Vercel dashboard:
# 1. Click "New Project"
# 2. Select "Import Git Repository"
# 3. Choose "tripman-production" from your GitHub
# 4. Click "Import"
# 5. Configure project settings:
#    - Framework Preset: Next.js
#    - Root Directory: ./
#    - Build Command: npm run build
#    - Output Directory: .next
# 6. Click "Deploy"
```

#### **4.2 Configure Environment Variables**
```bash
# In Vercel dashboard:
# 1. Go to your project
# 2. Click "Settings" → "Environment Variables"
# 3. Add these variables (we'll get the values from other services):

# Database (from Neon)
DATABASE_URL="postgresql://user:password@host/database"

# Stripe (from Stripe dashboard)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (from Resend)
RESEND_API_KEY="re_..."

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Admin Authentication
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="your-secure-password"

# Business Configuration
BUSINESS_TIMEZONE="America/Toronto"
BUFFER_MINUTES=15
BOOKING_MIN_NOTICE_HOURS=24
CANCEL_POLICY_HOURS=12
```

### **Step 5: Set Up Automatic Deployments (5 minutes)**

#### **5.1 Enable Auto-Deploy**
```bash
# In Vercel dashboard:
# 1. Go to "Settings" → "Git"
# 2. Enable "Automatically deploy from main branch"
# 3. This will deploy every time you push to GitHub
```

#### **5.2 Set Up Preview Deployments**
```bash
# In Vercel dashboard:
# 1. Go to "Settings" → "Git"
# 2. Enable "Preview deployments for pull requests"
# 3. This creates preview URLs for testing
```

### **Step 6: Test Deployment (5 minutes)**

#### **6.1 Check Deployment Status**
```bash
# In Vercel dashboard:
# 1. Go to "Deployments" tab
# 2. Check if deployment is successful
# 3. Click on deployment to see logs
# 4. Visit your site URL to test
```

#### **6.2 Test Basic Functionality**
```bash
# Test these features:
# 1. Landing page loads
# 2. Navigation works
# 3. Service selection works
# 4. Contact form works
# 5. Mobile responsiveness
```

## 🔒 **Security Best Practices**

### **7.1 Protect Sensitive Information**
```bash
# Never commit these files:
- .env files
- API keys
- Database passwords
- Private keys
- Personal information

# Use environment variables instead
# Store sensitive data in Vercel environment variables
```

### **7.2 Regular Backups**
```bash
# GitHub automatically backs up your code
# But also backup:
# 1. Database backups (Neon handles this)
# 2. Environment variables (document them)
# 3. Domain settings (screenshot DNS settings)
# 4. Service configurations (document API keys)
```

### **7.3 Access Control**
```bash
# In GitHub repository:
# 1. Go to "Settings" → "Manage access"
# 2. Add team members if needed
# 3. Set appropriate permissions
# 4. Use "Read" access for most team members
# 5. Use "Write" access only for developers
```

## 📱 **Mobile Management**

### **8.1 GitHub Mobile App**
```bash
# Download GitHub mobile app
# Available on iOS and Android
# Features:
# - View repository
# - Check commits
# - Review pull requests
# - Manage issues
# - Monitor deployments
```

### **8.2 Vercel Mobile App**
```bash
# Download Vercel mobile app
# Available on iOS and Android
# Features:
# - View deployments
# - Check deployment status
# - Monitor performance
# - View error logs
# - Manage environment variables
```

## 🚀 **Next Steps**

### **9.1 Complete Service Setup**
```bash
# After GitHub setup, continue with:
# 1. Neon database setup
# 2. Stripe payment setup
# 3. Resend email setup
# 4. Domain configuration
# 5. Environment variables
# 6. Database migration
# 7. Testing and launch
```

### **9.2 Regular Maintenance**
```bash
# Set up regular tasks:
# 1. Weekly code reviews
# 2. Monthly security updates
# 3. Quarterly dependency updates
# 4. Regular backup verification
# 5. Performance monitoring
```

## 🎯 **Quick Commands Reference**

### **Git Commands**
```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature-branch-name

# Switch branches
git checkout main
```

### **Vercel Commands**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy
vercel --prod

# Pull environment variables
vercel env pull .env.local
```

---

## 🎉 **Summary**

### **✅ What You'll Have After Setup:**
- **Private GitHub repository** with your code
- **Protected repository** with security settings
- **Automatic deployments** to Vercel
- **Environment variables** configured
- **Mobile access** to manage everything
- **Backup and security** in place

### **🚀 Ready to Continue?**
**Once you've set up GitHub and deployed to Vercel, we'll move to the next step: Neon database setup!**

**Let me know when you've completed the GitHub setup and I'll guide you through the next step!** 🎯
