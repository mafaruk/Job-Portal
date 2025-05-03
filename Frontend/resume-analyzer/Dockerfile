FROM node:22.14.0-slim as build

WORKDIR /app
COPY ./ ./
RUN npm install
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80