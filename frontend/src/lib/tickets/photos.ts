/** Longest side, in px, a photo is shrunk to before it's kept. */
const MAX_SIDE = 1000;
/** JPEG quality for kept photos: small enough for localStorage, clear enough to see the problem. */
const QUALITY = 0.7;

/**
 * Shrinks a photo and returns it as a JPEG data URL, so it can be kept on the ticket in
 * localStorage (frontend only, no backend). Swap this for an upload to Supabase Storage later.
 */
export async function shrinkPhoto(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", QUALITY);
}
