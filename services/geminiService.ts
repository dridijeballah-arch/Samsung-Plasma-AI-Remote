import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RemoteKey, GeminiCommandResponse, TvState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const interpretCommand = async (
  userText: string, 
  tvState: TvState, 
  channels: { number: number; name: string }[]
): Promise<GeminiCommandResponse> => {
  
  const channelContext = channels.map(c => `${c.name} (Ch ${c.number})`).join(', ');
  const stateContext = `Power: ${tvState.isOn ? 'ON' : 'OFF'}, Vol: ${tvState.volume}, Source: ${tvState.source}, Current Ch: ${tvState.channel}`;

  const SYSTEM_INSTRUCTION = `
Tu es l'assistant intelligent d'une TV Samsung.
CONTEXTE ACTUEL TV : ${stateContext}
CHAINES DISPONIBLES : ${channelContext}

Ta tâche :
1. Analyser la demande.
2. Si l'utilisateur nomme une chaîne (ex: "Mets la 6", "Mets M6", "Zappe sur Arte"), utilise le champ "channel" avec le numéro correspondant.
3. Si l'utilisateur veut une action simple (Volume, Power, Menu...), utilise "action" avec un RemoteKey.
4. Si la demande est impossible (ex: "Monte le son" alors que le volume est déjà à 100), explique-le dans "reply".

Boutons : ${Object.values(RemoteKey).join(', ')}.

Exemples :
- "Mets la 15" -> { "channel": 15, "action": null, "reply": "Zap sur BFM TV." }
- "Allume" (si éteint) -> { "action": "POWER", "reply": "Allumage..." }
- "Monte le son" -> { "action": "VOL_UP", "reply": "Volume +1." }
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "Le bouton unique à presser.",
              nullable: true,
            },
            channel: {
              type: Type.INTEGER,
              description: "Le numéro de chaîne complet à atteindre (ex: 12, 21).",
              nullable: true,
            },
            reply: {
              type: Type.STRING,
              description: "Réponse courte à l'utilisateur.",
            },
          },
          required: ["reply"],
        } as Schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Réponse vide de Gemini");

    const parsed = JSON.parse(jsonText);
    
    // Validate action
    let validAction: RemoteKey | null = null;
    if (parsed.action && Object.values(RemoteKey).includes(parsed.action as RemoteKey)) {
      validAction = parsed.action as RemoteKey;
    }

    return {
      action: validAction,
      channel: parsed.channel || undefined,
      reply: parsed.reply || "Commande traitée.",
    };

  } catch (error) {
    console.error("Erreur Gemini:", error);
    return {
      action: null,
      reply: "Désolé, une erreur est survenue.",
    };
  }
};