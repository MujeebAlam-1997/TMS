# Stage 1: Install dependencies and build the app
FROM node:18-alpine AS builder

# Install necessary dependencies for building native packages (like better-sqlite3)
RUN apk add --no-cache python3 make g++ pkgconfig

# Set working directory
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# Build the Next.js app
RUN npm run build

# Optional: Run typecheck/lint during build
# RUN npm run typecheck
# RUN npm run lint

# Stage 2: Create the final production image
FROM node:18-alpine AS runner

# Install required OS packages for better-sqlite3 at runtime
RUN apk add --no-cache libstdc++ sqlite

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy only the necessary files from the builder 
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Replace .js with .ts since you're using TypeScript config files
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts 

COPY --from=builder /app/src ./src

# Expose port (default Next.js port)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
