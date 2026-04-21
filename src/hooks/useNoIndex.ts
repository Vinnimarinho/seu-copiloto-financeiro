import { useEffect } from "react";

/**
 * Aplica <meta name="robots" content="noindex,nofollow"> apenas enquanto a
 * rota privada está montada. Garante que áreas logadas não sejam indexadas
 * mesmo se acidentalmente acessadas por crawlers (defesa em profundidade —
 * o robots.txt já as bloqueia).
 */
export function useNoIndex() {
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex,nofollow";
    document.head.appendChild(tag);
    return () => {
      document.head.removeChild(tag);
    };
  }, []);
}
