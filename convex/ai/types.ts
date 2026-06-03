// Swappable image-provider contract. Adapters (openai, ideogram) implement this
// so we can A/B models by switching IMAGE_PROVIDER — no caller changes.

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
export type ImageQuality = "low" | "medium" | "high";

export interface GenerateImageInput {
  prompt: string;
  size: ImageSize;
  quality: ImageQuality;
  n: number; // number of alternatives
  refImages?: string[]; // reference image URLs (used where the provider supports it)
}

export interface GeneratedImage {
  b64: string; // base64-encoded PNG
}

export interface ImageProvider {
  readonly name: string;
  generate(
    input: GenerateImageInput,
    apiKey: string,
    model: string,
  ): Promise<GeneratedImage[]>;
  // Rough USD estimate so we can track spend per generation from day one.
  estimateCost(quality: ImageQuality, size: ImageSize, n: number): number;
}

// Map our format keys to provider sizes.
export const FORMAT_SIZE: Record<string, ImageSize> = {
  square: "1024x1024",
  story: "1024x1536",
  land: "1536x1024",
};
