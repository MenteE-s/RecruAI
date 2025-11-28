import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
              <span className="text-6xl font-bold text-red-600">404</span>
            </div>

            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              Page Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Sorry, we couldn't find the page you're looking for.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                to="/"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiHome className="mr-2" />
                Go to Homepage
              </Link>

              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiArrowLeft className="mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
