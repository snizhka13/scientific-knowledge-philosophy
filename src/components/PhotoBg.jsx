import { useState } from "react";

// Фонове фото картки. Якщо файл не знайдено, лишається градієнт картки.
export default function PhotoBg({ image }) {
  const [ok, setOk] = useState(Boolean(image?.src));
  if (!ok) return null;
  return <img
      className="photo-bg"
      src={image.src}
      alt=""
      loading="lazy"
      style={{ objectPosition: image.position }}
      onError={() => setOk(false)}
    />;
}
