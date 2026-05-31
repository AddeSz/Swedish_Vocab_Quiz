# Ordivo

Ordivo is the app for anyone who wants to strengthen their Swedish vocabulary. Test your knowledge with quizzes, discover new words, and challenge yourself at different levels. Whether you're studying, preparing for exams, or simply want to improve your Swedish, Ordivo helps you learn more every day.

## Tech Stack

**Backend:** ASP.NET Core (.NET 10), Entity Framework Core, PostgreSQL, Auth0 (JWT)

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Auth0

---

## Developer Setup

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js + npm](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)

```bash
dotnet tool install --global dotnet-ef
```

### 1. Start the Database

```bash
docker start swedish-quiz
```

First-time setup:

```bash
docker run --name swedish-quiz -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=swedishquiz -e POSTGRES_USER=postgres -p 5432:5432 -d postgres
```

### 2. Run Database Migrations

From `backend/Backend`:

```bash
dotnet ef database update
```

### 3. Run the Backend

From `backend/Backend`:

```bash
dotnet run
```

### 4. Run the Frontend

From `frontend`:

```bash
npm install
npm run dev
```

---

## Migrations

Add a new migration after changing any model:

```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```

Remove the last migration (if not yet applied):

```bash
dotnet ef migrations remove
```

---

## Connection String

Configured in `backend/Backend/appsettings.Development.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=swedishquiz;Username=postgres;Password=devpassword"
}
```

> Local development only.
