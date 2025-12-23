# Go Judge Worker

Worker service for executing and judging code submissions using **go-judge**.

## Description
The worker retrieves `submissionId` from the Redis queue (`judge:queue`), fetches submission details from the backend, compiles and executes the code for each testcase, then sends the judging result back to the backend via an internal API.

## Workflow
1. `LPOP judge:queue`
2. Fetch submission data from the backend
3. Compile source code
4. Execute all testcases
5. Determine final status (AC, WA, TLE, etc.)
6. Send the result to the backend

## Environment
```env
BACKEND_URL=
INTERNAL_API_KEY=
REDIS_URL=
```

- AC — Accepted
- WA — Wrong Answer
- TLE — Time Limit Exceeded
- MLE — Memory Limit Exceeded
- RE — Runtime Error
- CE — Compile Error


Notes
- The worker must run in a privileged environment (Docker) for go-judge
- Backend endpoints are protected using x-internal-key
