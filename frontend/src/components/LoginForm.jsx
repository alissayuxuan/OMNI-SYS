import { useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import "../styles/LoginForm.css"

function Form({route}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()


    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const payload = { username, password };

            const res = await api.post(route, payload)

            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            console.log("LoginForm, res: ", res)
            if (res.data.role === "admin") {
                console.log("admin login")
                navigate("/admin-dashboard");
            } else {
                navigate("/agent-dashboard");
                console.log("agent login")
            }
        } catch (error){
            alert(error)
        } finally {
            setLoading(false)
        }
    }
    return <form onSubmit={handleSubmit} className="form-container">
        <h1>Login</h1>
        <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        />
        <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        />

        <button className="form-button" type="submit">
            login
        </button>
    </form>
}

export default Form