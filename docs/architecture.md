# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React screens focused on rendering and state handling only; all data access flows through a single shared API client in `octofit-tracker/frontend/src/api/client.ts`, with route-level loading, empty, and error states exposed to users as accessible status and alert content.
- Logic tier decision: Build Express routes and a service layer that validate payloads, convert malformed IDs into deliberate 4xx responses, and keep business rules in the backend instead of pushing computation into the browser.
- Data tier decision: Use Mongoose schemas for required fields and defaults, then seed the database idempotently so the app starts with representative users, teams, activities, and workouts without duplicating or deleting unrelated records.
- Activity tracking approach: Validate `userId` and `teamId`, ensure they reference existing documents, and create each activity with normalized `user` and `team` references plus computed `points` and `occurredAt` values derived from the submitted input.
- Team management approach: Require a `name` and `mascot`, default `members` to an empty array, and preserve the submitted member IDs while keeping team data consistent with the user records.
- Leaderboard approach: Aggregate points by team, order totals highest-first, and assign a 1-based rank to each team entry in the final leaderboard payload.
- Workout suggestions approach: Match a user by email, rank recent activity or goal alignment, and return the most relevant workout suggestions with a clear explanation in the `reason` field while returning a 4xx for unknown users.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`  
  This currently fails because the Mongoose schemas are missing required validation for `User`, `Team`, `Activity`, and `Workout`, which means the data contract is not enforcing the required fields or defaults before the API layer can depend on it.
- API command: `npm run test:api --prefix octofit-tracker/backend`  
  This currently fails because the Express routes are still returning placeholder behavior (for example, 501/empty responses) instead of validating input, creating records, computing the leaderboard, and suggesting workouts from real data.
- Frontend command: `npm test --prefix octofit-tracker/frontend`  
  This currently fails because the screen components still render placeholder text and do not yet implement route-specific loading, empty, and error states or the correct data-driven rendering for activities, teams, leaderboard, and workout suggestions.
- Backend build command: `npm run build --prefix octofit-tracker/backend`  
  Use this after the data models and API contract are fixed to confirm the TypeScript backend compiles cleanly before moving to the final UI pass.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`  
  Use this after the API contract is stable and the presentation tier is wired to the shared client to confirm the Vite React app builds successfully with the finished behavior.
