FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Set environment variables
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_SOCKET_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV CHOKIDAR_USEPOLLING=true
ENV WDS_SOCKET_PORT=0

EXPOSE 3000

# Development mode with hot reload
CMD ["npm", "start"]
