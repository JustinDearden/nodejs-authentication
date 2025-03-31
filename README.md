# Node.js Authentication Take Home Challenge

## Submitted by: Justin Dearden

## Overview

This is a secure and optimized authentication API built with Node.js, Express, and PostgreSQL. Redis is used for session management, and the app is containerized with Docker. The API supports user registration, login, and logout with comprehensive validation, rate limiting, logging, and security headers using Helmet.

---

## Running the App

1. **Ensure Docker Desktop is Running:**

   Make sure Docker is installed and running on your system.

2. **Set ENV Variables:**

   Rename `.env.example` to `.env` and set a `JWT_SECRET`.

   **Important:** Set the `datastore` variable to either `redis` or `postgres`

   - `datastore=redis` will store all user data and session data in Redis.
   - `datastore=postgres` will store all user data in PostgreSQL and session data in Redis.
   - [More about data storage modes](#data-storage-modes).

3. **Start the Application:**

   From the root of the project directory, run:

   `docker-compose up -d --build`

   Depending on your version of Docker you might need to run:

   `docker compose up -d --build`

   This command builds the Docker images and starts the containers for the Node.js application, PostgreSQL, and Redis.

4. **Access the API:**

   Once the containers are up and running, visit [http://localhost:3000/health](http://localhost:3000/health) to verify that the backend is running.

   You can test endpoints (such as /auth/register, /auth/login, /auth/logout, and /protected) using attached Postman collection.

5. **Stopping the App:**

   To stop the application, run:

   `docker-compose down` or `docker compose down`

---

## Data Storage Modes

_Based on clarification to the project requirements, my original implementation used Postgres for user data persistence and Redis for session storage. Upon clarifying the requirements, I was instructed to store both user data and session data in Redis—without using Postgres for user data persistence. In a real production-grade application, you wouldn't be switching back and forth like this, but for this assignment I wanted to showcase the work I did for both and left it in place for that reason._

- **Redis Mode (Default):**  
  When `DATASTORE` is set to `redis`, the application stores all user data and session data in Redis.  
  This mode is useful for scenarios where you want fast, in-memory storage without the overhead of a relational database.

- **Postgres Mode:**  
  When `DATASTORE` is set to `postgres`, the application stores user credentials in PostgreSQL while continuing to use Redis for session management.  
  This mode allows for persistent user data storage and is useful if you require relational data management alongside fast session token handling.

> Switch the mode by simply updating the `DATASTORE` value in your `.env` file.

## Technologies Used

- **Node.js & Express**
  - The core of the API, handling HTTP requests, routing, and middleware.
- **Sequelize**
  - An ORM for Node.js that abstracts PostgreSQL database interactions, simplifying querying and schema management.
- **PostgreSQL**
  - A relational database used to store user data persistently.
- **Redis**
  - An in-memory data store used for session management and caching.
- **bcryptjs**
  - A library for hashing passwords securely, protecting stored credentials.
- **jsonwebtoken**
  - Used for generating and verifying JWT tokens to handle authentication.
- **express-validator**
  - Provides middleware for validating and sanitizing user inputs.
- **password-validator**
  - Enforces password complexity rules, ensuring robust password strength.
- **Helmet**
  - Adds various HTTP headers (such as Content Security Policy and HSTS) to improve security.
- **cors**
  - Enables Cross-Origin Resource Sharing to control access from other domains.
- **compression**
  - Compresses response bodies for improved performance.
- **express-rate-limit**
  - Implements rate limiting to protect against brute-force attacks and abuse.
- **winston**
  - A logging library used for structured logging to both console and file for debugging and monitoring.
- **dotenv**
  - Loads environment variables from a `.env` file into `process.env` for secure configuration management.
- **express-async-errors**
  - Automatically catches errors in async route handlers without requiring explicit try/catch blocks.
- **Docker & Docker Compose**
  - Containerization technologies that simplify environment setup and deployment across systems.

---

## Features

- **User Registration:**
  - Validates input (username and password) using `express-validator`.
  - Enforces password complexity with `password-validator` and custom error messages.
  - Checks for unique usernames before creating a user.
  - Hashes passwords securely using `bcryptjs`.
- **User Login:**
  - Validates input and checks for user existence.
  - Verifies hashed passwords.
  - Generates a JWT token for authenticated sessions.
  - Stores session tokens in Redis, allowing for easy session invalidation.
- **User Logout:**
  - Validates the presence of a Bearer token in the request header.
  - Verifies and decodes the token.
  - Removes the session from Redis, effectively logging the user out.
- **Security Enhancements:**
  - Uses Helmet to set secure HTTP headers.
  - Implements CORS to control cross-origin requests.
  - Applies global and route-specific rate limiting to mitigate brute-force attacks.
  - Uses compression to improve performance.
- **Database & Session Management:**
  - Utilizes Sequelize for managing and interacting with a PostgreSQL database for user data.
  - Leverages Redis for session storage and quick token revocation.
- **Logging & Monitoring:**
  - Implements structured logging with Winston, outputting logs to both console and file.
  - Logs all incoming requests, errors, and critical authentication events.
  - Provides a health check endpoint (`/health`) to verify database connectivity and overall API status.
- **Environment Validation:**
  - Validates essential environment variables (e.g., `JWT_SECRET`) on startup, preventing misconfiguration.

---

## Testing with Postman

## Endpoints

### User Registration (`/auth/register`)

- **Method:** `POST`
- **Body:**

  - Provide a JSON object with `username` and `password`.
  - Example valid payload:

    ```json
    {
      "username": "testuser",
      "password": "StrongPass1"
    }
    ```

- **Error Messages:**
  - If the password does not meet the complexity requirements, the API returns detailed error messages. For instance, if the password is missing an uppercase letter, the response might include:
    - `"Password must contain at least one uppercase letter."`
  - The error response includes a status code of `400` and a JSON object with an error message and details array.

### User Login (`/auth/login`)

- **Method:** `POST`
- **Body:**

  - JSON object with `username` and `password`.
  - Example payload:

    ```json
    {
      "username": "testuser",
      "password": "StrongPass1"
    }
    ```

- **Response:**
  - A successful login returns a JWT token in the response.

### User Logout (`/auth/logout`)

- **Method:** `POST`
- **Headers:**
  - Set the `Authorization` header to `Bearer <token>` (using the token from the login response).
- **Response:**
  - A successful logout returns a confirmation message.

### Protected Endpoint (`/protected`)

- **Method:** `GET`
- **Headers:**
  - Include the valid JWT token in the `Authorization` header (`Bearer <token>`).
- **Response:**
  - A successful request returns a message confirming access to the protected resource.

## Additional Testing Details

### Validation Testing

- When registering, test with various invalid passwords (e.g., missing an uppercase letter, digits, or containing spaces) to see the custom error messages.

### Rate Limiting

- Attempt to log in repeatedly to verify that the login rate limiter is in effect.

### Health Check

- Access `/health` to verify that the database connection and overall API status are reported correctly.
