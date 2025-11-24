# G1 - User Authentication UI Tests

## Application URL
```
http://172.22.21.253
```

---

## Test Scenario 1: New User Registration

### Steps:
1. **Navigate to Register Page**
   - Open http://172.22.21.253/register
   - Verify page displays registration form with fields: Name, Email, Nickname (optional), Password, Confirm Password

2. **Fill Registration Form**
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Nickname: "testuser123"
   - Password: "testpass123"
   - Confirm Password: "testpass123"

3. **Submit Form**
   - Click "Register" button
   - **Expected:** Form submits, user is redirected to home page, logged in as "Test User"

4. **Verify User is Logged In**
   - Check if profile dropdown or user menu shows "Test User" or nickname
   - Verify "Profile" link appears in navigation

### Expected Errors to Test:
- Leave Name empty → "Name is required"
- Use invalid email → "Email must be valid"
- Use existing email → "This email is already registered"
- Use existing nickname → "This nickname is already taken"
- Password < 6 characters → "Password must be at least 6 characters"
- Passwords don't match → "Password confirmation does not match"

---

## Test Scenario 2: User Login

### Steps:
1. **Navigate to Login Page**
   - Open http://172.22.21.253/login
   - Verify login form displays

2. **Login with Test Account**
   - Email: "pa@mail.pt"
   - Password: "123"
   - Click "Login"

3. **Verify Login Success**
   - **Expected:** Redirected to home page
   - Verify user is logged in (profile menu visible)

4. **Navigate to Profile**
   - Click profile/user menu → "My Profile" or similar link
   - **Expected:** Profile page loads showing user's current information

### Expected Errors to Test:
- Wrong email → "The provided credentials are incorrect"
- Wrong password → "The provided credentials are incorrect"
- Try login with deleted account → "This account has been deleted"

---

## Test Scenario 3: View and Edit Profile

### Steps:
1. **Access Profile Page**
   - Login and navigate to http://172.22.21.253/profile
   - Verify "Profile Info" tab is active by default

2. **View Current Profile Information**
   - Check all fields are populated with current data:
     - Full Name
     - Nickname
     - Bio (empty is OK)
     - Avatar Filename (empty is OK)

3. **Edit Profile Information**
   - Click on "Profile Info" tab
   - Change Name to "Updated Name"
   - Change Nickname to "updatednickname"
   - Add Bio: "I love Bisca card game!"
   - Change Avatar: "avatar.jpg"

4. **Save Changes**
   - Click "Save Changes" button
   - **Expected:** Green success message: "Profile updated successfully!"
   - Verify fields reflect the updated values

5. **Verify Persistence**
   - Reload page (F5)
   - **Expected:** Updated profile data is still displayed

### Expected Errors to Test:
- Change nickname to one that already exists → "This nickname is already taken"
- Bio > 1000 characters → Should prevent submission or show warning

---

## Test Scenario 4: Change Password

### Steps:
1. **Navigate to Password Tab**
   - On Profile page, click "Change Password" tab

2. **Fill Password Form**
   - Current Password: "123"
   - New Password: "newpass456"
   - Confirm New Password: "newpass456"

3. **Submit Password Change**
   - Click "Change Password" button
   - **Expected:** Success message appears
   - **Expected:** User is logged out and redirected to login page (after 2 seconds)

4. **Login with New Password**
   - Email: "pa@mail.pt"
   - Password: "newpass456"
   - **Expected:** Login successful

5. **Revert Password (Optional)**
   - Repeat steps 1-3 with:
     - Current Password: "newpass456"
     - New Password: "123"
     - Confirm New Password: "123"

### Expected Errors to Test:
- Wrong current password → "The current password is incorrect"
- New passwords don't match → "The new password confirmation does not match"
- Leave any field empty → Validation error

---

## Test Scenario 5: Delete Account

### Steps:
1. **Navigate to Delete Account Tab**
   - On Profile page, click "Delete Account" tab
   - **Expected:** Warning message displays about permanent deletion

2. **Enter Password**
   - Password field is initially disabled (grayed out)
   - Enter current password: "123"
   - "Delete My Account" button becomes enabled

3. **Initiate Deletion**
   - Click "Delete My Account" button
   - **Expected:** Confirmation modal appears with warning message

