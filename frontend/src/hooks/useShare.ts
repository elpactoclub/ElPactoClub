export function useShare() {
  const sharePost = async (postId: string, title: string = "Mira esto en El Pacto BC") => {
    const url = `${window.location.origin}?post=${postId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "El Pacto BC",
          text: title,
          url,
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(url);
        return { copied: true, url };
      }
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.error("Error compartiendo:", err);
      }
      return { copied: false, error: true };
    }
    return { shared: true, url };
  };

  return { sharePost };
}
