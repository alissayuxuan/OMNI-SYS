// idea: if we wrap something in protected route then we need to have an authorization token before you can access the route
import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "@/api"
import { REFRESH_TOKEN, ACCESS_TOKEN } from "@/constants"
import { useState, useEffect, useContext, createContext } from "react"

export const UserContext = createContext(null);

export const ProtectedRoute = ({children, role}) => {
    console.log("ProtectedRoute!!!!!, role:", role)

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
            console.log("refresh token response", res)
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access)
                const checkRoleBool = checkRole(res.data.access)
                console.log("!!checkRole!! ", checkRoleBool)
                setIsAuthorized(checkRole)
                //setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
            }
        } catch (error) {
            console.log(error);
            setIsAuthorized(false);
        }
    }

    // check the role of the user
    const checkRole = (token) => {
        try {
            const decoded = jwtDecode(token)
            console.log("decoded token", decoded)
            setUser({
                //name: decoded.name,
                //username: decoded.username,
                role: decoded.role,
                //created: decoded.created, // falls im Token
              });

            return decoded.role === role
        } catch (error) {
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
            console.log("token", token)
            setIsAuthorized(checkRole(token))
            //setIsAuthorized(true)
        }
    }

    if (isAuthorized === null) {
        return <div>Loading...</div>
    }

    console.log("!!!!!!!!!isAuthorized:", isAuthorized)
    return isAuthorized ? (
        <UserContext.Provider value={user}>
          {children}
        </UserContext.Provider>
      ) : (
        <Navigate to="/" />
      );
};   


/*export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within an UserContext.Provider');
  }
  return context;
};  */