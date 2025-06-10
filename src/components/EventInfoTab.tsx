import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin, Calendar, Clock, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EventInfoTabProps {
  eventId: string;
  isHost: boolean;
  initialData?: {
    address: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
  };
}

const fetchEventInfo = async (eventId: string) => {
  const { data, error } = await supabase
    .from("events")
    .select("address, date, time, latitude, longitude")
    .eq("id", eventId)
    .single();

  if (error) throw error;
  return data;
};

export default function EventInfoTab({ eventId, isHost, initialData }: EventInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const queryClient = useQueryClient();

  const { data: eventInfo, isLoading } = useQuery({
    queryKey: ["eventInfo", eventId],
    queryFn: () => fetchEventInfo(eventId),
    initialData,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });

  // Actualizar estados cuando cambia eventInfo
  useEffect(() => {
    if (eventInfo) {
      setAddress(eventInfo.address || "");
      setDate(eventInfo.date || "");
      setTime(eventInfo.time || "");
      setCoordinates({
        lat: eventInfo.latitude || 0,
        lng: eventInfo.longitude || 0,
      });
    }
  }, [eventInfo]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("events")
        .update({
          address,
          date,
          time,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        })
        .eq("id", eventId);

      if (error) throw error;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["eventInfo", eventId] });

      setIsEditing(false);
      toast({
        title: "Información actualizada",
        description: "Los datos del evento se han actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del evento.",
        variant: "destructive",
      });
    }
  };

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
      toast({
        title: "Error",
        description: "No se pudo obtener la ubicación del mapa.",
        variant: "destructive",
      });
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
                    className="bg-primary-foreground border border-primary"
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
                    className="bg-primary-foreground border border-primary"
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    className="bg-primary-foreground border border-primary"
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>Guardar Cambios</Button>

              {coordinates.lat !== 0 && coordinates.lng !== 0 && (
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Dirección</h3>
                  <p className="text-muted-foreground">{address || "No especificada"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Fecha</h3>
                    <p className="text-muted-foreground">{date || "No especificada"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Hora</h3>
                    <p className="text-muted-foreground">{time || "No especificada"}</p>
                  </div>
                </div>
              </div>

              {coordinates.lat !== 0 && coordinates.lng !== 0 && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-primary-foreground"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Ocultar Mapa" : "Ver Mapa"}
                  </Button>
                  {showMap && (
                    <div className="h-[300px] rounded-lg overflow-hidden">
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
