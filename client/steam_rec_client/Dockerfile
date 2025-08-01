# ---------- Build stage ----------
FROM node:20 AS build
WORKDIR /ui

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --no-lint      

# ---------- Run stage -------------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# production build output
COPY --from=build /ui/.next ./.next
COPY --from=build /ui/public ./public
COPY --from=build /ui/package.json ./
COPY --from=build /ui/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start"]
