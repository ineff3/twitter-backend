# Twitter Clone Backend

This is the backend part of the Twitter clone project built with Node.js, Express, and MongoDB.

## Getting Started

### Prerequisites

-   Node.js
-   MongoDB Atlas account

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/ineff3/twitter-backend.git
    cd twitter-backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Set up environment variables:

-   Copy the `.env.example` file to `.env`:
    ```
    cp .env.example .env
    ```
-   Fill in your MongoDB connection string and other secrets in the `.env` file:

    ```dotenv
    DB_CONNECTION_STRING='mongodb+srv://<username>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority'
    ACCESS_TOKEN_SECRET='your_access_token_secret'
    REFRESH_TOKEN_SECRET='your_refresh_token_secret'
    PORT='3000'
    CORS_ORIGIN='http://localhost:5173'
    ```

    DB_CONNECTION_STRING: Your MongoDB connection string.
    ACCESS_TOKEN_SECRET: Secret key for generating access tokens.
    REFRESH_TOKEN_SECRET: Secret key for generating refresh tokens.
    PORT: Port number for the server (default is 3000).
    CORS_ORIGIN: The origin URL for CORS (your frontend parat URL).

4. Start the server:

    ```
    nodemon server
    ```

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

-   `DB_CONNECTION_STRING`: Your MongoDB connection string.
-   `ACCESS_TOKEN_SECRET`: Secret key for generating access tokens.
-   `REFRESH_TOKEN_SECRET`: Secret key for generating refresh tokens.
-   `PORT`: Port number for the server (default is 3000).
-   `CORS_ORIGIN`: The origin URL for CORS (your frontend's URL).
