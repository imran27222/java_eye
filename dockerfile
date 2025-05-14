# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Production stage
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app ./


# Install only production dependencies
RUN npm ci --production

# Define the command to run your app
CMD ["npm", "run", "start"]
