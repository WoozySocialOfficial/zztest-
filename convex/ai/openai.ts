import type {
  ImageProvider,
  GenerateImageInput,
  GeneratedImage,
  ImageQuality,
  ImageSize,
} from "./types";

// gpt-image-1.5 pricing (USD, verified June 2026). Mini is far cheaper and is
// used for drafts/tests via DRAFT_IMAGE_MODEL.
const PRICE: Record<string, Record<ImageQuality, number>> = {
  "gpt-image-1.5": { low: 0.009, medium: 0.034, high: 0.133 },
  "gpt-image-1-mini": { low: 0.004, medium: 0.011, high: 0.04 },
};

export const openaiProvider: ImageProvider = {
  name: "openai",

  async generate(
    input: GenerateImageInput,
    apiKey: string,
    model: string,
  ): Promise<GeneratedImage[]> {
    // gpt-image-* returns base64 PNGs from the generations endpoint.
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        size: input.size,
        quality: input.quality,
        n: input.n,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI image error ${res.status}: ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { data: { b64_json: string }[] };
    return data.data.map((d) => ({ b64: d.b64_json }));
  },

  estimateCost(quality: ImageQuality, _size: ImageSize, n: number): number {
    const table = PRICE["gpt-image-1.5"];
    return (table[quality] ?? 0.034) * n;
  },
};
