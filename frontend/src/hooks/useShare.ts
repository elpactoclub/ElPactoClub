// EN: Hook exposing a sharePost helper that copies a deep-link URL for a post to the clipboard.
// ES: Hook que expone un helper sharePost que copia una URL de enlace directo a una publicación en el portapapeles.

// EN: Returns sharePost, which builds and copies a ?post= URL for the given post ID.
// ES: Devuelve sharePost, que construye y copia una URL ?post= para el ID de publicación dado.
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
