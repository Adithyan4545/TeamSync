# Module 4 Implementation Plan

## Goal Description
Implement the complete Hackathon Discovery and Team Discovery platform (Module 4) end‑to‑end. This includes backend services, controllers, routes, validation, authentication/authorization, notification handling, and the full set of frontend pages, components, hooks, and UI integrations. The implementation must meet all functional requirements (CRUD, search, filter, pagination, bookmarking, join requests, notifications) and adhere to the project's design aesthetics, TypeScript strictness, and testing standards.

---

## User Review Required
> [!IMPORTANT]
> Review the proposed architecture and any design decisions that may affect existing modules.
>
> - **API Versioning**: All new endpoints will be under `/api/v1/`. Confirm if this aligns with existing API versioning strategy.
> - **Pagination Defaults**: Default page size set to 12 items. Change if desired.
> - **Notification Types**: Currently supporting `NEW_HACKATHON`, `JOIN_REQUEST`, `JOIN_REQUEST_ACCEPTED`, `JOIN_REQUEST_REJECTED`. Confirm if additional types are needed now.
> - **File Upload Handling**: Using `multer` for banner and logo uploads to `uploads/` directory. Confirm storage location and any size limits.
> - **Rate Limiting**: Apply a generic rate limiter (100 requests per 15 min) to all public routes. Adjust limits if required.

---

## Open Questions
> [!WARNING]
> - **Search Index Fields**: Which fields should be indexed for full‑text search on Hackathons and Teams beyond the ones already defined (title, description, tags, requiredSkills)?
> - **Role‑Based Access**: Do we need fine‑grained permissions (e.g., only the creator can edit a Hackathon, only the team leader can edit a Team) or is admin‑only sufficient?
> - **Notification Delivery**: Should notifications be stored only in MongoDB and fetched via API, or also delivered in real‑time via WebSocket/Server‑Sent Events? (Implementation will start with polling.)
> - **Testing Scope**: Desired coverage percentages for unit vs integration tests?

---

## Proposed Changes

### Backend
#### Services
- **HackathonService** (enhance with sorting utilities, popularity score calculation placeholder)
- **TeamService** (add AI match placeholder fields)
- **BookmarkService** (methods for hackathon & team bookmarks)
- **JoinRequestService** (create, accept, reject, list by user/team)
- **NotificationService** (create, list, mark read)

#### Controllers
- **HackathonController** (already created – add auth middleware reference)
- **TeamController** (already created – add auth middleware reference)
- **BookmarkController** – new file handling bookmark CRUD for both hackathons and teams.
- **JoinRequestController** – new file handling join request workflow.
- **NotificationController** – new file for fetching and updating notifications.

#### Routes (`src/routes/index.ts`)
- Register `/api/v1/hackathons` → HackathonController
- Register `/api/v1/teams` → TeamController
- Register `/api/v1/bookmarks` → BookmarkController
- Register `/api/v1/join-requests` → JoinRequestController
- Register `/api/v1/notifications` → NotificationController

#### Middleware
- **authMiddleware.ts** – verify JWT, attach `req.user` with `id` and `role`.
- **validationMiddleware.ts** – wrapper around `express-validator` and Zod schemas.
- **rateLimiter.ts** – generic rate limiting using `express-rate-limit`.
- **errorHandler.ts** – unified error response format.

#### Validation Schemas (Zod) in `src/validation/` for each DTO.

#### DTOs
- Already added HackathonDTO & TeamDTO. Add **BookmarkDTO**, **JoinRequestDTO**, **NotificationDTO**.

#### Unit & Integration Tests (`tests/`)
- Test each service method (CRUD, search, pagination).
- Test controllers with supertest (auth required).
- Test validation failures.

### Frontend (Next.js 15 + React 19)
#### Pages
- `/hackathons/index.tsx` – feed with search, filter, pagination, bookmark button.
- `/hackathons/[id].tsx` – detailed view, registration link, countdown timer.
- `/teams/index.tsx` – browse teams with similar UI.
- `/teams/[id].tsx` – team detail, leader info, join request button.
- `/notifications/index.tsx` – notification panel with read/unread toggle.

#### Components
- **HackathonCard** (shadcn/ui Card, image, tags, bookmark icon, hover animation).
- **TeamCard** (similar styling, leader avatar, open roles).
- **SearchBar**, **FilterDrawer**, **SortSelect**, **PaginationControls**.
- **BookmarkButton** (optimistic UI update).
- **JoinRequestModal** (form to submit a request, cancel option).
- **NotificationPanel** (list with fade‑in animation, mark as read).

#### Hooks & Types
- `useHackathons.ts`, `useTeams.ts` – data fetching with SWR/React Query.
- `useBookmarks.ts`, `useJoinRequests.ts`, `useNotifications.ts`.
- Type definitions for API responses matching the DTOs.

#### API Integration
- Central Axios instance with JWT interceptor (`src/lib/api.ts`).
- Service layer functions (`src/api/hackathonApi.ts`, etc.) calling backend endpoints.

#### Styling & Animations
- Tailwind config with custom color palette (dark mode, gradient backgrounds).
- Framer Motion for card hover, modal entrance, notification fade.

#### Tests (frontend)
- Jest + React Testing Library for component rendering and interaction.
- Cypress end‑to‑end tests for the full flow (search → bookmark → join request).

---

## Verification Plan
### Automated Tests
- Run `npm test` in both `backend` and `frontend` directories.
- Ensure coverage ≥ 85 % for critical service/controller files.

### Manual Verification
- Start the dev servers (`npm run dev` for both apps).
- Verify UI renders correctly on desktop and mobile breakpoints.
- Test CRUD operations via the UI (admin can create hackathon, leader can create team, student can bookmark and send join request).
- Confirm notifications appear after actions.
- Check pagination, sorting, and filter combos.
- Verify file uploads store images in `uploads/` and URLs are returned.

---

**Implementation will proceed after your approval.**
