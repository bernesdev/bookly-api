<img width="100" height="100" alt="Logo" src="https://github.com/user-attachments/assets/753c031c-6379-4055-9acc-a71dab6d1290" />

# Bookly API

![Tests](https://github.com/bernesdev/bookly-api/actions/workflows/tests.yml/badge.svg)
![NestJS](https://img.shields.io/badge/NestJS-11-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

Bookly API is the backend service for the Bookly ecosystem. It provides endpoints for location search, accommodation catalog, and booking management using a modular NestJS architecture.

> ⚠️ This project is for demonstration and study purposes. No real reservations or payment transactions are processed.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Pagination and Cache](#pagination-and-cache)
- [Getting Started](#getting-started)
- [Running with Vercel](#running-with-vercel)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Author](#author)
- [License and Disclaimer](#license-and-disclaimer)

## Overview

This API centralizes Bookly's core business flow:

- destination search and reverse geocoding
- accommodation listing and sorting
- booking creation and listing by authenticated user
- cache layer with Redis and observability header

## Features

- Feature-first modular organization with dedicated modules for location, accommodation, booking, and firebase.
- Request validation with class-validator and class-transformer.
- Firebase authentication guard on protected booking routes.
- Swagger documentation available at /swagger.
- Cursor-based pagination on list endpoints.
- Redis cache with cache-manager + Keyv.
- Compatible with traditional Node server and serverless runtime (Vercel).

## Architecture

The project follows a layered modular architecture:

```mermaid
graph TD
  Client[Mobile/Web Client] --> API[NestJS Controllers]
  API --> Services[Application Services]
  Services --> Cache[(Redis Cache)]
  Services --> GeoNames[GeoNames API]
  Services --> Firestore[Firebase Firestore]
  API --> Guard[Firebase Guard]
```

## Tech Stack

- NestJS 11
- TypeScript
- Firebase Admin SDK (Auth + Firestore)
- Redis via cache-manager, Keyv, and @keyv/redis
- Axios for external HTTP integrations (GeoNames)
- Swagger for API documentation
- Jest + Supertest for tests

## API Endpoints

Base URL local: http://localhost:3000

Public routes:

- GET /locations/coordinates?lat={lat}&lng={lng}
- GET /locations/search?query={query}&limit={limit}
- GET /locations/top-destinations?limit={limit}&cursor={cursor}
- GET /locations/:id
- GET /accommodations?locationId={locationId}&limit={limit}&cursor={cursor}&sortBy={price_asc|price_desc|distance}
- GET /accommodations/:id

Protected routes (Bearer Firebase ID Token):

- POST /bookings
- GET /bookings?limit={limit}&status={active|completed}&cursor={cursor}
- GET /bookings/:id

Example payload for POST /bookings:

```json
{
  "accommodationId": "123-1",
  "checkIn": "2026-05-01",
  "checkOut": "2026-05-05",
  "rooms": 1,
  "adults": 2,
  "children": 0
}
```

## Authentication

Booking endpoints use Firebase token validation through a guard.

Send the token in the Authorization header:

```http
Authorization: Bearer <firebase-id-token>
```

## Pagination and Cache

List endpoints return a standard page format:

```json
{
  "data": [],
  "meta": {
    "limit": 10,
    "itemCount": 10,
    "hasNextPage": true,
    "nextCursor": "..."
  }
}
```

Cache behavior:

- The API exposes the X-Cache header with HIT or MISS.
- Location and accommodation data use longer cache windows.
- Booking list cache uses versioning and a shorter TTL.

## Getting Started

### Prerequisites

- Node.js LTS
- npm
- Docker (recommended for local Redis)
- Firebase project with Auth and Firestore enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Start Redis (Docker)

```bash
docker compose up -d redis
```

### 3. Configure environment variables

Create a .env file in the project root:

```env
REDIS_URL=redis://localhost:6379
GEONAMES_BASE_URL=http://api.geonames.org
GEONAMES_USERNAME=your_geonames_username
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### 4. Run the API

```bash
npm run start:dev
```

Application URLs:

- API: http://localhost:3000
- Swagger: http://localhost:3000/swagger

## Running with Vercel

This repository includes a serverless entrypoint in api/index.ts and configuration in vercel.json.

Run locally in Vercel mode:

```bash
npm run start:vercel
```

Serverless health check endpoint:

- GET /health

## Testing

Commands:

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Project Structure

```text
api/                    # Vercel serverless entrypoint
src/
  bootstrap/            # App factory and runtime bootstrap
  common/               # Shared decorators, guards, DTOs, interceptors, and utils
  config/               # Environment validation and typed access
  modules/
    accommodation/      # Accommodation feature
    booking/            # Booking feature (protected)
    firebase/           # Firebase provider/module
    location/           # Location and destination feature
  platform/vercel/      # Serverless handler cache
test/                   # End-to-end tests
```

## Author

Gabriel Peres Bernes  
Full-Stack Software Engineer

LinkedIn: https://www.linkedin.com/in/bernesdev/

Email: bernes.dev@gmail.com

## License and Disclaimer

This project is intended for educational and demonstration purposes only.
