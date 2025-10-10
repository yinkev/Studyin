# StudyIn Deployment Checklist

## 1. Pre-deployment Verification
- [ ] Confirm latest commit is tagged `ready-for-release` and CI status is green.
- [ ] Review `backend/.env` or `.env.staging` for current secrets and rotate if expired.
- [ ] Verify database connections from runner: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT 1'`.
- [ ] Confirm Redis connectivity: `redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD PING`.
- [ ] Validate ClamAV signature database is fresh: `freshclam --version` on host.
- [ ] Ensure `docker`, `docker compose`, `pg_dump`, and `pg_restore` are available on the target environment.
- [ ] Announce release window to stakeholders and pause scheduled background jobs.

## 2. Deployment Steps
1. Run database backup:
   ```bash
   cd backend
   DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... ./scripts/backup.sh production
   ```
2. Execute deployment script:
   ```bash
   ./scripts/deploy.sh
   ```
   - For staging use `./scripts/deploy-staging.sh`.
3. Monitor script output for successful migration, partition maintenance, and health check confirmation.

## 3. Database Migrations
- The deployment scripts automatically run `alembic upgrade head`.
- To run manually:
  ```bash
  cd backend
  DATABASE_URL=postgresql+asyncpg://... alembic upgrade head
  ```
- Validate partition maintenance post-migration:
  ```bash
  ./scripts/create_partitions.sh
  psql -c "\d+ user_question_attempts" -d $DB_NAME
  ```

## 4. Rollback Procedures
- Identify the latest backup: `ls -1t backend/backups/production/*.dump | head -n 1`.
- Restore using `pg_restore`:
  ```bash
  PGPASSWORD=$DB_PASSWORD pg_restore --clean --if-exists \
    -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME path/to/backup.dump
  ```
- Redeploy previous application image if necessary (e.g., `docker compose -f docker/docker-compose.prod.yml up -d api=<tag>`).
- Notify stakeholders of rollback completion and capture root-cause notes in `CHANGELOG.md`.

## 5. Monitoring & Logging Setup
- Confirm API health endpoints:
  - Liveness: `GET /health/live`
  - Readiness: `GET /health/ready`
- Tail structured logs:
  ```bash
  docker compose -f docker/docker-compose.prod.yml logs -f api
  ```
- Add Prometheus job pointing to `http://<host>:9090/metrics` once exporter enabled.
- Configure alert thresholds:
  - Access token refresh failures >5/minute
  - Malware detection incidents >0 in 24 hours
  - Request duration >1s p95

## 6. Post-deployment Verification
- [ ] Run backend integration suite: `pytest --maxfail=1 --disable-warnings backend/tests/integration`.
- [ ] Run frontend integration tests: `npm run test -- --run` inside `frontend`.
- [ ] Execute smoke tests against production endpoints:
  - Login/refresh/logout
  - File upload (clean PDF)
  - WebSocket connect/disconnect
- [ ] Validate monitoring dashboards update, especially error rates and latency.
- [ ] Confirm CI/CD workflow marked deployment job successful.

## 7. Troubleshooting Guide
- **Docker build failures**: Run `docker system prune -f` to reclaim space and rebuild with `--no-cache`.
- **Alembic connection errors**: Double-check `DATABASE_URL`; ensure Postgres security group allows runner IP.
- **Redis authentication failures**: Confirm `REDIS_PASSWORD` matches container command and `.env` values.
- **ClamAV scan timeouts**: Restart ClamAV container (`docker compose restart clamav`) and verify socket path.
- **WebSocket reconnection loops**: Inspect frontend logs for stale tokens; invalidate sessions via auth store.
- **CI/CD secrets missing**: Verify GitHub repository secrets listed in `.github/workflows/deploy.yml` exist and are up to date.

Document all incidents and lessons learned in `CHANGELOG.md` after each deployment.
