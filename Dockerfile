# ── Stage 1: Install dependencies ─────────────────────────
# Vite 8 requires Node 20+. node:18 is missing styleText in node:util.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ── Stage 2: Development server (used by docker-compose) ──
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

# --host 0.0.0.0 makes Vite accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── (Optional) Production static build ─────────────────────
# Uncomment below and comment the runner stage above to serve
# a production build via nginx instead of the Vite dev server.
#
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# ARG VITE_NODE_API_URL
# ARG VITE_SPRING_API_URL
# RUN npm run build
#
# FROM nginx:alpine AS production
# COPY --from=build /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
