#!/usr/bin/env node

/**
 * Script to update branding according to brand guidelines
 * 
 * This script updates CSS variables, logo usage, and other branding elements
 * to match the provided brand guidelines.
 * 
 * Usage: node scripts/update-branding.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Brand guidelines
const brandGuidelines = {
  colors: {
    primary: '#0D1B2A', // Primary background, header/footer, core branding
    secondary: '#1B263B', // Secondary background, hover states, or dark mode UI
    accent: '#415A77', // Primary button color, accents, or links
    accentLight: '#778DA9', // Secondary accents, hover states, card outlines
    background: '#E0E1DD', // Backgrounds, cards, and body text areas
  },
  typography: {
    primaryFont: 'Roboto Bold', // For headlines, section titles, CTA buttons
    bodyFont: 'Roboto Regular, Roboto Light', // For body text, tooltips, and form inputs
    baseFontSize: '16px', // Minimum font size for accessibility
  },
  slogan: 'Texting that works as hard as you do.',
  logoUsage: {
    position: 'centered or top-left',
    backgrounds: ['white', 'black', 'brand palette'],
    padding: '40px',
  },
  voice: {
    overall: 'Clear, confident, and grounded. Always helpful—never overhyped or complicated.',
    pillars: [
      'Straightforward - Get to the point. No fluff, no corporate jargon.',
      'Dependable - Sound like the tool they can trust to just work.',
      'Respectful - Professional enough for a big box store, approachable enough for a one-man shop.',
      'Local-first - Write like you\'re talking to a business owner you know by name.',
    ],
    examples: {
      do: [
        'Let\'s make that easier for you.',
        'We\'ve got your back.',
        'Running a business is hard. Your tools shouldn\'t be.',
      ],
      dont: [
        'We optimize workflows for increased productivity.',
        'This solution provides a competitive advantage.',
        'Our platform leverages AI...',
      ],
    },
  },
};

// Files to update
const filesToUpdate = [
  {
    path: 'app/globals.css',
    update: updateGlobalCSS,
  },
  {
    path: 'app/layout.js',
    update: updateLayout,
  },
  {
    path: 'app/page.js',
    update: updateHomePage,
  },
  {
    path: 'app/pricing/page.js',
    update: updatePricingPage,
  },
  {
    path: 'app/dashboard/layout.js',
    update: updateDashboardLayout,
  },
];

// Main function
async function updateBranding() {
  console.log('🎨 Updating branding according to brand guidelines');
  console.log('------------------------------------------------');
  
  for (const file of filesToUpdate) {
    try {
      console.log(`\nUpdating ${file.path}...`);
      
      // Read the file
      const filePath = path.resolve(process.cwd(), file.path);
      const content = await readFile(filePath, 'utf8');
      
      // Update the content
      const updatedContent = await file.update(content);
      
      // Write the updated content
      await writeFile(filePath, updatedContent);
      
      console.log(`✅ Updated ${file.path}`);
    } catch (error) {
      console.error(`❌ Error updating ${file.path}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Branding update completed!');
}

// Update global CSS
async function updateGlobalCSS(content) {
  console.log('Updating CSS variables and typography...');
  
  // Define the CSS variables section to replace or add
  const cssVariables = `
:root {
  /* Brand Colors */
  --color-primary: ${brandGuidelines.colors.primary};
  --color-secondary: ${brandGuidelines.colors.secondary};
  --color-accent: ${brandGuidelines.colors.accent};
  --color-accent-light: ${brandGuidelines.colors.accentLight};
  --color-background: ${brandGuidelines.colors.background};
  
  /* Typography */
  --font-primary: ${brandGuidelines.typography.primaryFont};
  --font-body: ${brandGuidelines.typography.bodyFont};
  --font-size-base: ${brandGuidelines.typography.baseFontSize};
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-xxl: 3rem;
  
  /* Border Radius */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
`;

  // Define the base styles to replace or add
  const baseStyles = `
