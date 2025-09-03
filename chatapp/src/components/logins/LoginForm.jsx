import React,{useState} from 'react'
import { useForm } from 'react-hook-form';
import { NavLink, useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate=useNavigate();
  const { register,
    handleSubmit,
    watch,
    setError,  
    formState: { errors }} = useForm();
  const [isServerError,setisServerError]=useState(false);

  const onSubmit = async (data) => {
    // console.log("Login Data:", data);
    try{
      const res = await fetch(`http://localhost:3000/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include", // 👈 important for cookies in fetch
    });
   
    if (!res.ok) {
      
        if (res.status === 401 ) {
          
          setError("password", {
            type: "manual",
            message: "Invalid Credentials",
          });
         
        } 
        else{setisServerError(true)}
        return;
      }
      navigate('/')
      setisServerError(false);
  }
    catch(err)
    {
          setError("network", {
            type: "manual",
            message: "Something Went Wrong",
          });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
     {isServerError?(<div className="text-center">
          <img
            src="/assets/serverdown.webp" // replace with your image path
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
        </div>):(

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 bg-gray-800 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Login</h2>
       {errors.network && (
             <p className="text-red-400 text-sm m-1">{errors.network.message}</p>
           )}
        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" },
          })}
          className="block mb-3 p-3 w-full rounded-lg bg-gray-700 text-white focus:outline-none"
        />
        {errors.email && <p className="text-red-500 text-sm mb-3">{errors.email.message}</p>}

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Minimum 6 characters" },
          })}
          className="block mb-3 p-3 w-full rounded-lg bg-gray-700 text-white focus:outline-none"
        />
        {errors.password && <p className="text-red-500 text-sm mb-3">{errors.password.message}</p>}
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-4 text-lg font-semibold"
        >
          Login
        </button>

        <p className="text-gray-400 mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <NavLink to="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </NavLink>
        </p>
      </form>)
}
    </div>
  )
}

export default LoginForm;
