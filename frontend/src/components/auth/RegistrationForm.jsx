/*
import { useState } from "react"
import api from "@/api"
import { useNavigate } from "react-router-dom"
import "@/styles/RegistrationForm.css"

function RegistrationForm({route}) {

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [agentType, setAgentType] = useState("")
    const [role, setRole] = useState("admin") // default role

    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()  


    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const payload = role === "admin"
            ? { username, password, role, first_name: firstName, last_name: lastName, email }:
            { username, password, role, agent_type: agentType };

            const res = await api.post(route, payload)

            //TODO: what happens after registration?
            console.log(res.data)
            alert("User registered successfully!")
            navigate("/admin-dashboard") // redirect to admin dashboard after registration

            
        } catch (error){
            alert(error)
        } finally {
            setLoading(false)
        }
    }
    return <form onSubmit={handleSubmit} className="form-container">
        <h1>Registration</h1>
        
        <select placeholder="registration type" onChange={(e) => setRole(e.target.value)} className="form-input">
            <option value="" disabled selected >
                -- Please select an option --
            </option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
        </select>
    
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

        {role === "admin" && (
        <>
            
            <input
            className="form-input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
            />
            <input
            className="form-input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            required
            />

            <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            required
            />
        </>
        )}

        {role === "agent" && (
        <>
            <input
            className="form-input"
            type="text"
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
            placeholder="Agent Type"
            required
            />      
        </>
        )}

        <button className="form-button" type="submit">
            Register {role}
        </button>
    </form>
}

export default RegistrationForm*/