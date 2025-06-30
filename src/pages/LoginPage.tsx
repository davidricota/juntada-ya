import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthContext";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import PhoneInput from "react-phone-input-2";
import { UserService } from "@/shared/api/userService";
import { encrypt } from "@/shared/lib/encryption";
import { useMutation } from "@tanstack/react-query";
import { useParticipantStore } from "@/shared/stores/participantStore";

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { setParticipant } = useParticipantStore();

  const loginMutation = useMutation({
    mutationFn: async (formattedPhone: string) => {
      // Intentar obtener usuario existente
      const user = await UserService.getUserByWhatsApp(formattedPhone);
      if (user && user.name && user.name.trim() !== "") {
        // Si ya existe y tiene nombre, guardar ese nombre
        setParticipant(user.name, formattedPhone);
        return user;
      }
      // Si no existe, pedir el nombre al usuario (flujo futuro: pedir en UI)
      // Por ahora, crear usuario sin nombre
      const newUser = await UserService.getOrCreateUser(formattedPhone, "");
      setParticipant("", formattedPhone);
      return newUser;
    },
    onSuccess: (user, formattedPhone) => {
      // Guardar user_data en localStorage
      const userStorage = { id: user.id, whatsapp: formattedPhone };
      localStorage.setItem("user_data", encrypt(JSON.stringify(userStorage)));

      login(formattedPhone);
      toast.success("Inicio de sesión exitoso");
      navigate("/my-plans");
    },
    onError: () => {
      toast.error("Error al iniciar sesión. Por favor intenta de nuevo.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Formatear número de teléfono (eliminar espacios, guiones, etc.)
    const formattedPhone = phone.replace(/\D/g, "");

    if (!formattedPhone || formattedPhone.length < 10) {
      toast.error("Por favor ingresa un número de teléfono válido");
      return;
    }

    loginMutation.mutate(formattedPhone);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión con WhatsApp</CardTitle>
          <CardDescription>
            Ingresa tu número de WhatsApp para acceder a tus plancitos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <PhoneInput
                country="ar"
                value={phone ?? ""}
                onChange={setPhone}
                inputProps={{
                  className: cn(
                    "flex h-10 w-full rounded-md border border-input bg-foreground pl-14 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground !text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  ),
                }}
                buttonClass="border-input bg-background hover:bg-accent hover:text-accent-foreground"
                dropdownClass="bg-foreground border-input"
                searchClass="bg-background border-input text-foreground"
                containerClass="w-full"
                inputStyle={{
                  width: "100%",
                  color: "hsl(var(--foreground))",
                }}
                buttonStyle={{
                  backgroundColor: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--input))",
                }}
                dropdownStyle={{
                  backgroundColor: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--input))",
                }}
                searchStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--input))",
                  color: "hsl(var(--foreground))",
                }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
