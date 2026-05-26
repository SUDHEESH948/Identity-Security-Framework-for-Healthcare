import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Admin(){

  const navigate = useNavigate();

  const [adminId,setAdminId] = useState("");
  const [password,setPassword] = useState("");

  const [adminError,setAdminError] = useState("");
  const [passError,setPassError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;

    if(!adminId){
      setAdminError("Admin ID is required");
      valid = false;
    }else{
      setAdminError("");
    }

    if(!password){
      setPassError("Password is required");
      valid = false;
    }else{
      setPassError("");
    }

    if(!valid) return;

    try{

      const res = await fetch("http://localhost:5000/api/admin/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          adminId:adminId,
          password:password
        })
      });

      const data = await res.json();

      if(data.success){

        

        // save login token (optional security)
        if(data.token){
          localStorage.setItem("adminToken", data.token);
        }

        // redirect to dashboard
        navigate("/admin-dashboard");

      }else{
        alert(data.message);
      }

    }catch(err){
      console.error(err);
      alert("Server connection error");
    }

  };

  return(

    <div className="main">

      <div className="login-card">

        <h2>⚙️ Admin Login</h2>

        <form onSubmit={handleSubmit}>

          <div className="input-box">
            <span className="icon">🪪</span>

            <input
              type="text"
              placeholder="Admin ID"
              value={adminId}
              onChange={(e)=>setAdminId(e.target.value)}
            />

            {adminError && <p className="error">{adminError}</p>}
          </div>

          <div className="input-box password-box">

            <span className="icon">🔒</span>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />

            {passError && <p className="error">{passError}</p>}

          </div>

          <button className="login-btn">Login</button>

        </form>

      </div>

    </div>

  );

}

export default Admin;