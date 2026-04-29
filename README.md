# Developer Setup

## Prerequisites

Make sure you have the following installed:

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js + npm](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)

Install EF Core CLI globally if you haven't:

```bash
dotnet tool install --global dotnet-ef
```

---

## 1. Start the Database

Make sure Docker Desktop is running, then start the Postgres container:

```bash
docker start swedish-quiz
```

If you're setting up for the first time and the container doesn't exist yet:

```bash
docker run --name swedish-quiz -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=swedishquiz -e POSTGRES_USER=postgres -p 5432:5432 -d postgres
```

Verify it's running:

```bash
docker ps
```

You should see `swedish-quiz` in the list.

---

## 2. Run Database Migrations

From the `backend/Backend` directory:

```bash
dotnet ef database update
```

This applies all pending migrations and creates the tables if they don't exist yet.

---

## 3. Run the Backend

From the `backend/Backend` directory:

```bash
dotnet run
```

The API will be available at `https://localhost:5001` (or the port shown in the terminal).

---

## 4. Run the Frontend

From the `frontend` directory:

```bash
npm install
npm run dev
```

The React app will be available at `http://localhost:5173` (Vite default).

---

## Adding a New Migration

After changing any model:

```bash
dotnet ef migrations add YourMigrationName
dotnet ef database update
```

## Removing the Last Migration (if not yet applied)

```bash
dotnet ef migrations remove
```

---

## Connection String

Configured in `appsettings.Development.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=swedishquiz;Username=postgres;Password=devpassword"
}
```

> This file is for local development only.