/* Base Styles */
html,
body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  background-color: var(--color-background);
  color: var(--color-primary);
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  color: var(--color-primary);
  margin-top: 0;
}

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-accent-light);
}

button, .button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover, .button:hover {
  background-color: var(--color-accent-light);
}

.card {
  background-color: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--color-accent-light);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* Header & Footer */
header, footer {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) 0;
}

header a, footer a {
  color: white;
}

header a:hover, footer a:hover {
  color: var(--color-accent-light);
}

/* Logo */
.logo {
  padding: var(--spacing-md);
}

.logo img {
  max-height: 40px;
}
`;

  // Check if the content already has CSS variables
  if (content.includes(':root {')) {
    // Replace existing CSS variables
    const rootRegex = /:root\s*{[^}]*}/s;
    const updatedContent = content.replace(rootRegex, cssVariables.trim());
    
    // Check if the content already has base styles
    if (content.includes('/* Base Styles */')) {
      // Replace existing base styles
      const baseStylesRegex = /\/\* Base Styles \*\/.*?(?=\/\*|$)/s;
      return updatedContent.replace(baseStylesRegex, baseStyles.trim());
    } else {
      // Add base styles
      return updatedContent + '\n\n' + baseStyles.trim();
    }
  } else {
    // Add CSS variables and base styles
    return content + '\n\n' + cssVariables.trim() + '\n\n' + baseStyles.trim();
  }
}

// Update layout.js
async function updateLayout(content) {
  console.log('Updating layout with new fonts and branding...');
  
  // Add Roboto font import if not already present
  if (!content.includes('Roboto')) {
    // Find the import section
    const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
    const imports = content.match(importRegex) || [];
    
    // Add Roboto font import after the last import
    const lastImport = imports[imports.length - 1];
    const fontImport = `import { Roboto } from 'next/font/google'`;
    
    content = content.replace(lastImport, `${lastImport}\n${fontImport}`);
    
    // Initialize the Roboto font
    const fontInitRegex = /const\s+.*?=.*?font.*?\(/;
    const fontInit = content.match(fontInitRegex);
    
    if (fontInit) {
      const robotoInit = `
