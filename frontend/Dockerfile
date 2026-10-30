FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install && chown -R node:node /app

# Set environment variables
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_SOCKET_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV CHOKIDAR_USEPOLLING=true
ENV WDS_SOCKET_PORT=0

EXPOSE 3000

USER node

# Development mode with hot reload
CMD ["npm", "start"]
