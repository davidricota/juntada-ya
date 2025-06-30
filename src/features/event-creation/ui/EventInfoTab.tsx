import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { MapPin, Calendar, Clock, Edit2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DatePicker } from "@/shared/ui/date-picker";
import { toast } from "@/shared/hooks/use-toast";
import { supabase } from "@/shared/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

interface EventInfoTabProps {
  planId: string;
  isHost: boolean;
  initialData?: {
    address: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
  };
}

const fetchEventInfo = async (
  planId: string
): Promise<{
  address: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
} | null> => {
  const { data, error } = await supabase
    .from("events")
    .select("address, date, time, latitude, longitude")
    .eq("id", planId)
    .single();

  if (error) throw error instanceof Error ? error : new Error(String(error));
  if (!data) return null;
  return data as {
    address: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
  };
};

export default function EventInfoTab({ planId, isHost, initialData }: EventInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const queryClient = useQueryClient();

  const { data: eventInfo } = useQuery({
    queryKey: ["eventInfo", planId],
    queryFn: () => fetchEventInfo(planId),
    initialData,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });

  // Función para convertir string a Date
  const stringToDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    try {
      return parseISO(dateString);
    } catch {
      return undefined;
    }
  };

  // Actualizar estados cuando cambia eventInfo
  useEffect(() => {
    console.log("eventInfo:", eventInfo);
    if (eventInfo) {
      setAddress(
        typeof eventInfo.address === "string" && eventInfo.address.length > 0
          ? eventInfo.address
          : ""
      );
      setDate(
        typeof eventInfo.date === "string" && eventInfo.date.length > 0
          ? stringToDate(eventInfo.date)
          : undefined
      );
      setTime(
        typeof eventInfo.time === "string" && eventInfo.time.length > 0 ? eventInfo.time : ""
      );
      setCoordinates({
        lat: typeof eventInfo.latitude === "number" ? eventInfo.latitude : 0,
        lng: typeof eventInfo.longitude === "number" ? eventInfo.longitude : 0,
      });
    }
  }, [eventInfo]);

  const handleSave = async () => {
    console.log({ address, date, time, coordinates });
    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({
          address,
          date: date ? format(date, "yyyy-MM-dd") : null,
          time,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        })
        .eq("id", planId);

      if (updateError) throw updateError;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["eventInfo", planId] });

      setIsEditing(false);
      toast({
        title: "Información actualizada",
        description: "Los datos del evento se han actualizado correctamente.",
      });
    } catch {
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
      const data = (await response.json()) as unknown;
      const results =
        data &&
        "results" in (data as Record<string, unknown>) &&
        Array.isArray((data as Record<string, unknown>).results)
          ? (data as { results: unknown[] }).results
          : [];
      if (results.length > 0) {
        const first = results[0];
        if (
          first &&
          typeof first === "object" &&
          "geometry" in first &&
          first.geometry &&
          typeof (first as Record<string, unknown>)["geometry"] === "object"
        ) {
          const geometry = (first as Record<string, unknown>)["geometry"];
          if (
            geometry &&
            typeof geometry === "object" &&
            "location" in geometry &&
            (geometry as Record<string, unknown>)["location"] &&
            typeof (geometry as Record<string, unknown>)["location"] === "object"
          ) {
            const location = (geometry as Record<string, unknown>)["location"];
            if (
              location &&
              typeof location === "object" &&
              "lat" in location &&
              typeof (location as Record<string, unknown>)["lat"] === "number" &&
              "lng" in location &&
              typeof (location as Record<string, unknown>)["lng"] === "number"
            ) {
              setCoordinates({
                lat: (location as Record<string, number>)["lat"],
                lng: (location as Record<string, number>)["lng"],
              });
            }
          }
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo obtener la ubicación del mapa.",
        variant: "destructive",
      });
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    console.log("setDate:", newDate);
    setDate(newDate);
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
                  <Button
                    onClick={() => {
                      void handleAddressSearch();
                    }}
                  >
                    Buscar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="date">Fecha</Label>
                    <DatePicker
                      id="date"
                      label="Fecha"
                      date={date}
                      onDateChange={handleDateChange}
                      placeholder="Seleccionar fecha"
                      className="w-full bg-primary-foreground border border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="time">Hora</Label>

                    <Input
                      id="time"
                      type="time"
                      value={time}
                      className="bg-primary-foreground border border-primary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  void handleSave();
                }}
              >
                Guardar Cambios
              </Button>

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
                    <p className="text-muted-foreground">
                      {date ? format(date, "PPP") : "No especificada"}
                    </p>
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
