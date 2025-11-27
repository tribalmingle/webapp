# Manual QA Cases (Phase 8)
Date: 2025-11-24

Structure: ID | Module | Scenario | Steps | Expected Result | Notes

| ID | Module | Scenario | Steps | Expected | Notes |
|----|--------|----------|--------|---------|-------|
| QA-001 | Overview | Alert drilldown | Trigger test alert; open dashboard; click alert | Navigates to source module | Use staging flag |
| QA-002 | CRM | Add note | Search test user; add note; reload | Note appears in timeline | Check category label |
| QA-003 | CRM | Create task | Add task; set due; mark complete | Status updates to done | Audit entry recorded |
| QA-010 | Support | SLA breach flag | Create urgent ticket; simulate time pass | SLA badges red | Requires clock override |
| QA-011 | Support | Assign ticket | Assign to agent; refresh | AssignedTo populated | SLA unaffected |
| QA-020 | Trust | Moderate report | Open report; reject content | Action logged; status updated | History timeline updated |
| QA-021 | Trust | Ban user | Ban via action modal | User flagged banned | Duration recorded |
| QA-030 | Growth | Create segment | Build rule; save; evaluate | Member count >0 | Rule stored correctly |
| QA-031 | Growth | Launch campaign | Create; schedule immediate | Status transitions to sending | Metrics increment |
| QA-040 | Events | Create event | Fill form; submit | Event listed in calendar | Slug generated |
| QA-041 | Events | Check-in attendee | Scan QR; confirm | Status = checked_in; timestamp set | Retry idempotent |
| QA-050 | Billing | View LTV | Load billing page | Cohort chart renders | 3 curves visible |
| QA-051 | Billing | Refund reasons | Load refunds | Pie chart segments sum to 100% | Category labels |
| QA-060 | Labs | Toggle flag | Create flag; toggle on | Enabled=true | Audit entry added |
| QA-061 | Labs | Variant distribution | Create A/B; sample users | ~weight distribution | Statistical variance acceptable |
| QA-070 | System | Health refresh | Open system page; refresh | Checks updated timestamp | Cache TTL respected |
| QA-071 | System | Audit filter | Filter by action | Only matching entries show | Pagination holds |
| QA-080 | Analytics | Funnel analysis | Run funnel steps | 3-step array with counts | Dropoff computed |
| QA-081 | Analytics | Cohort retention | Query cohort | Array of periods | Values sum logically |
| QA-090 | Security | Auth enforcement | Hit admin endpoint w/o token | 401/403 returned | No data leakage |
| QA-091 | Security | RBAC restriction | Use non-admin user | 403 | Audit log attempted access |
| QA-100 | Performance | Segment count latency | Evaluate heavy segment | <800ms response | Warm cache second try |

Execution Log Template:
- Tester:
- Date:
- Env: staging / production shadow
- Cases Executed:
- Failures:
- Follow-ups:

Exit Criteria: All critical (P1) cases pass; non-critical issues logged & triaged.
