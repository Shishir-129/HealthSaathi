import { Outlet, NavLink } from "react-router";
import { MessageSquare, MapPin, Activity } from "lucide-react";

export function Layout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo & Brand */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800">HealthAI</h1>
              <p className="text-xs text-gray-500">Your Health Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Chat</span>
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Map</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">John Doe</p>
              <p className="text-xs text-gray-500">john.doe@email.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
