// YouTube URL'dan video ID ajratish
export function getYoutubeId(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  return m ? m[1] : "";
}
export const youtubeThumb = (id) => (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");
export const youtubeEmbed = (id) => (id ? `https://www.youtube.com/embed/${id}` : "");
