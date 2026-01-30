# Express-plate

Ready to use node boiler plate using Typescript and TypeORM with user and roles management already implemented.

## Setup

1. Clone the repository
2. Install dependencies:
   `npm install`

3. Create .env file like so:

```text
PORT=
NODE_ENV=
APP_VERSION=

LOG_LEVEL=[0 - 6]
LOG_PERSIST=[true - false]

DOCKER_CONTAINER_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

DATABASE_USER=
DATABASE_NAME=
DATABASE_PASSWORD=
DATABASE_PORT=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
```

## Features

- database : PostgreSQL
- auth : JWT
- ORM : TypeORM
- API documentation : Swagger
