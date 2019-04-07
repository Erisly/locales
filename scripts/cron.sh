#!/bin/bash
echo "Updating..."
git pull
npm run data
git add data.json
git commit -m "Updated data.json"
git add --all
git commit -m "Inserted placeholder strings."
git push