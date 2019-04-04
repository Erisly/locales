#!/bin/bash
echo "Updating..."
git pull
npm run data
git add --all
git commit -m "Updated data.json"
git push