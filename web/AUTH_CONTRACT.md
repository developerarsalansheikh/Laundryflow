# LaundryFlow — Backend Authentication Contract

## Discovered From
Backend source code inspection (DO NOT modify backend).

---

## 1. Login Endpoint

| Item | Value |
|------|-------|
| **URL** | `POST /api/auth/login` |
| **Access** | Public |
| **Rate limit** | 20 requests / 15 minutes |

### Request Body (Super Admin — email + password)
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

### Success Response (HTTP 200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<JWT string>",
    "user": {
      "_id": "mongoId",
      "name": "Admin Name",
      "email": "admin@example.com",
      "phone": "1234567890",
      "role": "superadmin",
      "laundryId": null
    }
  }
}
```

### Error Responses
| HTTP | Condition | `message` |
|------|-----------|-----------|
| 401 | Wrong email or password | `"Email ya password galat hai"` |
| 403 | Account not verified | `"Account verify nahi hua hai"` |
| 403 | Account deactivated | `"Account deactivate hai"` |
| 400 | Missing fields | `"Email+password ya phone — koi ek dena zaroori hai"` |
| 429 | Rate limited | `"Bahut zyada attempts, 15 minute baad try karein"` |
| 500 | Server error | `"Login mein kuch problem aayi"` |

---

## 2. Token Mechanism

| Item | Value |
|------|-------|
| **Token type** | JWT (Bearer) |
| **Token location in login response** | `data.accessToken` |
| **Token expiry** | `1d` (1 day) |
| **Authorization header** | `Authorization: Bearer <accessToken>` |
| **JWT payload claims** | `{ id, role }` |

---

## 3. Refresh Token

| Item | Value |
|------|-------|
| **Refresh token** | YES — exists |
| **Refresh endpoint** | `POST /api/auth/refresh-token` |
| **Refresh token location** | HttpOnly cookie named `refreshToken` |
| **Refresh token expiry** | `7d` (7 days) |
| **Refresh mechanism** | Backend reads `req.cookies.refreshToken` |
| **Refresh response** | `{ success: true, data: { accessToken: "<new JWT>" } }` |

> ⚠️ The refresh token is stored in an **HttpOnly cookie**, not in the response body.  
> The frontend cannot read the refresh token directly.  
> The frontend calls `/api/auth/refresh-token` (with `credentials: true`) and receives a new `accessToken`.

---

## 4. Logout

| Item | Value |
|------|-------|
| **Logout endpoint** | `POST /api/auth/logout` |
| **Behavior** | Clears `refreshToken` cookie server-side + removes from DB |
| **Auth required** | No (uses cookie directly) |
| **Request** | Empty body, must send cookies (`credentials: true`) |
| **Response** | `{ success: true, message: "Logout successful" }` |

---

## 5. No "Current User" Endpoint

The backend does **NOT** expose a `/api/auth/me` or `/api/auth/current-user` endpoint.

**Session restoration strategy:**  
- Store `accessToken` and `user` object in `localStorage`.
- On app start: restore from localStorage.
- Validate by calling `/api/auth/refresh-token` (uses HttpOnly cookie) to check if session is still alive.
- If refresh fails → clear local auth state → redirect to `/login`.

---

## 6. Role System

| Role | Description | Web App Access |
|------|-------------|---------------|
| `superadmin` | Platform owner | ✅ YES |
| `admin` | Laundry business owner | ❌ NO |
| `delivery` | Delivery partner | ❌ NO |
| `user` | Customer | ❌ NO |

**Exact role string used in backend:** `"superadmin"` (lowercase, no underscore)

---

## 7. Super Admin Protected Routes

All `/api/super-admin/*` routes require:
- `Authorization: Bearer <accessToken>` header
- Role: `superadmin` (enforced via `restrictTo("superadmin")` middleware)

---

## 8. CORS Configuration

| Item | Value |
|------|-------|
| **Allowed origin** | `process.env.FRONTEND_URL` or `http://localhost:3000` |
| **Credentials** | `true` (required for HttpOnly cookie) |
| **Methods** | GET, POST, PUT, DELETE |
| **Allowed headers** | Content-Type, Authorization |

> ⚠️ Frontend MUST run on `http://localhost:3000` in development.  
> The `.env` file already has `VITE_API_URL=http://localhost:8080`.  
> Vite dev server must be configured to serve on port `3000`.

---

## 9. Error Response Shape

All errors follow:
```json
{
  "success": false,
  "message": "Human readable error message"
}
```

---

## 10. Auth Middleware Behavior

The `protect` middleware:
1. Reads `Authorization: Bearer <token>` header
2. Verifies JWT with `JWT_SECRET`
3. Looks up user in DB
4. Returns 401 if token invalid/expired
5. Returns 403 if user deactivated or not verified
6. Sets `req.user` for downstream handlers

---

## 11. Frontend Persistence Strategy

Persist in `localStorage`:
- `lf_token` — access token string
- `lf_user` — user object (JSON)

Do NOT persist:
- Password
- Refresh token (it lives in HttpOnly cookie, managed by browser)

---

## 12. 401 Handling Strategy

```
API returns 401
    ↓
Call POST /api/auth/refresh-token (with credentials: true)
    ↓
If success → retry original request with new access token
    ↓
If refresh fails (403/401) → clear localStorage auth → redirect to /login
```

---

## 13. Important Notes

- **No `SUPER_ADMIN` variant** — backend only uses `"superadmin"` (lowercase)
- **No `/api/auth/me` endpoint** — session validated via refresh-token endpoint
- **Cookie requires `credentials: true`** on all axios requests
- **Backend port: 8080** — frontend origin must be port 3000 to satisfy CORS
