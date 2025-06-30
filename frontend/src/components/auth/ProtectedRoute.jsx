// idea: if we wrap something in protected route then we need to have an authorization token before you can access the route

/**
 * ProtectedRoute – React Component (Higher-Order Route Guard)
 *
 * Protects application routes by checking for valid JWT authentication and enforcing role-based access control.
 * If the user is not authenticated or does not have the required role, they are redirected to the home page (`/`).
 *
 * Features:
 * - Checks for the presence and validity of an access token.
 * - Automatically refreshes the token using the refresh token if expired.
 * - Verifies that the user's role matches the expected role for the route.
 * - Provides decoded user data (e.g., role) via `UserContext` to child components.
 * - Stores access and refresh tokens in `localStorage`.
 *
 * Props:
 * - `children` (ReactNode): The component(s) to render if access is granted.
 * - `role` (string): The required role to access the route (e.g., "admin", "agent").
 *
 * Behavior:
 * - If no token exists → redirects to `/`.
 * - If token is expired → attempts to refresh.
 * - If role mismatch → redirects to `/`.
 * - If authorized → renders `children` inside `UserContext.Provider`.
 *
 * Example usage:
 * <ProtectedRoute role="admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * Dependencies:
 * - `jwt-decode`: For decoding JWTs to access user claims like `role` and `exp`.
 * - `@/api`: Axios instance for HTTP requests.
 * - `@/constants`: Contains `ACCESS_TOKEN` and `REFRESH_TOKEN` keys.
 * - `react-router-dom`: For navigation and redirection (`Navigate`).
 */


import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "@/api"
import { REFRESH_TOKEN, ACCESS_TOKEN } from "@/constants"
import { useState, useEffect, createContext } from "react"

export const UserContext = createContext(null);

export const ProtectedRoute = ({children, role}) => {

    const [isAuthorized, setIsAuthorized] = useState(null)
    const [user, setUser] = useState(null);


    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
    }, [])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)
        try {
            const res = await api.post("/api/auth/user/token/refresh/", {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
                setIsAuthorized(checkRole(res.data.access))
            } else {
                setIsAuthorized(false)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
              })
            setIsAuthorized(false);
        }
    }

    // check the role of the user
    const checkRole = (token) => {
        try {
            const decoded = jwtDecode(token)
            setUser({
                role: decoded.role,
              });

            return decoded.role === role
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
              })
            return false
        }
    }

    // check is access token is available (if not ->login) and valid (if not refresh)
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if(!token) {
            setIsAuthorized(false)
            return
        }
        const decoded = jwtDecode(token)
        const tokenExpiration = decoded.exp
        const now = Date.now() / 1000 // date in seconds

        if (tokenExpiration < now) {
            await refreshToken()
        } else {
            setIsAuthorized(checkRole(token))
        }
    }

    if (isAuthorized === null) {
        return <div>Loading...</div>
    }

    return isAuthorized ? (
        <UserContext.Provider value={user}>
          {children}
        </UserContext.Provider>
      ) : (
        <Navigate to="/" />
      );
};   