4. **Confirm Deletion**
   - In modal, click "Yes, Delete" button
   - **Expected:** Account is deleted
   - **Expected:** User is logged out and redirected to login page
   - **Expected:** Success message appears briefly

5. **Attempt to Login with Deleted Account**
   - Try logging in with the deleted user's credentials
   - **Expected:** Error: "This account has been deleted"

### Expected Errors to Test:
- Wrong password → "The password is incorrect"
- Click "Cancel" on confirmation modal → Modal closes, no deletion occurs

---

## Test Scenario 6: New User Registration Flow

### Steps:
1. **From Login Page**
   - Click "Create Account" or "Register here" link
   - **Expected:** Navigated to register page

2. **Register with Unique Data**
   - Fill all fields with valid, unique data
   - Click "Register"
   - **Expected:** Successful registration and auto-login

3. **Verify New Account**
   - Navigate to Profile page
   - Verify all entered data is saved correctly

---

## Browser Compatibility Testing

Test these scenarios in:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (Chrome Mobile, Safari iOS)

---

## Performance Testing

1. **Profile Update Speed**
   - Click "Save Changes"
   - Should complete within 2-3 seconds
   - If loading takes > 5 seconds, investigate

2. **Password Change Speed**
   - Click "Change Password"
   - Should complete within 2-3 seconds

3. **Account Deletion Speed**
   - Click "Yes, Delete"
   - Should complete within 2-3 seconds

---

## Session Management Testing

1. **Token Persistence**
   - Register/Login
   - Reload page
   - Verify still logged in

2. **Token Expiration**
   - After logout, verify cannot access protected pages
   - Should redirect to login

3. **Multiple Tabs**
   - Logout from one tab
   - Check if other tab reflects logout

---

## Accessibility Testing

- Tab navigation works through all form fields
- Buttons are keyboard accessible (Enter key works)
- Error messages are clearly visible
- Color contrast meets WCAG standards
- Form labels are associated with inputs

---

## Data Validation Testing

| Field | Valid | Invalid | Result |
|-------|-------|---------|--------|
| Name | "John Doe" | "" | Required error |
| Email | "john@email.com" | "invalid" | Invalid email error |
| Nickname | "johndoe" | "john@#$%" | Should validate |
| Nickname | "unique123" | "existing123" | Unique constraint error |
| Password | "pass123" | "pass" | Min 6 chars |
| Password | "pass123" | "pass124" (mismatch) | Confirmation error |
| Bio | "Some text" | (1001+ chars) | Max 1000 chars |

---

## Security Testing

1. **Password Security**
   - Verify password fields are masked (dots/asterisks)
   - Password not stored in localStorage unencrypted

2. **Token Security**
   - Token should only be sent over HTTPS in production
   - Token should be sent in Authorization header, not URL

3. **Account Deletion**
   - Password must be verified before deletion
   - Cannot delete without password confirmation

4. **No XSS Vulnerabilities**
   - Try injecting HTML/JS in name field: `<script>alert('xss')</script>`
   - Should display as text, not execute

---

## Test Checklist

- [ ] Registration with all valid fields
- [ ] Registration with missing fields
- [ ] Registration with duplicate email
- [ ] Registration with duplicate nickname
- [ ] Login with correct credentials
- [ ] Login with wrong credentials
- [ ] Profile view loads correctly
- [ ] Profile edit saves correctly
- [ ] Profile edit with duplicate nickname fails
- [ ] Password change with correct password
- [ ] Password change with wrong current password
- [ ] Password change mismatched confirmation
- [ ] Auto-logout after password change
- [ ] Account deletion with password confirmation
- [ ] Account deletion cancellation
- [ ] Deleted account cannot login
- [ ] Page persists after reload
- [ ] Responsive design on mobile
- [ ] Error messages are clear
- [ ] Success messages appear and disappear

---

## Known Test Credentials

After G1 implementation, these test users should exist:

| Email | Password | Type | Purpose |
|-------|----------|------|---------|
| a1@mail.pt | 123 | Admin | Admin testing |
| pa@mail.pt | 123 | Player | Player testing |
| pb@mail.pt | 123 | Player | Player testing |

