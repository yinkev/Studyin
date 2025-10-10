# MVP Implementation Roadmap

**Last Updated**: 2025-10-09
**Total Time**: 12 hours (1.5 developer days)
**Status**: Ready to Start

---

## 🎯 Quick Overview

You have **39 actionable todos** broken down from **8 major fixes**.

All code examples are provided in `MVP_CRITICAL_FIXES.md` - this is your implementation checklist.

---

## 📅 Recommended Schedule

### **Day 1: Critical Fixes** (6 hours)

#### Morning (3 hours)
- ☐ **Fix #1**: API Interceptor Race Condition (30 min)
  - Add mutex pattern to prevent concurrent token refreshes
  - Test with multiple concurrent API calls

- ☐ **Fix #2**: Database Partitioning (2.5 hours)
  - Create partitioned `user_question_attempts` table
  - Generate 12 monthly partitions
  - Add indexes to each partition
  - Test with EXPLAIN ANALYZE

#### Afternoon (3 hours)
- ☐ **Fix #3**: Backend File Upload Security (3 hours)
  - Install python-magic and ClamAV
  - Create file validation service
  - Update upload endpoint
  - Test malware detection, path traversal, size limits

---

### **Day 2: Should-Fix Items** (6 hours)

#### Morning (3 hours)
- ☐ **Fix #4**: WebSocket Token Refresh (2 hours)
  - Reconnect WebSocket when token changes
  - Add connection timeout
  - Add heartbeat/ping

- ☐ **Fix #5**: CSRF Token Support (1 hour)
  - Generate CSRF tokens on login
  - Validate in middleware
  - Add header to API client

#### Afternoon (3 hours)
- ☐ **Fix #6**: Token Refresh Notifications (30 min)
  - Show toast on refresh failure
  - Redirect to login

- ☐ **Fix #7**: Partition Automation (1 hour)
  - Create cron script
  - Schedule monthly execution

- ☐ **Fix #8**: XSS Sanitization (2 hours)
  - Install DOMPurify
  - Sanitize markdown rendering
  - Test malicious input

- ☐ **Integration Testing** (1.5 hours)
  - Test all flows end-to-end
  - Verify security measures
  - Document results

---

## 📊 Progress Tracking

### Critical (MUST FIX)
```
[  ] Fix #1: API Interceptor          30 min   🔴 BLOCKING
[  ] Fix #2: Database Partitioning     2 hrs   🔴 BLOCKING
[  ] Fix #3: File Upload Security      3 hrs   🔴 BLOCKING
```

### Should Fix (HIGHLY RECOMMENDED)
```
[  ] Fix #4: WebSocket Refresh         2 hrs   ⚠️ BAD UX
[  ] Fix #5: CSRF Tokens               1 hr    ⚠️ SECURITY
[  ] Fix #6: Refresh Notifications    30 min   ⚠️ UX
[  ] Fix #7: Partition Automation      1 hr    ⚠️ OPS
[  ] Fix #8: XSS Sanitization          2 hrs   ⚠️ SECURITY
```

### Testing
```
[  ] Integration Testing              1.5 hrs  ✅ VERIFICATION
```

---

## 🚦 Decision Matrix

### Absolute Minimum MVP (5.5 hours)
If you're **extremely** time-constrained:
```
✅ Fix #1: API Interceptor (MUST - app breaks without it)
✅ Fix #2: Database Partitioning (MUST - future pain)
✅ Fix #3: File Upload Security (MUST - security breach)
```

**Risks if you skip the rest**:
- AI Coach disconnects users mid-chat (bad UX)
- No CSRF protection (security gap)
- Manual partition creation every month (ops burden)
- Silent auth errors (confusing UX)
- XSS vulnerability (low probability but possible)

### Recommended MVP (12 hours)
Fix all 8 items for:
- ✅ No catastrophic issues
- ✅ Good user experience
- ✅ Minimal security gaps
- ✅ Low operational burden

**Why 12 hours is worth it**:
- All code already written (copy-paste from guide)
- Fixing after launch = 10x harder
- User trust lost on security issue
- Manual ops work adds up over time

---

## 📁 Files You'll Edit

### Frontend
```
frontend/src/lib/api/client.ts              Fix #1, #5
frontend/src/hooks/useWebSocket.ts          Fix #4
frontend/src/hooks/useTokenRefresh.ts       Fix #6
frontend/src/components/AICoach/            Fix #8
```

### Backend
```
backend/alembic/versions/                   Fix #2
backend/app/services/file_validator.py      Fix #3
backend/app/api/materials.py                Fix #3
backend/app/middleware/csrf.py              Fix #5
backend/app/api/auth.py                     Fix #5
backend/docker-compose.yml                  Fix #3
backend/scripts/create_partitions.sh        Fix #7
```

---

## ✅ Completion Criteria

### Before Moving to Next Fix
- [ ] All code written
- [ ] All tests pass
- [ ] No console errors
- [ ] Code reviewed (self or peer)
- [ ] Documentation updated

### Before Launching MVP
- [ ] All 3 critical fixes complete
- [ ] 5/5 should-fix items complete (recommended)
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Performance acceptable
- [ ] User acceptance testing done
- [ ] Deployment runbook ready
- [ ] Monitoring configured

---

## 🎯 Success Metrics

After completing all fixes, you should have:

✅ **Security Score**: 95/100 (up from 40%)
- HttpOnly cookies ✅
- Token rotation ✅
- File upload validation ✅
- CSRF protection ✅
- XSS prevention ✅

✅ **Architecture Score**: 95/100
- No race conditions ✅
- Scalable database ✅
- Automated operations ✅
- Good error handling ✅

✅ **User Experience**: Excellent
- No unexpected logouts ✅
- Fast performance ✅
- Clear error messages ✅
- Reliable AI Coach ✅

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| `MVP_CRITICAL_FIXES.md` | **Detailed implementation guide with all code** |
| `SECURITY_QUICK_FIXES.md` | Original security requirements |
| `FRONTEND_ARCHITECTURE.md` | Frontend code structure |
| `DATABASE_ARCHITECTURE.md` | Database schema and patterns |
| `TECH_SPEC.md` | Overall technical specification |

---

## 🔄 After Implementation

### Update Documentation
1. Mark items complete in this roadmap
2. Update TECH_SPEC.md with actual implementations
3. Document any deviations or learnings
4. Create deployment checklist

### Prepare for Launch
1. Run full test suite
2. Security audit
3. Performance testing
4. Staging deployment
5. User acceptance testing
6. Production deployment

---

## 💡 Pro Tips

1. **Start with Fix #1** (30 min) - Quick win, prevents major issues
2. **Do Fix #2 early** - Database changes easier before data exists
3. **Test incrementally** - Don't wait until the end
4. **Use the provided code** - Copy-paste from MVP_CRITICAL_FIXES.md
5. **Document as you go** - Future you will thank you
6. **Don't skip testing** - Each fix has specific test cases
7. **Ask for help** - If stuck on a fix for >1 hour

---

## 🚀 Ready to Start?

1. ✅ Read `MVP_CRITICAL_FIXES.md` for detailed instructions
2. ✅ Set up development environment
3. ✅ Create feature branch: `git checkout -b mvp-critical-fixes`
4. ✅ Start with Fix #1 (API Interceptor)
5. ✅ Mark todos complete as you go
6. ✅ Test each fix before moving to next
7. ✅ Commit frequently with clear messages

---

**Questions? Check the detailed guide in `MVP_CRITICAL_FIXES.md`**

**Last Updated**: 2025-10-09
**Next Action**: Start Fix #1 - API Interceptor Race Condition
