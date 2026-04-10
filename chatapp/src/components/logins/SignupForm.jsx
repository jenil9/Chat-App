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
        credentials: "include",
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
    <div className="flex items-center justify-center min-h-screen bg-[#0d1117] p-4 relative overflow-hidden">

      {isServerError ? (
        <div className="relative z-10 text-center bg-[#161b22] border border-white/[0.08] rounded-xl p-8 max-w-sm animate-scale-in">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Server Unreachable
          </h2>
          <p className="text-slate-400 text-sm mt-2 mb-6">Please reload or try again later.</p>
          <button 
            onClick={() => { window.location.reload() }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors duration-150"
          >
            Reload Page
          </button>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-sm bg-[#161b22] border border-white/[0.08] rounded-xl p-8 animate-scale-in">
          <h2 className="text-2xl font-bold mb-8 text-center tracking-tight text-blue-400">Sign Up</h2>

          {errors.network && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{errors.network.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="text-[12px] text-slate-500 uppercase tracking-wider mb-1.5 block">Username</label>
              <input
                type="text"
                placeholder="your_username"
                {...register("username", { required: "Username is required" })}
                className="w-full bg-[#1c2128] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors duration-150"
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-2">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-[12px] text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                })}
                className="w-full bg-[#1c2128] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors duration-150"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" }
                })}
                className="w-full bg-[#1c2128] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors duration-150"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[12px] text-slate-500 uppercase tracking-wider mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword", {
                  validate: (value) =>
                    value === password || "Passwords do not match"
                })}
                className="w-full bg-[#1c2128] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors duration-150"
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150"
            >
              Sign Up
            </button>
          </form>

          <p className="text-slate-400 text-sm mt-6 text-center">
            Already have an account?{" "}
            <NavLink to='/login' className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-150">
              Log In
            </NavLink>
          </p>
        </div>
      )}
    </div>
  );
}
