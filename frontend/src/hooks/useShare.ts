export function useShare() {
  const sharePost = async (postId: string, title: string = "Mira esto en El Pacto BC") => {
    const url = `${window.location.origin}?post=${postId}`;

    try {
      // Usar clipboard directamente
      await navigator.clipboard.writeText(url);
      return { copied: true, url };
    } catch (err) {
      console.error("Error copiando al portapapeles:", err);
      return { copied: false, error: true };
    }
  };

  return { sharePost };
}
