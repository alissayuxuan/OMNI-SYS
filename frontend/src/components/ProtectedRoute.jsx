// idea: if we wrap something in protected route then we need to have an authorization token before you can access the route
import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "../api"
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants"
import { useState, useEffect } from "react"

function ProtectedRoute({children, role}) {
    const [isAuthorized, setIsAuthorized] = useState(null)

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
                setIsAuthorized(checkRole(res.data.access))
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

    return isAuthorized ? children : <Navigate to="/noncs"/>
}   

export default ProtectedRoute