# Nimble Portal API

## Requirements

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14

## Setup

Create a `.env` file in the root of the project:

```env
DATABASE_URL=DATABASE_CONNECTION_STRING
CURRENCYFREAKS_API_KEY=API_KEY
```

# Clone the repository

git clone https://github.com/HenriqueKleinberger/nimble-portal-api
cd nimble-portal-api

# Install dependencies

npm install

# Run database migrations

npx prisma migrate dev

# Start the application

npm run start:dev