const roboto = Roboto({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})`;
      
      content = content.replace(fontInit[0], `${robotoInit}\n\n${fontInit[0]}`);
    }
    
    // Add the Roboto font to the body class
    const bodyClassRegex = /<body\s+className=['"](.*?)['"]>/;
    const bodyClass = content.match(bodyClassRegex);
    
    if (bodyClass) {
      const newBodyClass = `<body className="${bodyClass[1]} ${roboto.variable}">`;
      content = content.replace(bodyClassRegex, newBodyClass);
    }
  }
  
  // Update metadata
  const metadataRegex = /export\s+const\s+metadata\s*=\s*{[^}]*}/s;
  const metadata = content.match(metadataRegex);
  
  if (metadata) {
    const updatedMetadata = `export const metadata = {
  title: 'SmartText AI - Texting that works as hard as you do',
  description: 'SmartText AI is a simple, reliable, and clean communication tool designed for service-based businesses.',
  keywords: 'texting, SMS, business communication, missed calls, auto-text',
}`;
    
    content = content.replace(metadataRegex, updatedMetadata);
  }
  
  return content;
}

// Update home page
async function updateHomePage(content) {
  console.log('Updating home page with new branding and messaging...');
  
  // Update hero section
  const heroRegex = /<section\s+className=['"](.*?)hero(.*?)['"]>(.*?)<\/section>/s;
  const hero = content.match(heroRegex);
  
  if (hero) {
    const updatedHero = `<section className="${hero[1]}hero${hero[2]}">
      <div className="container">
        <h1>Texting that works as hard as you do.</h1>
        <p>
          Stop losing leads from missed calls. SmartText AI automatically responds to missed calls with personalized text messages, helping you capture more business and provide better service.
        </p>
        <div className="cta-buttons">
          <Link href="/signup" className="button primary">Get Started</Link>
          <Link href="/demo" className="button secondary">See Demo</Link>
        </div>
      </div>
    </section>`;
    
    content = content.replace(heroRegex, updatedHero);
  }
  
  // Update feature sections with new messaging
  const featureRegex = /<section\s+className=['"](.*?)features(.*?)['"]>(.*?)<\/section>/s;
  const features = content.match(featureRegex);
  
  if (features) {
    const updatedFeatures = `<section className="${features[1]}features${features[2]}">
      <div className="container">
        <h2>Simple, reliable communication for your business</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Never Miss a Lead</h3>
            <p>Automatically respond to missed calls with personalized text messages that keep the conversation going.</p>
          </div>
          <div className="feature-card">
            <h3>Industry-Specific Templates</h3>
            <p>Pre-built response templates for auto shops, restaurants, trades, and more to save you time.</p>
          </div>
          <div className="feature-card">
            <h3>Two-Way Conversations</h3>
            <p>Manage text conversations from your mobile or desktop to stay connected wherever you are.</p>
          </div>
          <div className="feature-card">
            <h3>Simple Appointment Booking</h3>
            <p>Share booking links that let customers schedule time with you without the back-and-forth.</p>
          </div>
        </div>
      </div>
    </section>`;
    
    content = content.replace(featureRegex, updatedFeatures);
  }
  
  return content;
}

// Update pricing page
async function updatePricingPage(content) {
  console.log('Updating pricing page with new branding and plan details...');
  
  // Update pricing header
  const headerRegex = /<h1[^>]*>(.*?)<\/h1>/s;
  const header = content.match(headerRegex);
  
  if (header) {
    const updatedHeader = `<h1>Simple, transparent pricing</h1>`;
    content = content.replace(headerRegex, updatedHeader);
  }
  
  // Update pricing description
  const descRegex = /<p[^>]*className=['"](.*?)description(.*?)['"]>(.*?)<\/p>/s;
  const desc = content.match(descRegex);
  
  if (desc) {
    const updatedDesc = `<p className="${desc[1]}description${desc[2]}">Choose the plan that fits your business needs. No hidden fees. Cancel anytime.</p>`;
    content = content.replace(descRegex, updatedDesc);
  }
  
  // Update Core Plan
  const corePlanRegex = /<div[^>]*className=['"](.*?)plan(.*?)['"]>(.*?)<h2[^>]*>Core Plan<\/h2>(.*?)<\/div>/s;
  const corePlan = content.match(corePlanRegex);
  
  if (corePlan) {
    const updatedCorePlan = `<div className="${corePlan[1]}plan${corePlan[2]}">
      <div className="plan-header">
        <h2>Core Plan</h2>
        <p className="price">$249<span>/month</span></p>
        <p className="description">For solo operators and small businesses that want to stop losing leads from missed calls.</p>
      </div>
      <ul className="features-list">
        <li>Auto-text for missed calls</li>
        <li>Pre-built industry response templates</li>
        <li>Two-way SMS Inbox (mobile + desktop)</li>
        <li>Basic contact log + conversation history</li>
        <li>Simple appointment booking link support</li>
        <li>Tag and organize leads manually</li>
      </ul>
      <p className="perfect-for">Perfect for: Owner-operators or teams with 1–2 people who just want to catch missed calls, respond fast, and stay organized—without the fluff.</p>
      <div className="cta">
        <Link href="/signup?plan=core" className="button">Get Started</Link>
      </div>
    </div>`;
    
    content = content.replace(corePlanRegex, updatedCorePlan);
  }
  
  // Update Pro Plan
  const proPlanRegex = /<div[^>]*className=['"](.*?)plan(.*?)['"]>(.*?)<h2[^>]*>Pro Plan<\/h2>(.*?)<\/div>/s;
  const proPlan = content.match(proPlanRegex);
  
  if (proPlan) {
    const updatedProPlan = `<div className="${proPlan[1]}plan${proPlan[2]} featured">
      <div className="plan-header">
        <h2>Pro Plan</h2>
        <p className="price">$399<span>/month</span></p>
        <p className="description">For growing teams who need more automation, smarter follow-up, and CRM workflows.</p>
      </div>
      <ul className="features-list">
        <li>Everything in Core, plus:</li>
        <li>CRM integration (HubSpot, Zoho, Pipedrive via Zapier)</li>
        <li>AI-powered custom replies (trained on your business)</li>
        <li>Lead qualification flows (automated follow-up Q&A)</li>
        <li>Shared inbox with team assignments</li>
        <li>Advanced tagging & customer notes</li>
        <li>Internal team comments & response tracking</li>
        <li>Mobile-first support with push notifications</li>
      </ul>
      <p className="perfect-for">Perfect for: Businesses with receptionists, call volume, or multiple team members managing customer communication and sales.</p>
      <div className="cta">
        <Link href="/signup?plan=pro" className="button">Get Started</Link>
      </div>
    </div>`;
    
    content = content.replace(proPlanRegex, updatedProPlan);
  }
  
  // Update Growth Plan
  const growthPlanRegex = /<div[^>]*className=['"](.*?)plan(.*?)['"]>(.*?)<h2[^>]*>Growth Plan<\/h2>(.*?)<\/div>/s;
  const growthPlan = content.match(growthPlanRegex);
  
  if (growthPlan) {
    const updatedGrowthPlan = `<div className="${growthPlan[1]}plan${growthPlan[2]}">
      <div className="plan-header">
        <h2>Growth Plan</h2>
        <p className="price">$599+<span>/month</span></p>
        <p className="description">For chains, franchises, and teams who want to scale communication and automate at a higher level.</p>
      </div>
      <ul className="features-list">
        <li>Everything in Pro, plus:</li>
        <li>Multi-location support with location-specific auto-replies</li>
        <li>Priority onboarding & support access</li>
        <li>AI training on documents, SOPs, and FAQ libraries</li>
        <li>Bulk SMS campaigns (promos, follow-ups, review requests)</li>
        <li>Advanced analytics dashboard (response rates, lead conversions)</li>
        <li>SLA response time guarantee</li>
      </ul>
      <p className="perfect-for">Perfect for: Multi-location businesses, agencies, or regional operators who want full automation, control, and scalability across teams or branches.</p>
      <div className="cta">
        <Link href="/signup?plan=growth" className="button">Contact Sales</Link>
      </div>
    </div>`;
    
    content = content.replace(growthPlanRegex, updatedGrowthPlan);
  }
  
  return content;
}

// Update dashboard layout
async function updateDashboardLayout(content) {
  console.log('Updating dashboard layout with new branding...');
  
  // Update sidebar styling
  const sidebarRegex = /<aside[^>]*className=['"](.*?)sidebar(.*?)['"]>(.*?)<\/aside>/s;
  const sidebar = content.match(sidebarRegex);
  
  if (sidebar) {
    // Keep the existing sidebar content but update the className
    const updatedSidebar = `<aside className="${sidebar[1]}sidebar${sidebar[2]} brand-sidebar">${sidebar[3]}</aside>`;
    content = content.replace(sidebarRegex, updatedSidebar);
  }
  
  // Update header styling
  const headerRegex = /<header[^>]*className=['"](.*?)header(.*?)['"]>(.*?)<\/header>/s;
  const header = content.match(headerRegex);
  
  if (header) {
    // Keep the existing header content but update the className
    const updatedHeader = `<header className="${header[1]}header${header[2]} brand-header">${header[3]}</header>`;
    content = content.replace(headerRegex, updatedHeader);
  }
  
  return content;
}

// Run the script
updateBranding()
  .then(() => {
    console.log('Branding update script finished successfully');
  })
  .catch(error => {
    console.error('Branding update script failed:', error);
    process.exit(1);
  });
