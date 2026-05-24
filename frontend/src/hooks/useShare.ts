export function useShare() {
  const sharePost = async (postId: string, title: string = "Mira esto en El Pacto BC") => {
    const url = `${window.location.origin}?post=${postId}`;

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "El Pacto BC",
            text: title,
            url,
          });
          return { shared: true, url };
        } catch (err) {
          if ((err as any).name === "AbortError") {
            return { aborted: true };
          }
          // Si falla navigator.share, caer a portapapeles
          console.log("Fallback a portapapeles después de error en share");
        }
      }

      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(url);
      return { copied: true, url };
    } catch (err) {
      console.error("Error en share:", err);
      return { copied: false, error: true };
    }
  };

  return { sharePost };
}
