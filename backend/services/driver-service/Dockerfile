# Use an official Golang image as a base
FROM golang:1.23-alpine

# Set the working directory
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
RUN go build -o main ./cmd

# Expose port 8080
EXPOSE 8082

# Run the app
CMD ["./main"]
