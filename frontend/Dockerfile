FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
