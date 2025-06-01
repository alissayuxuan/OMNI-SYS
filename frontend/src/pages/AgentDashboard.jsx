import React from 'react';
import { useNavigate } from "react-router-dom"

function AgentDashboard () {
    const navigate = useNavigate()
    

    return (
        <div>
            <button onClick={() => navigate("/logout")}>Logout</button>
        </div>
    )
}

export default AgentDashboard