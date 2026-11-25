# Sannafly — Security Architecture & Checklist

## Core Security Controls
1. **Authentication & Session Security:**
   - Bcrypt/Argon2id password hashing, rate-limited login (`5 attempts/min` per email+IP), generic login error messages (no account enumeration).
   - Active status enforcement (`active`, `inactive`, `suspended`) checked on login and every authenticated request.
   - Session regeneration on login/logout and session invalidation on password change.
2. **Authorization (RBAC):**
   - Granular `resource.action` permissions enforced via `permission:` middleware and Laravel Policies.
   - Super Admin bypasses permission checks via `Gate::before`, while all other roles require explicit permissions.
   - IDOR prevention via scoped queries and policy checks.
3. **Input, File & Import Security:**
   - Strict FormRequest validation on all endpoints; no mass assignment (`$fillable` explicitly defined).
   - Image uploads validated by MIME type, dimensions, and re-encoded via GD/Imagick (stripping EXIF/malicious payloads).
   - CSV/Excel formula injection sanitization (`=`, `+`, `-`, `@` prefixed on export) and strict MIME/size checks on import.
4. **Audit Logging:**
   - Immutable `audit_logs` recording actor, action, resource type/id, sanitized old/new values, IP, and user agent.
   - Passwords, tokens, and payment secrets are explicitly redacted from logs.
5. **Payment & Financial Security:**
   - Gateway secrets stored encrypted/server-side only; never serialized to Inertia props.
   - Idempotency keys and signature verification for payment callbacks.
