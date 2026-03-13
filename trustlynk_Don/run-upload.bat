@echo off
echo Starting Chainlink Secrets Upload...
docker run --rm -it -v "%cd%:/app" -w /app node:18-alpine sh -c "apk add --no-cache python3 make g++ && npm install && node upload-secrets.js"

