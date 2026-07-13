# 🚚 Sobre Ruedas - Sistema de Gestión

Sistema de gestión de órdenes de servicio para mensajería y logística. Permite administrar clientes, crear órdenes de servicio, generar reportes en PDF y visualizar métricas en tiempo real.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📋 Tabla de Contenidos

- [🚚 Sobre Ruedas - Sistema de Gestión](#-sobre-ruedas---sistema-de-gestión)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [✨ Características](#-características)
    - [🔐 Autenticación](#-autenticación)
    - [👥 Gestión de Clientes](#-gestión-de-clientes)
    - [📋 Gestión de Órdenes](#-gestión-de-órdenes)
    - [📊 Dashboard](#-dashboard)
    - [📈 Métricas Avanzadas](#-métricas-avanzadas)
    - [📄 Exportar PDF](#-exportar-pdf)
    - [🎨 Diseño](#-diseño)
    - [🔔 Notificaciones](#-notificaciones)
    - [💾 Almacenamiento](#-almacenamiento)
  - [🛠️ Tecnologías](#️-tecnologías)
  

---

## ✨ Características

### 🔐 Autenticación
- Login seguro con Firebase Authentication
- Sesión persistente
- Cierre de sesión
- Modo oscuro/claro persistente

### 👥 Gestión de Clientes
- **CRUD completo**: Crear, leer, actualizar y eliminar clientes
- **Buscador**: Búsqueda por nombre, NIT, teléfono o email
- **Historial**: Ver todas las órdenes de un cliente específico
- **Estadísticas**: Total de órdenes, total gastado, completadas y pendientes
- **WhatsApp**: Envío de mensaje directo al cliente
- **Nueva orden**: Crear orden desde el historial

### 📋 Gestión de Órdenes
- **CRUD completo**: Crear, leer, actualizar y eliminar órdenes
- **Filtros**: Por estado y rango de fechas
- **Cambio de estado**: Pendiente → En Proceso → Completada → Cancelada
- **Número de orden**: Generación automática secuencial
- **Cálculo automático**: Valor - Abono = Total

### 📊 Dashboard
- **Métricas en tiempo real**: Clientes activos, órdenes hoy, ingresos totales, pendientes
- **Gráfico de barras**: Distribución de órdenes por estado
- **Últimas órdenes**: Vista rápida de las 5 órdenes más recientes

### 📈 Métricas Avanzadas
- Visualización detallada de estadísticas
- Distribución de órdenes
- Información adicional (total de órdenes, última actualización)

### 📄 Exportar PDF
- **Orden individual**: Exportar una orden específica
- **Todas las órdenes**: Reporte completo con todas las órdenes
- **Diseño profesional**: Marca de agua, firmas, términos y condiciones

### 🎨 Diseño
- **Modo oscuro/claro**: Persistente con localStorage
- **Responsive**: Adaptable a móviles, tablets y desktop
- **Interfaz moderna**: Con efecto glassmorphism
- **Notificaciones**: Alertas en tiempo real

### 🔔 Notificaciones
- Éxito, error, advertencia e información
- Animación de entrada y salida
- Auto-cierre después de 4 segundos

### 💾 Almacenamiento
- **Firestore**: Base de datos en la nube
- **Autenticación**: Firebase Auth
- **Seguridad**: Reglas de Firestore configuradas

---

## 🛠️ Tecnologías

| Tecnología | Descripción |
|------------|-------------|
| **HTML5** | Estructura de la aplicación |
| **CSS3** | Estilos y diseño responsivo |
| **JavaScript (ES6+)** | Lógica de la aplicación |
| **Firebase** | Backend como servicio (BaaS) |
| **Firestore** | Base de datos NoSQL en tiempo real |
| **Firebase Auth** | Autenticación de usuarios |
| **html2pdf.js** | Generación de PDFs |
| **Font Awesome** | Íconos y tipografía |
| **Netlify** | Hosting y despliegue |

