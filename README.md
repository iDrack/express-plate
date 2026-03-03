# Express-plate

Ready to use node boiler plate using Typescript and TypeORM.

This boiler plate currently implements user and role management (with password reset), file transfert, unit testing and health check endpoints usable by Kubernates health probes.

A docker-compose file containing a Postgres database and a Redis instance is available to get you started quickly.

## Features

- Database : PostgreSQL
- Auth : JWT
- ORM : TypeORM
- API documentation : Swagger
- File transfer : Multer
- Password reset (reset by email) : Nodemailer
- Health check
- Unit tests : Jest

## Setup
             
In the release section you will find a package with everything needed to deploy the application in production.

## Contents
- `express-plate-image.tar`: Docker image ready to load
- `docker-compose.yml`: Docker Compose configuration
- `.env`: Environment variables (with secrets)
- `deploy.sh`: Automated deployment script

## Quick Start

1. Download and extract the archive available in the release page to your production server
2. Make sure Docker and Docker Compose are installed
3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer manual steps:

1. Load the Docker image:
   ```bash
   docker load -i express-plate-image.tar
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Check status:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Environment Variables

The `deploy` action will generate a `.env` file contains all necessary environment variables from your github secrets (those values can eb changed at anytime).

```text
PORT=
NODE_ENV=
APP_VERSION=

CLIENT_URL=

LOG_LEVEL=
LOG_PERSIST=

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

## Troubleshooting

- Check logs: `docker-compose logs -f`
- Restart services: `docker-compose restart`
- Stop services: `docker-compose down`
- View service status: `docker-compose ps`

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
