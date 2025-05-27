# juntadaYa! 🎵

Plataforma web para crear playlists colaborativas en tiempo real para eventos y juntadas. Permite a los participantes agregar canciones de YouTube, votar por ellas y disfrutar de una experiencia musical compartida.

**URL**: https://juntadaya.netlify.app/

## 🚀 Stack Tecnológico

### Frontend
- **Framework Principal**: React 18 con TypeScript
- **Bundler**: Vite - Para un desarrollo rápido y optimizado
- **Estilos**:
  - Tailwind CSS - Framework de utilidades CSS
  - shadcn/ui - Componentes de UI reutilizables y accesibles
  - Lucide Icons - Iconografía moderna y consistente

### Backend & Base de Datos
- **Supabase**:
  - PostgreSQL - Base de datos relacional
  - Realtime - Suscripciones en tiempo real para actualizaciones instantáneas
  - Edge Functions - Funciones serverless para la API de YouTube
  - Row Level Security (RLS) - Seguridad a nivel de fila para datos sensibles

### APIs & Integraciones
- **YouTube Data API v3**:
  - Búsqueda de videos
  - Embedding de reproductor
  - Manejo de playlists

### Características Técnicas Destacadas
- **Tiempo Real**:
  - Actualizaciones instantáneas de la playlist
  - Sincronización de estado entre usuarios
  - Manejo de eventos en tiempo real con Supabase Realtime

- **Seguridad**:
  - Autenticación y autorización con Supabase Auth
  - Protección de rutas y recursos
  - Validación de datos en cliente y servidor

- **UX/UI**:
  - Diseño responsive
  - Modo oscuro
  - Accesibilidad (WCAG)
  - Feedback visual inmediato
  - Transiciones y animaciones suaves

- **Performance**:
  - Code splitting
  - Lazy loading de componentes
  - Optimización de imágenes
  - Caching eficiente

## 🛠️ Desarrollo Local

```sh
# Clonar el repositorio
git clone https://github.com/davidricota/evento-vibes-social.git

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🔧 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
```

## 📦 Despliegue

El proyecto está configurado para despliegue automático en Netlify. Cada push a la rama `main` desencadena un nuevo despliegue.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📝 Licencia

MIT
