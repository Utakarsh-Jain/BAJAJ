# SRM Full Stack Engineering Challenge

Production-ready Node.js and Express application for processing directed node relationships into tree insights, with a single-page frontend for submission and inspection.

## Project structure

- `server.js`: server bootstrap
- `src/app.js`: Express app setup and middleware
- `src/config/identity.js`: required identity fields
- `src/controllers/`: HTTP handlers
- `src/routes/`: API route definitions
- `src/services/hierarchyService.js`: validation, tree construction, cycle detection, and summary logic
- `public/`: static frontend assets
- `tests/`: logic tests
- `scripts/verify.js`: lightweight end-to-end verification against the running API

## Run locally

```bash
npm install
npm start
```

The application runs on `http://localhost:3000`.

## Test and verify

Run the unit tests:

```bash
npm test
```

Run the API verification script while the server is running:

```bash
npm run verify
```

## API contract

### `POST /bfhl`

Request body:

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

Response fields:

- `user_id`
- `email_id`
- `college_roll_number`
- `hierarchies`
- `invalid_entries`
- `duplicate_edges`
- `summary`

Summary fields:

- `total_trees`
- `total_cycles`
- `largest_tree_root`
