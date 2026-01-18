# OWP Pool Demo Video Script (2-3 minutes)

## Scene 1: Problem Statement (30 seconds)

**Narration**: "Open-source maintainers face a critical challenge: they want help from the community, but managing unlimited pull requests from unknown contributors is overwhelming. At the same time, developers with AI tools want to contribute, but lack clear, skill-matched tasks."

**Visual**: Show GitHub issues, PRs, overwhelmed maintainer

---

## Scene 2: Solution Overview (30 seconds)

**Narration**: "Introducing OWP Pool - the Open Work Protocol. A distributed task scheduler that coordinates independent contributors without shared accounts or centralized token pooling. Each developer uses their own tools, their own GitHub identity, and gets skill-matched tasks that fit their time window."

**Visual**: Show OWP Pool architecture diagram

---

## Scene 3: Worker Registration (45 seconds)

**Narration**: "Let's see it in action. First, a developer registers as a worker, declaring their skills and capacity."

**Steps**:
1. Open terminal
2. Run: `curl -X POST http://localhost:8787/v1/workers/register -H "Content-Type: application/json" -d '{"name":"Alice","skills":["python","javascript"],"capacity_points":10}'`
3. Show response with worker_id and token
4. Narration: "Alice gets a unique token for authentication. No shared credentials."

---

## Scene 4: Admin Creates Repository (45 seconds)

**Narration**: "Now, a maintainer sets up a repository in OWP Pool with a review budget."

**Steps**:
1. Run: `curl -X POST http://localhost:8787/v1/admin/repos -H "X-Admin-Token: dev-admin-token" -H "Content-Type: application/json" -d '{"repo":"awesome-project","max_open_prs":5}'`
2. Show success response
3. Narration: "The maintainer can set a maximum of 5 open PRs to prevent overwhelming the review process."

---

## Scene 5: Admin Creates Task (45 seconds)

**Narration**: "The maintainer imports a GitHub issue as a task, specifying required skills and complexity."

**Steps**:
1. Run: `curl -X POST http://localhost:8787/v1/admin/tasks -H "X-Admin-Token: dev-admin-token" -H "Content-Type: application/json" -d '{"repo":"awesome-project","title":"Add dark mode support","required_skills":["python"],"estimate_points":3}'`
2. Show task_id in response
3. Narration: "The task is now ready for workers with Python skills."

---

## Scene 6: Worker Fetches Work (45 seconds)

**Narration**: "Alice checks for available work that matches her skills."

**Steps**:
1. Run: `curl -H "Authorization: Bearer <token>" http://localhost:8787/v1/work`
2. Show leased task with details
3. Narration: "Alice gets a task lease with a 4-hour expiration. If she doesn't complete it, it automatically goes back to the queue."

---

## Scene 7: Worker Updates Status (45 seconds)

**Narration**: "Alice completes the work and submits a PR. She updates the task status with the PR link."

**Steps**:
1. Run: `curl -X POST http://localhost:8787/v1/tasks/<task_id>/status -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"status":"completed","pr_url":"https://github.com/awesome-project/pull/42"}'`
2. Show success response
3. Narration: "The task is marked complete with full attribution to Alice."

---

## Scene 8: Dashboard Overview (30 seconds)

**Narration**: "The maintainer monitors everything in real-time through the dashboard."

**Visual**:
1. Show dashboard with worker status
2. Show task monitor with queued and in-progress tasks
3. Show admin controls
4. Narration: "Real-time updates, no polling, complete visibility."

---

## Scene 9: Key Features (30 seconds)

**Narration**: "OWP Pool provides:"

**Visual**: Show bullet points
- BYO-Seat Model: Each contributor uses their own tools
- Capacity-Aware Scheduling: Points-based system with skill matching
- Lease-Based Management: Automatic requeue on timeout
- Distributed Protocol: Workers can be anywhere
- Real-Time Monitoring: Live dashboard with SSE updates

---

## Scene 10: Call to Action (15 seconds)

**Narration**: "OWP Pool is open-source and ready for adoption. Help scale open-source contribution without overwhelming maintainers."

**Visual**: Show GitHub repo link, project logo

---

## Technical Notes

- Total runtime: 2-3 minutes
- Use terminal with large font for readability
- Show actual API responses
- Include captions for all commands
- Use screen recording software (OBS, ScreenFlow, etc.)
- Add background music (optional, royalty-free)
- Export as MP4 at 1080p

## Recording Checklist

- [ ] Server running on localhost:8787
- [ ] Terminal with large font (18pt+)
- [ ] Clear audio/narration
- [ ] All commands visible and readable
- [ ] Responses clearly shown
- [ ] Dashboard screenshots included
- [ ] Professional editing with transitions
- [ ] Captions for all technical content
- [ ] Final video is 2-3 minutes
- [ ] Exported as MP4
