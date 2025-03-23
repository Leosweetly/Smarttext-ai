#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_header() {
  echo -e "\n${BLUE}==================================================${NC}"
  echo -e "${BLUE} $1 ${NC}"
  echo -e "${BLUE}==================================================${NC}\n"
}

# Print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print info message
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if environment variables are set
check_env_vars() {
  print_header "Checking Environment Variables"
  
  if [ -f .env.local ]; then
    print_success "Found .env.local file"
    
    # Check if AIRTABLE_REDIRECT_URI is set for local development
    if grep -q "AIRTABLE_REDIRECT_URI=http://localhost:3000" .env.local; then
      print_success "AIRTABLE_REDIRECT_URI is set for local development"
    else
      print_error "AIRTABLE_REDIRECT_URI is not set for local development"
      print_info "Please update .env.local to set AIRTABLE_REDIRECT_URI=http://localhost:3000/api/auth/airtable/callback"
      return 1
    fi
    
    # Check if other required variables are set
    for var in AIRTABLE_CLIENT_ID AIRTABLE_CLIENT_SECRET AIRTABLE_BASE_ID; do
      if grep -q "$var=" .env.local; then
        print_success "Found $var in .env.local"
      else
        print_error "Missing $var in .env.local"
        return 1
      fi
    done
    
    return 0
  else
    print_error "Could not find .env.local file"
    print_info "Please create a .env.local file with the required Airtable OAuth credentials"
    return 1
  fi
}

# Start the development server
start_dev_server() {
  print_header "Starting Development Server"
  print_info "Starting the Next.js development server..."
  print_info "The server will start in a new terminal window."
  print_info "Please wait for the server to start before proceeding."
  
  # Open a new terminal window and start the development server
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && npm run dev"'
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
      gnome-terminal -- bash -c "cd \"$PWD\" && npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
      xterm -e "cd \"$PWD\" && npm run dev" &
    else
      print_error "Could not find a suitable terminal emulator (gnome-terminal or xterm)"
      print_info "Please start the development server manually with 'npm run dev'"
    fi
  else
    print_error "Unsupported operating system"
    print_info "Please start the development server manually with 'npm run dev'"
  fi
  
  # Wait for user confirmation
  read -p "Press Enter once the development server is running... " -r
}

# Open the dashboard settings page
open_dashboard() {
  print_header "Opening Dashboard Settings Page"
  print_info "Opening the dashboard settings page in your default browser..."
  
  # Open the dashboard settings page in the default browser
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:3000/dashboard/settings"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
      xdg-open "http://localhost:3000/dashboard/settings"
    else
      print_error "Could not find xdg-open"
      print_info "Please open http://localhost:3000/dashboard/settings in your browser"
    fi
  else
    print_error "Unsupported operating system"
    print_info "Please open http://localhost:3000/dashboard/settings in your browser"
  fi
}

# Provide instructions for testing the OAuth flow
provide_instructions() {
  print_header "Testing the OAuth Flow"
  print_info "To test the OAuth flow:"
  echo "1. Look for the 'Data Connections' section on the dashboard settings page"
  echo "2. Find the Airtable card with the 'Connect to Airtable' button"
  echo "3. Click the 'Connect to Airtable' button"
  echo "4. You will be redirected to Airtable's authorization page"
  echo "5. Log in to Airtable if prompted"
  echo "6. Authorize the application"
  echo "7. You will be redirected back to the dashboard settings page"
  echo "8. The Airtable card should now show 'Connected to Airtable'"
  
  print_header "Troubleshooting"
  print_info "If you encounter issues:"
  echo "1. Check the browser console for errors (F12 or Cmd+Option+I)"
  echo "2. Check the server logs in the terminal"
  echo "3. Make sure your Airtable OAuth application has the correct redirect URI:"
  echo "   http://localhost:3000/api/auth/airtable/callback"
  echo "4. Make sure your .env.local file has the correct credentials"
  echo "5. Try running the test script: node scripts/test-airtable-oauth-local.js"
  
  print_header "Next Steps"
  print_info "For more information, see:"
  echo "- AIRTABLE_OAUTH_QUICKSTART.md"
  echo "- AIRTABLE_OAUTH.md"
}

# Main function
main() {
  print_header "Airtable OAuth Dashboard Test"
  
  # Check environment variables
  if ! check_env_vars; then
    print_error "Environment variables check failed"
    return 1
  fi
  
  # Start the development server
  start_dev_server
  
  # Open the dashboard settings page
  open_dashboard
  
  # Provide instructions for testing the OAuth flow
  provide_instructions
  
  print_header "Test Complete"
  print_success "The test script has completed successfully"
  print_info "Follow the instructions above to test the OAuth flow"
}

# Run the main function
main
