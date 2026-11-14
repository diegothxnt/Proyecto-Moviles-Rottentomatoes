#  CineApp - Explorador de Películas y Series

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

CineApp es una aplicación móvil diseñada para descubrir contenido cinematográfico y televisivo, fomentando la interacción de la comunidad a través de reseñas y valoraciones. Inspirada en plataformas de crítica, CineApp democratiza la opinión equilibrando la perspectiva de expertos con la del público general.

La arquitectura de la aplicación integra la API de OMDb con un sistema de caché local para optimizar los tiempos de respuesta. Además, incluye un sistema completo de autenticación que permite a los usuarios interactuar dinámicamente mediante reseñas, debates y valoraciones.

##  Características Principales

- **Exploración Avanzada:** Búsqueda optimizada de películas y series con filtros por año, género y calificación.
- **Filtro Estricto de Lanzamiento:** Precisión absoluta en la búsqueda por año, evitando discrepancias en las fechas de estreno.
- **Sistema de Reseñas:** Los usuarios pueden calificar (0-10), publicar, editar y eliminar sus críticas.
- **Hilos de Discusión Anidados:** Soporte para respuestas colapsables, optimizando la ergonomía visual y evitando el desplazamiento infinito.
- **Interacciones en Tiempo Real:** Sistema de "Me gusta" con actualización instantánea en la interfaz sin necesidad de recargar.
- **Gestión de Perfiles:** Visualización de biografías y listas personalizadas (favoritos y descartes) de otros usuarios de la comunidad.
- **Persistencia de Historial:** Almacenamiento local de búsquedas recientes para mejorar la experiencia de usuario (UX).

##  Stack Tecnológico

### Frontend (Móvil)
- **Frameworks:** Angular e Ionic.
- **Despliegue Nativo:** Capacitor (para compilación en Android).
- **Estilos:** SCSS con implementación nativa de "Dark Mode" para reducir la fatiga visual.

### Backend
- **Entorno de Ejecución:** Node.js con Express.
- **Base de Datos:** MongoDB (ODM: Mongoose).
- **Autenticación:** JSON Web Tokens (JWT) y manejo de Refresh Tokens.
- **Integración Externa:** OMDb API.
- **Seguridad:** Implementación de Helmet, CORS, Rate Limiting y sanitización estricta de datos.

##  Estructura del Proyecto

```text
/
├── backend/          # API REST (Node.js + MongoDB)
│   ├── src/
│   │   ├── config/       # Configuración de base de datos y entorno
│   │   ├── controllers/  # Controladores (auth, movies, reviews)
│   │   ├── middlewares/  # Autenticación, validación y manejo de errores
│   │   ├── models/       # Esquemas de Mongoose (User, Movie, Review)
│   │   ├── routes/       # Definición de endpoints
│   │   └── services/     # Lógica de negocio (OMDb, JWT)
│   └── server.js         # Punto de entrada del servidor
│
└── frontend/         # Aplicación Móvil (Angular + Ionic)
    ├── src/
    │   ├── app/
    │   │   ├── core/     # Servicios, guards, interceptores y modelos
    │   │   ├── pages/    # Vistas principales (movies, tv, search, detail, profile)
    │   │   └── shared/   # Componentes UI reutilizables
    │   └── environments/ # Variables de entorno (Desarrollo / Producción)
    └── android/          # Proyecto nativo generado mediante Capacitor
```
### 1. Compilar la versión web de producción
ionic build

### 2. Sincronizar los archivos con el proyecto de Android
npx cap sync android

### 3. Abrir Android Studio
npx cap open android

### Elaborado por: Diego Rojas y Samer Ghattas. 
