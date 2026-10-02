# Bookify Backend

Backend API for **Bookify**, a multi-tenant SaaS platform for appointment-based businesses such as barbershops, beauty salons, tattoo studios, and spas.

Bookify provides businesses with tools to manage appointments, customers, professionals, services, schedules, availability, and team access, while also supporting a public booking experience for customers.

## Features

- Multi-tenant architecture with tenant isolation
- Authentication with JWT and HTTP-only cookies
- Google OAuth authentication
- Role-based access control (Owner, Admin, Staff)
- User sessions and device management
- Business and team management
- Professional profiles and service assignments
- Customer management
- Service management
- Appointment scheduling and management
- Dynamic availability and time-slot calculation
- Working hours and schedule exceptions
- Public booking flow
- Team invitations and membership management
- Email verification and password recovery
- Professional commissions
- Security and authorization guards
- Multi-plan foundation for SaaS billing

## Tech Stack

- **Node.js**
- **TypeScript**
- **NestJS**
- **PostgreSQL**
- **Prisma ORM**
- **Docker**
- **JWT**
- **Google OAuth**

## Architecture

Bookify follows a modular NestJS architecture designed around isolated business domains.

The platform is multi-tenant: tenant-scoped operations are executed within an active tenant context, with authorization and tenant isolation enforced through guards and permissions.

Authentication uses short-lived access tokens and refresh tokens stored through HTTP-only cookies. Session and device management provide additional control over authenticated sessions.

The scheduling system combines professional working hours, service duration, booking restrictions, schedule exceptions, existing appointments, and availability rules to determine bookable time slots.

The backend exposes both authenticated endpoints for the management application and public endpoints used by the customer-facing booking website.

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Docker

### 1. Clone the repository

```bash
git clone <repository-url>
cd bookify-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file from the provided example:

```bash
cp .env.example .env
```

Update the values in `.env` according to your local environment.

The `.env.example` file contains the environment variables required by the application without including private credentials.

### 4. Start PostgreSQL

A Docker Compose configuration is included for running PostgreSQL locally.

```bash
docker compose up -d
```

Verify that the database is running:

```bash
docker compose ps
```

### 5. Run database migrations

Apply the existing Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client if necessary:

```bash
npx prisma generate
```

### 6. Start the backend

```bash
npm run start:dev
```

By default, the API runs at:

```text
http://localhost:4000/api
```

## Environment Variables

Environment-specific configuration is managed through environment variables.

See:

```text
.env.example
```

for the complete list of required variables.

Never commit your local `.env` file or production credentials.

## Database

Bookify uses **PostgreSQL** as its relational database and **Prisma ORM** for database access and migrations.

Database schema changes are versioned through Prisma migrations, allowing a new database to be reconstructed from the migration history.

## Related Applications

Bookify is divided into three applications:

- **Bookify Backend** — NestJS API and business logic
- **Bookify App** — Management dashboard for businesses and staff
- **Bookify Web** — Public website and customer booking experience

Each application is maintained in its own repository.

## Development Status

Bookify is currently under active development.

The project is being developed as a complete SaaS platform and may contain features or APIs that are still evolving.

## License

Copyright © 2026 Iván Rodríguez. All rights reserved.

This source code is publicly available for viewing and portfolio purposes only.

No permission is granted to copy, modify, distribute, sublicense, sell, or use this software or substantial portions of it for commercial purposes without prior written permission from the author.
