FROM node:20-alpine AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN addgroup -S app && adduser -S app -G app \
 && chown -R app:app /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
 && touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
USER app
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
