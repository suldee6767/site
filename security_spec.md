# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **UserProfile (`/users/{userId}`)**: A user profile document ID must strictly equal the authenticated verified user's `request.auth.uid`. Users cannot read, list, create, update, or delete another user's profile. `uid` and `createdAt` are immutable after creation, and all timestamps must match `request.time`.
2. **GameScore (`/scores/{scoreId}`)**: Every score entry must belong to the authenticated verified creator (`incoming().userId == request.auth.uid`), have valid bounded enums (`mode` in `['emoji', 'anime', 'character']`, `difficulty` in `['normal', 'hard', 'god']`), realistic numeric bounds (`score >= 0 && score <= 1000`, `correctCount >= 0 && correctCount <= totalQuestions`, `totalQuestions >= 1 && totalQuestions <= 100`, `peakSpeed >= 1 && peakSpeed <= 5`), and `createdAt == request.time`. Scores are immutable (`update` denied). Public leaderboard reads are permitted only when `resource.data.isPublic == true`.
3. **ContactMessage (`/messages/{messageId}`)**: Every contact message must be created by an authenticated verified user with `senderUid == request.auth.uid`, initial `status == 'new'`, and `createdAt == request.time`. Because messages contain PII (`senderEmail`), reads and list queries are strictly limited to the original sender (`resource.data.senderUid == request.auth.uid`) or the verified site administrator (`suldee.TA@gmail.com` with `email_verified == true`, or `/admins/{uid}`). Once `status` reaches terminal `'archived'`, no further updates are permitted.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Identity Spoofing on Score Creation**: User `attacker` submits `/scores/s1` with `{ userId: "victim", playerName: "Attacker", mode: "emoji", difficulty: "god", score: 200, correctCount: 20, totalQuestions: 20, peakSpeed: 3.0, isPublic: true, createdAt: request.time }`. Expected: `PERMISSION_DENIED`.
2. **Shadow Field Injection on UserProfile**: Authenticated user `u1` creates `/users/u1` with an extra ghost field `{ ..., isAdmin: true }`. Expected: `PERMISSION_DENIED`.
3. **Unverified Email Spoofing on Admin Read**: Attacker authenticates with `email: "suldee.TA@gmail.com"` and `email_verified: false` to list `/messages`. Expected: `PERMISSION_DENIED`.
4. **PII Blanket List on Messages**: Non-admin authenticated user `u2` queries `/messages` without filtering to `senderUid == 'u2'`. Expected: `PERMISSION_DENIED`.
5. **PII Cross-User Get on Messages**: User `u2` reads `/messages/msg_from_u1`. Expected: `PERMISSION_DENIED`.
6. **ID Poisoning (Oversized/Invalid Doc ID)**: User `u1` attempts `setDoc` at `/scores/invalid$$$id` or 200-char ID. Expected: `PERMISSION_DENIED`.
7. **State Shortcutting on ContactMessage Creation**: User `u1` submits a new message with `status: "read"` instead of `"new"`. Expected: `PERMISSION_DENIED`.
8. **Score Tampering via Update**: User `u1` tries to update `/scores/s1` to raise `score` from `50` to `990`. Expected: `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: User `u1` submits `/scores/s2` with a backdated `createdAt` not equal to `request.time`. Expected: `PERMISSION_DENIED`.
10. **Immutable Field Mutation on UserProfile**: User `u1` updates `/users/u1` attempting to alter `uid` or `createdAt`. Expected: `PERMISSION_DENIED`.
11. **Terminal State Violation on Archived Message**: Admin attempts to mutate `/messages/m1` after `status == 'archived'`. Expected: `PERMISSION_DENIED`.
12. **Resource Exhaustion (Value Poisoning)**: User `u1` submits `/messages/m2` with a 5000-character `message` exceeding `maxLength: 2000`, or negative/over-limit score `99999`. Expected: `PERMISSION_DENIED`.

## 3. Verification
All 12 payloads are encoded in `firestore.rules.test.ts` and validated against the production `firestore.rules` and `@firebase/eslint-plugin-security-rules`.
