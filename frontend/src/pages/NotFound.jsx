import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft, FiStar } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate random stars
    const generatedStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      size: Math.random() * 3 + 1,
    }));
    setStars(generatedStars);

    // Track mouse position
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-900 to-black">
      {/* Stars Background */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle ${3 + Math.random() * 2}s infinite alternate`,
            animationDelay: star.animationDelay,
          }}
        />
      ))}

      {/* Planets */}
      <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl opacity-80 animate-pulse"></div>
      <div className="absolute bottom-32 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-2xl opacity-80 animate-pulse"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 text-center">
        {/* Astronaut */}
        <div
          className="relative mb-8 w-64 h-64"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-2xl animate-bounce"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-400"></div>
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-80"></div>
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-300 to-blue-500"></div>
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-400"></div>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-blue-100"></div>

          {/* Astronaut reflection */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-40 blur-md"></div>

          {/* Floating particles around astronaut */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping"></div>
          <div
            className="absolute top-3/4 right-1/4 w-2 h-2 bg-white rounded-full animate-ping"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white rounded-full animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* 404 Text */}
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 animate-pulse">
          404
        </h1>

        <h2 className="text-4xl font-bold text-white mb-4">Lost in Space</h2>

        <p className="text-xl text-gray-300 mb-8 max-w-md">
          The page you're looking for has drifted into the cosmic void. Let's
          get you back to civilization.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="group relative px-6 py-3 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <span className="relative z-10 flex items-center">
              <FiHome className="mr-2" />
              Return to Earth
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group relative px-6 py-3 overflow-hidden rounded-full bg-transparent border-2 border-white text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <span className="relative z-10 flex items-center">
              <FiArrowLeft className="mr-2" />
              Navigate Back
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Floating Stars Icon */}
        <div
          className="absolute top-10 left-10 text-yellow-400 animate-spin"
          style={{ animationDuration: "10s" }}
        >
          <FiStar size={32} />
        </div>
        <div
          className="absolute bottom-10 right-10 text-yellow-400 animate-spin"
          style={{ animationDuration: "15s" }}
        >
          <FiStar size={24} />
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes twinkle {
          0% {
            opacity: 0.2;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
