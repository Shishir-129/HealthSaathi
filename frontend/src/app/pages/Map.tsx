import { useState } from "react";
import { Search, MapPin, Phone, Clock, Star } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

interface HealthFacility {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  distance: string;
}

export function Map() {
  const [searchQuery, setSearchQuery] = useState("");
  const [facilities] = useState<HealthFacility[]>([
    {
      id: "1",
      name: "City General Hospital",
      type: "Hospital",
      address: "123 Main St, Downtown",
      phone: "(555) 123-4567",
      hours: "24/7",
      rating: 4.5,
      distance: "1.2 km",
    },
    {
      id: "2",
      name: "WellCare Clinic",
      type: "Clinic",
      address: "456 Oak Ave, Uptown",
      phone: "(555) 234-5678",
      hours: "8 AM - 8 PM",
      rating: 4.8,
      distance: "2.5 km",
    },
    {
      id: "3",
      name: "HealthPlus Pharmacy",
      type: "Pharmacy",
      address: "789 Elm St, Midtown",
      phone: "(555) 345-6789",
      hours: "9 AM - 9 PM",
      rating: 4.3,
      distance: "0.8 km",
    },
    {
      id: "4",
      name: "Emergency Care Center",
      type: "Emergency",
      address: "321 Pine Rd, Westside",
      phone: "(555) 456-7890",
      hours: "24/7",
      rating: 4.6,
      distance: "3.1 km",
    },
  ]);

  return (
    <div className="h-full flex">
      {/* Facilities List Sidebar */}
      <aside className="w-96 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Nearby Facilities
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals, clinics, pharmacies..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {facilities.map((facility) => (
            <Card key={facility.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {facility.name}
                  </h3>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                    {facility.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{facility.rating}</span>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{facility.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{facility.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{facility.hours}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm font-medium text-green-600">
                  {facility.distance} away
                </span>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-green-500">
                  Directions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </aside>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          {/* Map Placeholder */}
          <div className="w-full h-full relative overflow-hidden">
            {/* Grid Pattern to simulate map */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(200, 200, 200, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(200, 200, 200, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
            
            {/* Simulated Map Markers */}
            <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-2/3 left-2/3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>

            {/* Map Controls */}
            <div className="absolute top-6 right-6 bg-white rounded-lg shadow-lg p-2 space-y-2">
              <Button variant="outline" size="sm" className="w-full">+</Button>
              <Button variant="outline" size="sm" className="w-full">-</Button>
            </div>

            {/* Current Location Button */}
            <div className="absolute bottom-6 right-6">
              <Button className="bg-white text-gray-700 hover:bg-gray-100 shadow-lg">
                <MapPin className="w-4 h-4 mr-2" />
                My Location
              </Button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Legend</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Hospital</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Clinic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Pharmacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span>Emergency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
