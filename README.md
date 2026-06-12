# 🎮 Steamcito App

Aplicación móvil con integración de chatbot inteligente y buscador de ofertas en vivo de la plataforma de videojuegos **Steam**.

El repositorio contiene dos aplicaciones independientes basadas en **React Native / Expo**:
1. **`chat_steam`**: Aplicación móvil completa utilizando **Expo Router** con navegación por pestañas, buscador de ofertas generales en tiempo real (CheapShark API), y una sala de chat con **Steamcito** que detecta y despliega dinámicamente tarjetas interactivas de ofertas.
2. **`steamcito`**: Aplicación simplificada y stand-alone enfocada únicamente en la interfaz de chat con el bot asistente.

---

## 🛠️ Arquitectura del Proyecto

El repositorio está estructurado de la siguiente forma:

* **[chat_steam/](chat_steam/)**: Cliente avanzado con Expo Router.
  * **[app/](chat_steam/app/)**: Enrutamiento de pestañas (`(tabs)/index.tsx`, `chat.tsx`, `deals.tsx`).
  * **[components/](chat_steam/components/)**: Componentes UI modulares e interactivos.
  * **[steamcito/](chat_steam/steamcito/)**: Módulo integrado del chatbot que maneja la conexión con el modelo de lenguaje de OpenRouter.
* **[steamcito/](steamcito/)**: Cliente básico stand-alone.
* **[requerimientos.txt](requerimientos.txt)**: Especificación de requerimientos y lógica de negocio del proyecto.

---

## 🔄 Flujo de Funcionamiento del Chatbot

El chat inteligente de Steamcito no es solo texto. Analiza las respuestas del modelo para complementarlas con datos de ofertas en tiempo real:

```mermaid
graph TD
    U["Usuario consulta por un videojuego"] -->|Envia mensaje| C("Pantalla de Chat")
    C -->|Consulta API con System Prompt| OR["OpenRouter API: GPT-4o-Mini"]
    OR -->| "Retorna texto formateado + tag [AppID: XXXXXX]" | C
    C -->| "Regex busca etiqueta [AppID]" | P{"¿Tiene [AppID]?"}
    P -->|Sí| CS["Consultar CheapShark API con AppID"]
    P -->|No| D["Mostrar burbuja de chat clásica"]
    CS -->|Obtiene mejor precio actual| T["Generar Tarjeta de Oferta en Vivo"]
    T -->|Carga imagen de cabecera de Steam| UI["Mostrar Burbuja + Banner de Oferta Interactivo"]
    UI -->| "Click en 'Ver en Steam'" | S["Abrir Tienda oficial de Steam en Navegador"]
```

---

## 🚀 Cómo Empezar / Instalación

Sigue estos pasos para levantar cualquiera de las dos aplicaciones en tu entorno de desarrollo.

### 📋 Prerrequisitos
* Tener instalado **Node.js** (LTS recomendado).
* Dispositivo físico con la aplicación **Expo Go** (iOS/Android) o emulador configurado.

---

### ⚙️ Configuración de Variables de Entorno

Ambas aplicaciones requieren una API Key de **OpenRouter** para conectar con el modelo de inteligencia artificial.

1. Regístrate y obtén una key en [OpenRouter.ai](https://openrouter.ai/).
2. Copia los archivos `.env.example` y renombralos como `.env`:

   * **Para `chat_steam`**:
     Crea `chat_steam/.env` basándote en [chat_steam/.env.example](chat_steam/.env.example):
     ```env
     EXPO_PUBLIC_OPENROUTER_API_KEY=tu_api_key_aqui
     ```
   * **Para `steamcito`**:
     Crea `steamcito/.env` basándote en [steamcito/.env.example](steamcito/.env.example):
     ```env
     OPENROUTER_API_KEY=tu_api_key_aqui
     ```

*Nota: Los archivos `.env` reales están protegidos e incluidos en el `.gitignore` para prevenir fugas accidentales de credenciales.*

---

### 📱 Ejecución del Cliente Avanzado (`chat_steam`)

Este proyecto incluye navegación interactiva con pestañas de Ofertas (Deals), Chat y Home:

1. Dirígete a la carpeta del proyecto:
   ```bash
   cd chat_steam
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Expo:
   ```bash
   npx expo start
   ```
4. Escanea el código QR desde tu app de **Expo Go** o presiona `a` (Android), `i` (iOS) o `w` (Web) para ejecutar en simuladores.

---

### 🤖 Ejecución del Cliente Stand-alone (`steamcito`)

Si prefieres probar la versión simplificada y enfocada puramente en la sala de chat:

1. Dirígete a la carpeta del proyecto:
   ```bash
   cd steamcito
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el proyecto:
   ```bash
   npx expo start
   ```

---

## 🎨 Características Principales

* **Buscador de Ofertas Integrado**: Pestaña dedicada para buscar juegos rebajados de Steam consumiendo la API de CheapShark.
* **Cálculo de Moneda Tarjeta (Argentina)**: Lógica automatizada en el chatbot para aproximar el precio del juego de USD a Pesos Argentinos (ARS) incluyendo el 60% de impuestos (tasa tarjeta de ARS $1500 por USD).
* **UI Premium y Fluida**: Estilo oscuro elegante inspirado en la interfaz oficial de Steam con burbujas de mensaje adaptables y componentes con haptic feedback.
