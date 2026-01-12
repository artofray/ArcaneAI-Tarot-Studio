
import { GoogleGenAI, Modality } from "@google/genai";
import { ImageSize, ModelType } from "../types";

export async function generateTarotArt(
  prompt: string, 
  style: string, 
  model: ModelType = 'flash', 
  size: ImageSize = '1K',
  aspectRatio: "9:16" | "1:1" = "9:16"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const modelName = model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const fullPrompt = `Create a tarot card illustration: ${prompt}. Artistic style: ${style}. High resolution, vertical composition.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          ...(model === 'pro' ? { imageSize: size } : {})
        }
      }
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image data returned from Gemini");
    return imageUrl;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

export async function editTarotArt(
  base64Image: string, 
  instruction: string, 
  style: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  // Clean base64 string
  const data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: 'image/png'
            }
          },
          { text: `Edit this tarot card illustration according to the instruction: ${instruction}. Keep the overall style consistent with: ${style}` }
        ]
      }
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image data returned from Gemini for edit");
    return imageUrl;
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
}

// Live API Helpers
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
