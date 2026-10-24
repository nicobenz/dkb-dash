# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The build validates that DATABASE_URL exists but does not inline it; the real value
# is read when the container starts.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build npm run build \
	&& npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Set by the release workflow; shown in the footer.
ARG VERSION
ENV DKB_DASH_VERSION=$VERSION
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.js /app/scripts/server.js ./scripts/
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.js && exec node scripts/server.js"]
