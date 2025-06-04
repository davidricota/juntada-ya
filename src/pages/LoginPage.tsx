import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedPhone = phone.replace(/\D/g, "");

      if (formattedPhone.length < 10) {
        throw new Error("Please enter a valid phone number");
      }

      login(formattedPhone);
      toast.success("Logged in successfully");
      navigate("/my-events");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login with WhatsApp</CardTitle>
          <CardDescription>Enter your WhatsApp number to access your events</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <Input type="tel" placeholder="WhatsApp Number (e.g., 1234567890)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
