import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, MapPin, Calendar, Clock } from "lucide-react";
import { useEvent } from "@/hooks/useEvent";

interface EventInfoTabProps {
  eventId: string;
  isHost: boolean;
}

export default function EventInfoTab({ eventId, isHost }: EventInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  const { event, updateEvent } = useEvent(eventId);

  const handleAddressSearch = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setCoordinates({ lat, lng });
      }
    } catch (error) {
      console.error("Error searching address:", error);
    }
  };

  const handleSave = async () => {
    try {
      await updateEvent({
        address,
        date,
        time,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving event info:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Información del Evento</CardTitle>
          {isHost && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ingresa la dirección del evento"
                  />
                  <Button onClick={handleAddressSearch}>Buscar</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Dirección</h3>
                  <p className="text-muted-foreground">{event?.address || "No especificada"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Fecha</h3>
                    <p className="text-muted-foreground">{event?.date || "No especificada"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Hora</h3>
                    <p className="text-muted-foreground">{event?.time || "No especificada"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {coordinates.lat && coordinates.lng && (
            <div className="mt-4 h-[300px] rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=${
                  import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                }&q=${coordinates.lat},${coordinates.lng}`}
                allowFullScreen
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
