FROM node:20-slim

WORKDIR /app

# Copy package manifests and security overrides configurations
COPY package.json package-lock.json* ./

# Install packages matching locked package tree rules
RUN npm ci

# Copy the remaining flat-source application code assets
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
