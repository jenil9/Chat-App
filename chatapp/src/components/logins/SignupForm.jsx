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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000 pointer-events-none"></div>

      {isServerError ? (
        <div className="relative z-10 text-center backdrop-blur-2xl bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 max-w-md animate-scale-in">
          <div className="w-24 h-24 backdrop-blur-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Server Unreachable
          </h2>
          <p className="text-slate-400 mt-2 mb-6">Please reload or try again later.</p>
          <button 
            onClick={() => { window.location.reload() }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
          >
            Reload Page
          </button>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-scale-in">
          <h2 className="text-4xl font-bold mb-8 text-center tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Sign Up</h2>

          {errors.network && (
            <div className="mb-4 p-3 backdrop-blur-lg bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-red-300 text-sm font-medium">{errors.network.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                placeholder="your_username"
                {...register("username", { required: "Username is required" })}
                className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-2">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                })}
                className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" }
                })}
                className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword", {
                  validate: (value) =>
                    value === password || "Passwords do not match"
                })}
                className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Sign Up
            </button>
          </form>

          <p className="text-slate-400 text-sm mt-6 text-center">
            Already have an account?{" "}
            <NavLink to='/login' className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Log In
            </NavLink>
          </p>
        </div>
      )}
    </div>
  );
}
