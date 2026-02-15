# Express-plate

Ready to use node boiler plate using Typescript and TypeORM.

This boiler plate currently implements user and role management (with password reset), file transfert, unit testing and health check endpoints usable by Kubernates health probes.

A docker-compose file containing a Postgres database and a Redis instance is available to get you started quickly.

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

- Database : PostgreSQL
- Auth : JWT
- ORM : TypeORM
- API documentation : Swagger
- File transfer : Multer
- Password reset (reset by email) : Nodemailer
- Health check
- Unit tests : Jest

## Main dependencies

- express
- typescript
- typeorm
- pg (database)
- multer (file upload)
- jsonwebtoken (JWT)
- bcrypt (password hashing)
- swagger-ui-express & swagger-jsdoc (API docs)
- nodemailer (email sending)
- jest (unit testing)
