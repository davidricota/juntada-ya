
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import { CheckSquare, Users, ListMusic, DollarSign, MessageSquare, Image, MapPin, UserPlus } from 'lucide-react';

const features = [
  {
    icon: CheckSquare,
    title: "Encuestas Dinámicas",
    description: "¿Qué comemos? ¿Qué día nos juntamos? Decide en grupo con encuestas simples, múltiples o de fechas."
  },
  {
    icon: DollarSign,
    title: "Gastos Compartidos Claros",
    description: "Registra quién pagó qué, divide equitativamente y olvídate de las deudas pendientes."
  },
  {
    icon: ListMusic,
    title: "Playlists Colaborativas",
    description: "Integra Spotify o YouTube. Todos suman canciones, votan y disfrutan la música del evento."
  },
  {
    icon: Users,
    title: "Checklist de Tareas",
    description: "Organiza quién trae qué. Asigna tareas y sigue el progreso para que nada falte."
  },
  {
    icon: MessageSquare,
    title: "Chat Integrado",
    description: "Comunícate sobre el evento, comparte ideas y mantén a todos al tanto en un solo lugar."
  },
  {
    icon: Image,
    title: "Álbum de Recuerdos",
    description: "Sube y comparte las fotos del evento. Etiqueta, descarga y revive los mejores momentos."
  },
  {
    icon: MapPin,
    title: "Ubicación y Hora",
    description: "Define el lugar y la hora fácilmente. Comparte la dirección y agrega al calendario."
  },
  {
    icon: UserPlus,
    title: "Invitaciones Simplificadas",
    description: "Envía invitaciones, gestiona confirmaciones de asistencia y ten una lista clara de participantes."
  }
];

const Index = () => {
  return (
    <>
      <HeroSection />
      <section id="features" className="py-16 md:py-24 bg-spotify-dark">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-spotify-text">Todo lo que necesitas para tu evento</h2>
          <p className="text-lg text-spotify-text-muted mt-2">Funcionalidades pensadas para una organización sin estrés.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <FeatureCard 
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
      <section className="py-16 text-center">
        <h3 className="text-2xl font-semibold mb-4 text-spotify-text">¿Listo para dar el siguiente paso?</h3>
        <p className="text-spotify-text-muted mb-6 max-w-lg mx-auto">
          Para habilitar la creación de eventos, colaboración en tiempo real y almacenamiento de datos,
          necesitaremos integrar Supabase. ¡Es el motor que potenciará tu app!
        </p>
        <a 
            href="https://supabase.com/docs/guides/getting-started/quickstarts/react" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-spotify-green text-spotify-dark font-semibold px-6 py-3 rounded-full hover:bg-opacity-80 transition-opacity text-lg"
        >
            Aprende más sobre Supabase
        </a>
      </section>
    </>
  );
};

export default Index;
