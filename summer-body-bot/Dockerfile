# Use an appropriate Node.js base image
FROM node:18-alpine

# Create a working directory inside the container
WORKDIR /app

# Copy your package.json and package-lock.json (if you have one)
COPY package*.json ./

# Install the project dependencies 
RUN npm install

# Copy your source code to the working directory
COPY . .

# Specify the port the application will listen on
EXPOSE 3000 

# Command to start your application
CMD [ "node", "index.js" ] 
