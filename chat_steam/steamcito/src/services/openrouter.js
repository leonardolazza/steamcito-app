// services/openrouter.js
import axios from "axios";

// Resolucion robusta de la API Key:
// 1. Prioriza la variable de entorno de Expo (EXPO_PUBLIC_OPENROUTER_API_KEY)
// 2. Fallback a la API Key de test entregada
const getApiKey = () => {
  try {
    if (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY) {
      return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    }
  }
  console.warn("API Key no configurada. Por favor define EXPO_PUBLIC_OPENROUTER_API_KEY en tu archivo .env");
  return "";
};

const OPENROUTER_API_KEY = getApiKey();

const systemPrompt = `Eres "Steamcito", un asistente de inteligencia artificial experto en la plataforma de videojuegos Steam. 
Tu única y principal tarea es ayudar al usuario con consultas sobre videojuegos de Steam.

Cuando el usuario te pregunte por un juego, debes responder OBLIGATORIAMENTE con la siguiente estructura formateada con Markdown claro y visualmente atractivo (utiliza emojis y negritas para resaltar títulos):

🎮 **[Nombre del Juego]**

📝 **Reseña**: [Un resumen conciso del juego y la opinión general de los jugadores]
⭐ **Puntuación del usuario**: [Puntuación promedio del juego en Steam, ej. 'Muy Positivas (88%)' o '9/10']
👥 **Jugadores activos**: [Número aproximado de jugadores simultáneos en las últimas 24 horas o promedio actual estimado]
💵 **Precio**:
   - **Dólares (USD)**: $X.XX USD
   - **Pesos Argentinos (ARS)**: $X.XX ARS (Calculado aproximado al tipo de cambio tarjeta de ARS $1500 por dólar, incluyendo impuestos del 60%)
💻 **Requisitos del sistema**:
   - **Mínimos**: [Requisitos mínimos de procesador, memoria RAM, tarjeta gráfica]
   - **Recomendados**: [Requisitos recomendados de procesador, memoria RAM, tarjeta gráfica]

OBLIGATORIO: Si conoces o puedes identificar el ID de la App de Steam para el juego consultado (por ejemplo, 105600 para Terraria, 570 para Dota 2, 730 para CS2, 1145360 para Hades), debes finalizar tu respuesta agregando EXACTAMENTE la siguiente etiqueta en una línea nueva al final de todo (reemplaza XXXXXX por el ID numérico de la app en Steam):
[AppID: XXXXXX]

Si el usuario te hace preguntas que NO tienen que ver con videojuegos de Steam (por ejemplo, preguntas generales sobre otros temas o tareas ajenas), debes rechazar responder amablemente y recordarle que tu propósito es responder consultas sobre videojuegos de Steam y proporcionar su reseña, puntuación, jugadores activos, precios en USD/pesos y requisitos.`;

export const fetchBotResponse = async (userMessage) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 800, // Incrementado ligeramente para asegurar que entren los requisitos y detalles
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      }
    );

    return response.data.choices?.[0]?.message?.content || "⚠️ No se encontró contenido";
  } catch (error) {
    console.error("❌ Error en OpenRouter:", error.response?.data || error.message);
    return "⚠️ Error al conectar con la API de OpenRouter.";
  }
};

