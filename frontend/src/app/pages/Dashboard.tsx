import { Card } from "../components/ui/card";
import { Activity, Heart, Moon, Footprints, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const heartRateData = [
  { time: "Mon", bpm: 72 },
  { time: "Tue", bpm: 68 },
  { time: "Wed", bpm: 75 },
  { time: "Thu", bpm: 70 },
  { time: "Fri", bpm: 73 },
  { time: "Sat", bpm: 69 },
  { time: "Sun", bpm: 71 },
];

const sleepData = [
  { day: "Mon", hours: 7.5 },
  { day: "Tue", hours: 6.5 },
  { day: "Wed", hours: 8 },
  { day: "Thu", hours: 7 },
  { day: "Fri", hours: 6 },
  { day: "Sat", hours: 9 },
  { day: "Sun", hours: 8.5 },
];

const activityData = [
  { name: "Walking", value: 45 },
  { name: "Running", value: 20 },
  { name: "Cycling", value: 15 },
  { name: "Other", value: 20 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export function Dashboard() {
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-green-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Health Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your health metrics and progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">71 bpm</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">-3% from last week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Steps Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">8,547</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+12% from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Footprints className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sleep</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">7.5 hrs</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+5% from average</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Moon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Minutes</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">145 min</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+8% from last week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Heart Rate Chart */}
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Heart Rate Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={heartRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Sleep Chart */}
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sleep Duration
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity Breakdown */}
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Activity Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Health History */}
          <Card className="p-6 bg-white shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Health Events
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Annual Checkup</p>
                  <p className="text-sm text-gray-600">All vitals normal</p>
                  <p className="text-xs text-gray-400 mt-1">March 10, 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Flu Vaccination</p>
                  <p className="text-sm text-gray-600">Completed successfully</p>
                  <p className="text-xs text-gray-400 mt-1">February 15, 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Blood Test</p>
                  <p className="text-sm text-gray-600">Results within normal range</p>
                  <p className="text-xs text-gray-400 mt-1">January 20, 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Dental Cleaning</p>
                  <p className="text-sm text-gray-600">No cavities detected</p>
                  <p className="text-xs text-gray-400 mt-1">December 5, 2025</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
