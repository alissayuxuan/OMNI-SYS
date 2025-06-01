import React from 'react';
import { useNavigate } from "react-router-dom"


function AdminDashboard () {

    const navigate = useNavigate()

    const gotoRegister = () => {
        navigate("/register");
    }   

    return (
        <div>
            <button onClick={gotoRegister}>Register User</button>
            <button onClick={() => navigate("/logout")}>Logout</button>
        </div>

)}

export default AdminDashboard