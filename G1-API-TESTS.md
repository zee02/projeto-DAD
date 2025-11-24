# G1 - User Authentication API Tests

## Base URL
```
http://172.22.21.253/api
```

---

## 1. Register New User

**Endpoint:** `POST /auth/register`

**Request:**
```bash
curl -X POST http://172.22.21.253/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe",
    "type": "P",
    "blocked": false,
    "photo_avatar_filename": null,
    "bio": null,
    "coins_balance": 0,
    "created_at": "2025-11-24T12:00:00.000000Z"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Error Cases:**
- Email already exists (422)
- Nickname already exists (422)
- Passwords don't match (422)
- Validation errors (422)

---

## 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```bash
curl -X POST http://172.22.21.253/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe",
    "type": "P",
    "blocked": false,
    "photo_avatar_filename": null,
    "bio": null,
    "coins_balance": 0
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Error Cases:**
- Invalid credentials (422)
- Account deleted (422)

---

## 3. Get Current User Profile

**Endpoint:** `GET /user/profile`

**Request:**
```bash
curl -X GET http://172.22.21.253/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe",
    "type": "P",
    "blocked": false,
    "photo_avatar_filename": null,
    "bio": null,
    "coins_balance": 0
  }
}
```

---

## 4. Update Profile

**Endpoint:** `PUT /user/profile`

**Request:**
```bash
curl -X PUT http://172.22.21.253/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "nickname": "johnupdated",
    "bio": "I love playing Bisca!",
    "photo_avatar_filename": "avatar.jpg"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "john@example.com",
    "nickname": "johnupdated",
    "type": "P",
    "blocked": false,
    "photo_avatar_filename": "avatar.jpg",
    "bio": "I love playing Bisca!",
    "coins_balance": 0
  }
}
```

**Note:** You can send partial updates. Only fields provided will be updated.

---

## 5. Change Password

**Endpoint:** `POST /user/change-password`

**Request:**
```bash
curl -X POST http://172.22.21.253/api/user/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "password123",
    "new_password": "newpassword456",
    "new_password_confirmation": "newpassword456"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Password changed successfully. Please login again."
}
```

**Note:** User will be logged out of all sessions after password change.

**Error Cases:**
- Current password incorrect (422)
- New passwords don't match (422)

---

## 6. Delete Account (Soft Delete)

**Endpoint:** `DELETE /user/account`

**Request:**
```bash
curl -X DELETE http://172.22.21.253/api/user/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Note:** Account is soft-deleted. User data is preserved in database with `deleted_at` timestamp.

**Error Cases:**
- Password incorrect (422)

---

## 7. Logout

**Endpoint:** `POST /auth/logout`

**Request:**
```bash
curl -X POST http://172.22.21.253/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Test Data

**Admin Account:**
- Email: `a1@mail.pt`
- Password: `123`

**Player Account:**
- Email: `pa@mail.pt`
- Password: `123`

---

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer {token}
```

The token is received after login or registration and should be stored and sent with every authenticated request.

---

## Response Status Codes

- `200` - Success
- `201` - Created (registration)
- `422` - Validation error
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden
- `404` - Not found
- `500` - Server error
