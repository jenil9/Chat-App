import React, { useState } from "react";
import { useForm } from "react-hook-form";
import{NavLink,useNavigate} from 'react-router-dom'

export default function SignupForm({ onSignup }) {
  const {
    register,
    handleSubmit,
    watch,
    setError,  
    formState: { errors }
  } = useForm();
  const [isServerError,setisServerError]=useState(false)
  const navigate=useNavigate();

  const onSubmit = async(data) => {
    setisServerError(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_AUTH_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 400 ) {
          setError("email", {
            type: "manual",
            message: result.message,
          });
        } 
        else{setisServerError(true)}
        return;
      }
      navigate('/login')
      setisServerError(false);
      
    } catch (err) {
      console.error(err);
     
             setError("network", {
            type: "manual",
            message: "Something Went Wrong",
          });
    }
  };

  const password = watch("password");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {
        isServerError ? (
        <div className="text-center">
          <img
            src="/src/assets/serverdown.webp"
            alt="Server down"
            className="mx-auto mb-4 w-32"
          />
          <h2 className="text-2xl text-white font-bold">
            Server Unreachable
          </h2>
          <p className="text-gray-400 mt-2">Please Reload or try again later.</p>
          <h3 onClick={()=>{window.location.reload()}} className="text-blue-400 hover:underline">
           Reload
          </h3>
        </div>
      ) : (
        <div className="bg-gray-800 text-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>

        {errors.network && (
             <p className="text-red-400 text-sm m-1">{errors.network.message}</p>
           )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="User Name"
              {...register("username", { required: "User Name is required" })}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
              })}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" }
              })}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword", {
                validate: (value) =>
                  value === password || "Passwords do not match"
              })}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Already have an account?{" "}
          <NavLink to='/login' className="text-blue-400 hover:underline">
            Log In
          </NavLink>
        </p>
      </div>)
}
    </div>
  );
}
