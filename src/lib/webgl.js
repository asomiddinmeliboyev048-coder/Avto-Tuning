// Brauzerда WebGL mavjudligini tekshirish.
// Hardware acceleration o'chiq bo'lsa yoki GPU yo'q bo'lsa — false qaytaradi.
export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}
