// Client-side dominant-colour extraction (ported from the prototype).
// Runs in the browser only. Used to learn a client's palette from their posts.

export function extractPalette(img: HTMLImageElement, max = 5): string[] {
  const c = document.createElement("canvas");
  const s = 40;
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, s, s);
  const d = ctx.getImageData(0, 0, s, s).data;
  const samples: [number, number, number][] = [];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    if (mx - mn < 14 && mx > 30 && mx < 235) continue; // skip flat greys
    samples.push([r, g, b]);
  }
  return topColors(samples, max);
}

function topColors(arr: [number, number, number][], n: number): string[] {
  if (!arr.length) return [];
  const bins: Record<string, { c: [number, number, number]; n: number }> = {};
  for (const [r, g, b] of arr) {
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    if (!bins[key]) bins[key] = { c: [0, 0, 0], n: 0 };
    bins[key].c[0] += r;
    bins[key].c[1] += g;
    bins[key].c[2] += b;
    bins[key].n++;
  }
  return Object.values(bins)
    .sort((a, b) => b.n - a.n)
    .slice(0, n)
    .map(
      (o) =>
        "#" +
        o.c
          .map((v) => Math.round(v / o.n).toString(16).padStart(2, "0"))
          .join(""),
    );
}

// Load a File into an HTMLImageElement (browser only).
export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
