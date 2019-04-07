#!/bin/bash
echo "Updating..."
git reset --hard
git pull
npm run data
git add data.json
git commit -m "Updated data.json"
git push