import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { setAuth, setUser } from "../store/userSlice";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();

  const [auths,setauths]=useState(null);
  useEffect(() => {
   
   if(auths==true){return;}
    const verify = async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/api/auth/verifyToken",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // cookie sent automatically
          }
        );

        if (!res.ok) {
          
          dispatch(setAuth(false));
          dispatch(setUser({}));
          setauths(false);
        } else {
          const data = await res.json();
          
          dispatch(setAuth(true));
          dispatch(setUser(data));
          setauths(true);
        }
      } catch (err) {
       
        dispatch(setAuth(false));
        dispatch(setUser({}));
        setauths(false);
      }
    };

    verify();

    
  }, [dispatch]);

  // Fallback UI while verification is in progress
  if (auths === null)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Checking authentication...
      </div>
    );

  // Redirect if not authenticated
  if (auths === false) return <Navigate to="/login" replace />;

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
