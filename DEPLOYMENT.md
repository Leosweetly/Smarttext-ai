# Deployment Guide for SmartText AI

This guide will walk you through deploying SmartText AI to Vercel and connecting it to your custom domain (getsmarttext.com).

## Prerequisites

- A Vercel account (https://vercel.com)
- Access to your domain's DNS settings
- Your favicon files ready to be added to the project

## Step 1: Add Your Favicon Files

Before deploying, make sure to add your favicon files to the project:

1. Replace the placeholder files in the `/public/icons` directory with your actual icon files:
   - `/public/favicon.ico` - Browser tab icon
   - `/public/icons/icon-192x192.png` - 192×192 PWA icon
   - `/public/icons/icon-384x384.png` - 384×384 PWA icon
   - `/public/icons/icon-512x512.png` - 512×512 PWA icon
   - `/public/icons/dashboard.png` - Dashboard shortcut icon
   - `/public/icons/settings.png` - Settings shortcut icon

## Step 2: Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to your Vercel account and click "Add New..." > "Project"

3. Import your Git repository

4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: next build
   - Output Directory: .next

5. Add Environment Variables:
   - Copy all variables from `.env.production` to the Vercel environment variables section
   - Make sure to set them for Production environment

6. Click "Deploy"

## Step 3: Connect Your Custom Domain

1. After deployment, go to your project settings in Vercel

2. Navigate to "Domains"

3. Add your domain: `getsmarttext.com`

4. Follow Vercel's instructions to configure your DNS settings:
   - Option 1: Use Vercel as your nameserver
   - Option 2: Add the required DNS records to your current DNS provider

5. Wait for DNS propagation (can take up to 48 hours, but usually much faster)

## Step 4: Configure SSL

Vercel automatically provisions SSL certificates for your domain. Ensure HTTPS is enforced:

1. In your project settings, go to "Domains"
2. Make sure "Secure HTTPS" is enabled for your domain

## Step 5: Verify Your Deployment

1. Visit your domain (https://getsmarttext.com) to ensure everything is working correctly

2. Test key functionality:
   - Authentication (login/signup)
   - Missed call handling
   - Subscription management
   - Dashboard access

## Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs for errors
2. Verify all environment variables are set correctly
3. Ensure your DNS settings are properly configured
4. Check that your Auth0 application settings have the correct callback URLs

## Monitoring

Set up monitoring to keep track of your application's health:

1. Vercel Analytics: Available in your Vercel dashboard
2. Google Analytics: Already integrated with your GA Measurement ID
3. Sentry: Already integrated for error tracking

## Next Steps

After successful deployment:

1. Set up Stripe webhooks for subscription management
2. Configure Twilio webhooks for missed call handling
3. Set up regular backups of your Airtable data
4. Consider setting up a staging environment for testing future updates
