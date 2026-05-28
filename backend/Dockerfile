FROM node:20-alpine

# Install build dependencies for C++ compilation
RUN apk add --no-cache g++ make python3

WORKDIR /app

# Copy backend package files first for caching
COPY backend/package*.json ./
RUN npm install

# Copy backend files
COPY backend/ ./

# Copy and compile C++ core sources locally inside container
COPY cpp_core/ /cpp_core
WORKDIR /cpp_core
RUN make clean && make CXX=g++

WORKDIR /app
EXPOSE 5001

CMD ["npm", "start"]
