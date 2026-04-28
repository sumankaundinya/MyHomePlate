import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

// Fix Leaflet default icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom orange chef icon
const chefIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Blue user location icon
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Auto-center map when userPosition changes
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 14);
  }, [position, map]);
  return null;
}

export interface ChefMapPin {
  id: string;
  name: string;
  bio: string | null;
  avg_rating: number | null;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface ChefsMapProps {
  chefs: ChefMapPin[];
  userPosition: [number, number] | null;
  radiusKm?: number;
}

export function ChefsMap({ chefs, userPosition, radiusKm = 2 }: ChefsMapProps) {
  const navigate = useNavigate();

  // Default center: Nizampet, Hyderabad
  const defaultCenter: [number, number] = [17.5081, 78.3887];
  const center = userPosition ?? defaultCenter;

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        {/* OpenStreetMap tiles — free, no API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter when user GPS changes */}
        {userPosition && <RecenterMap position={userPosition} />}

        {/* User location marker + radius circle */}
        {userPosition && (
          <>
            <Marker position={userPosition} icon={userIcon}>
              <Popup>
                <div className="text-sm font-semibold text-blue-700">📍 Your Location</div>
              </Popup>
            </Marker>
            <Circle
              center={userPosition}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#f97316", fillColor: "#fed7aa", fillOpacity: 0.15, weight: 2 }}
            />
          </>
        )}

        {/* Chef pins */}
        {chefs.map((chef) => (
          <Marker
            key={chef.id}
            position={[chef.latitude, chef.longitude]}
            icon={chefIcon}
          >
            <Popup minWidth={180}>
              <div className="space-y-1.5">
                <p className="font-semibold text-sm text-gray-800">👨‍🍳 {chef.name}</p>
                {chef.bio && (
                  <p className="text-xs text-gray-500 line-clamp-2">{chef.bio}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {chef.avg_rating !== null && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {chef.avg_rating.toFixed(1)}
                    </span>
                  )}
                  {chef.distance !== undefined && (
                    <span>📍 {chef.distance.toFixed(1)} km away</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs mt-1"
                  onClick={() => navigate(`/chefs/${chef.id}`)}
                >
                  View Chef
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
