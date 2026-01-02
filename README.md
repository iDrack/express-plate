# Express-plate

Ready to use node boiler plate using Typescript and TypeORM with user and roles management already implemented.

## Setup

1. Clone the repository
2. Install dependencies: 
   
   `npm install`

3. Create .env file like so:
   
   ```
    PORT=
    NODE_ENV=
    LOG_LEVEL=

    DOCKER_CONTAINER_NAME=

    JWT_SECRET=
    JWT_EXPIRES_IN=
    JWT_REFRESH_SECRET=
    JWT_REFRESH_EXPIRES_IN=

    DATABASE_NAME=
    DATABASE_USER=
    DATABASE_PASSWORD=
    DATABASE_PORT=
   ```

## Features:

- database : PostgreSQL
- auth : JWT
- ORM : TypeORM
- API documentation : Swagger