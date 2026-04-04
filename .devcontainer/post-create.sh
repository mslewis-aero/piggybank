#!/bin/bash
set -e

echo "Setting up Piggy Bank dev environment..."

# Install Claude Code globally
echo "Installing Claude Code..."
npm install -g @anthropic-ai/claude-code

# Install Expo CLI and EAS CLI globally
echo "Installing Expo CLI and EAS CLI..."
npm install -g expo-cli eas-cli

# Install project dependencies if package.json exists
if [ -f "package.json" ]; then
  echo "Installing project dependencies..."
  npm install
else
  echo "No package.json found -- run 'npx create-expo-app' to scaffold the project."
fi

echo ""
echo "Dev container setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'claude' to start Claude Code"
echo "  2. Scaffold the Expo project if not yet created"
echo "  3. Run 'npx expo start --tunnel' to test on your phone"
