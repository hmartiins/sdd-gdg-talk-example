<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR. The Technology Stack & Constraints section is materially expanded:
the concrete language, runtime, web framework, server framework, and storage engine are now
pinned as governed decisions, resolving the TODO(TECH_STACK) deferred at ratification. No
principle was removed, redefined, or weakened, so this is not a MAJOR change; the section
gains new binding obligations rather than clarifying existing wording, so it is not a PATCH.

Source of the pinned stack: `specs/001-project-scaffolding/plan.md` (Technical Context) and
`specs/001-project-scaffolding/research.md` (decisions R-001 through R-005), produced by the
first `/speckit-plan` run as this document required.

Modified principles: none (all five unchanged in name and substance)

Modified sections:
  Technology Stack & Constraints — placeholder bullet replaced with the pinned stack,
  its amendment rule, and the dependency constraints it now carries

Added sections: none

Removed sections: none

Deferred TODOs: none. TODO(TECH_STACK) is resolved by this amendment.

Prior report (v1.0.0, retained for history):
  Version change: (unversioned template) → 1.0.0
  Initial ratification. All placeholder tokens replaced with concrete, enforceable
  governance for the Event RSVP web app.
  [PRINCIPLE_1_NAME] → I. Test-First (NON-NEGOTIABLE)
  [PRINCIPLE_2_NAME] → II. Contract & Integration Testing
  [PRINCIPLE_3_NAME] → III. Guest Data Privacy
  [PRINCIPLE_4_NAME] → IV. Accessibility & Mobile-First Delivery
  [PRINCIPLE_5_NAME] → V. Simplicity & YAGNI
  [SECTION_2_NAME] → Technology Stack & Constraints
  [SECTION_3_NAME] → Development Workflow & Quality Gates
-->

# RSVP Example Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

Every behavior change MUST begin with a failing test. The order is: write the test →
confirm it fails for the intended reason → implement the minimum code to pass → refactor.
Implementation code committed without a preceding test that exercised it is a violation and
MUST be reverted or retro-tested before merge. Red-Green-Refactor applies to bug fixes as
well: a bug fix MUST include a regression test that fails against the unfixed code.

Rationale: RSVP data is submitted once, by guests who will not retry after a silent
failure. Correctness cannot be recovered after the event.

### II. Contract & Integration Testing

Every externally observable contract MUST have an automated test that pins it: HTTP request
and response shapes, persisted schema, and any shared data structure crossing a module
boundary. Contract changes MUST update the contract test in the same change set. The primary
guest-facing flows — viewing an invitation, submitting an RSVP, amending an RSVP, and the
organizer viewing responses — MUST each be covered end-to-end against real storage, not
mocks.

Rationale: Unit tests over mocked boundaries pass while the real flow breaks; the RSVP
submission path has no second chance in production.

### III. Guest Data Privacy

Guest names, email addresses, phone numbers, and dietary or accessibility notes are personal
data. The system MUST collect only fields an organizer demonstrably needs, MUST NOT write
personal data into application logs, error messages, analytics, or third-party services, and
MUST NOT expose one guest's response to another guest. Invitation links MUST use
unguessable tokens rather than sequential identifiers. Every stored personal-data field MUST
have a documented purpose and a documented retention limit; data past that limit MUST be
deletable through a supported operation.

Rationale: Guests never chose to trust this system — the organizer did on their behalf.

### IV. Accessibility & Mobile-First Delivery

Guest-facing pages MUST be designed at mobile viewport widths first and MUST remain fully
usable from 320px upward. All interactive elements MUST be keyboard operable, MUST have
accessible names, and MUST meet WCAG 2.1 AA contrast. Form errors MUST be announced to
assistive technology and associated with their field. An RSVP MUST be completable without
JavaScript-dependent drag, hover, or pointer-only interactions.

Rationale: RSVPs are answered on phones, from an email link, often by guests using
larger text or a screen reader. An unusable form is an uncounted guest.

### V. Simplicity & YAGNI

The simplest design that satisfies the current specification wins. Additional services,
abstraction layers, caching, queues, or configuration surfaces MUST NOT be introduced
without a written justification in the feature plan naming the concrete requirement they
serve. Speculative generality — extension points, plugin systems, or options with no current
caller — MUST be removed during review.

Rationale: Complexity added early is paid for on every subsequent change, and this
project's scope is a single event flow.

## Technology Stack & Constraints

The technology stack is a governed decision: once recorded here it MUST NOT be changed
without an amendment to this constitution.

The pinned stack is:

- **Language**: TypeScript in `strict` mode. Type checking MUST be a blocking step of the
  quality gate, not an advisory one.
- **Runtime**: Node.js 22 LTS. The required version MUST be declared in the repository and
  MUST fail loudly at install time when unmet, rather than at run time.
- **Web framework (client)**: React with Vite as the build tool and development server.
- **Server framework**: Fastify, serving both the HTTP API and, in production, the built
  client assets from a single process.
- **Storage**: SQLite, accessed through a synchronous driver, with write-ahead logging and
  foreign key enforcement enabled. Schema changes MUST be expressed as ordered, versioned
  migration files applied repeatably.

Constraints that follow from and constrain the stack:

- Storage MUST be durable and transactional for RSVP writes; a submitted RSVP is never
  acceptable to lose. Read-validate-write on an RSVP MUST occur in a single transaction.
- Third-party dependencies that receive guest personal data MUST NOT be added. Other new
  runtime dependencies MUST be justified in the feature plan, and the justification MUST be
  recorded in a versioned dependency register in the repository.
- The application MUST run locally with a single documented command and no external cloud
  services, containers, or credentials required for development.
- Application code MUST be organized in layers whose permitted dependency directions are
  enforced automatically by static analysis. Business rules for RSVP MUST NOT depend on
  user interface code or on the storage mechanism. A layering violation MUST fail the
  quality gate — documenting the architecture without enforcing it does not satisfy this
  requirement.
- Adding a further runtime process, service, or datastore beyond the single application
  process and its SQLite file is an amendment to this section, not a plan-level decision.

## Development Workflow & Quality Gates

- Work follows the Spec Kit flow: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`. Implementation MUST NOT begin before an approved plan exists.
- Every plan MUST include a Constitution Check that names each of the five principles and
  states how the feature satisfies it, or records an explicit, justified exception.
- The full test suite MUST pass before merge. A red suite blocks merge; skipping or
  deleting a failing test to unblock is prohibited.
- Reviews MUST verify test-first ordering (test present and meaningful), absence of personal
  data in logs, and accessibility of any new guest-facing markup.
- Any exception granted to a principle MUST be recorded in the feature plan's Complexity
  Tracking section with the simpler alternative that was rejected and why.

## Governance

This constitution supersedes all other development practices for this project. Where a
convention, tool default, or prior habit conflicts with a principle here, this document
wins.

Amendments MUST be made by editing this file through `/speckit-constitution`, MUST document
the change in the Sync Impact Report at the top of the file, and MUST carry a version bump.
Versioning is semantic: MAJOR for removing or redefining a principle in a
backward-incompatible way, MINOR for adding a principle or materially expanding guidance,
PATCH for clarifications and wording that do not change obligations. The `Last Amended` date
MUST be updated on every content change; the `Ratified` date never changes.

Compliance is reviewed at two gates: at planning time via the plan's Constitution Check, and
at review time before merge. Reviewers are responsible for blocking non-compliant changes.
Repeated exceptions to the same principle are a signal that the principle needs amendment —
raise it as an amendment rather than accumulating exceptions.

**Version**: 1.1.0 | **Ratified**: 2026-08-13 | **Last Amended**: 2026-08-13
