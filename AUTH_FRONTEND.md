# Frontend Authentication

Simple JWT authentication for Next.js frontend.

## Setup

1. **Environment variable** (optional - already defaults to localhost:8000):
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

2. **Ensure backend is running** with auth endpoints:
   ```bash
   cd marketing-strategy-recommender-be
   python run_server.py
   ```

## Usage

### Login/Register Pages

- **Login**: `/login`
- **Register**: `/register`

### Protecting Routes

**Option 1: Wrap individual pages**
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthHeader } from '@/components/AuthHeader';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <AuthHeader />
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

**Option 2: Use HOC**
```tsx
import { withAuth } from '@/components/ProtectedRoute';

function MyPage() {
  return <div>Protected content</div>;
}

export default withAuth(MyPage);
```

### Using Auth in Components

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

The `apiService` automatically attaches JWT tokens:

```tsx
import { apiService } from '@/services/apiService';

// Token is automatically attached
const result = await apiService.submitForm(formData);
```

## Files Created

- **[src/services/authService.ts](src/services/authService.ts)** - Auth API calls & token storage
- **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)** - Auth context provider & `useAuth` hook
- **[src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)** - Route protection component
- **[src/components/AuthHeader.tsx](src/components/AuthHeader.tsx)** - Header with user info & logout
- **[src/app/login/page.tsx](src/app/login/page.tsx)** - Login page
- **[src/app/register/page.tsx](src/app/register/page.tsx)** - Registration page

## Files Modified

- **[src/app/layout.tsx](src/app/layout.tsx)** - Added `AuthProvider`
- **[src/app/page.tsx](src/app/page.tsx)** - Added `ProtectedRoute` and `AuthHeader`
- **[src/services/apiService.ts](src/services/apiService.ts)** - Added JWT token attachment

## Flow

1. User visits `/` (protected route)
2. Not authenticated → redirected to `/login`
3. User logs in → JWT stored in localStorage
4. Redirected back to `/`
5. All API calls automatically include `Authorization: Bearer <token>`
6. User clicks logout → token cleared, redirected to `/login`

## Testing

```bash
# Start backend
cd marketing-strategy-recommender-be
python run_server.py

# Start frontend
cd marketing-strategy-recommender-fe
npm run dev

# Visit http://localhost:3000
# Should redirect to /login
# Register at /register
# Login at /login
# Access protected pages
```

## Token Storage

- **Location**: `localStorage`
- **Keys**: 
  - `auth_token` - JWT token
  - `user_data` - User object (email, id, created_at)
- **Expiration**: 24 hours (backend default)

## API Endpoints Used

- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login & get JWT
- `GET /api/v1/auth/me` - Get current user info

## Customization

### Change redirect after login
Edit [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx):
```tsx
const login = async (credentials: LoginCredentials) => {
  const user = await authService.login(credentials);
  setUser(user);
  router.push('/dashboard'); // Change this
};
```

### Add loading state to protected routes
Already included in `ProtectedRoute` component with spinner.

### Remember me functionality
Add checkbox on login page that stores a flag in localStorage to skip token expiration checks (requires backend support for refresh tokens).
