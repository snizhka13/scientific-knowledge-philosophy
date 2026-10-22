// Тонкі іконки читалки в одному стилі (stroke 1.6).
const I = ({ d, children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

export const IconBack = () => <I d="M19 12H5M11 6l-6 6 6 6" />;
export const IconList = () => <I d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />;
export const IconBookmark = ({ on }) => (
  <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);
export const IconNotes = () => <I d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />;
export const IconType = () => <I d="M4 19 9 5l5 14M6 14h6M15 19l3-8 3 8M16 16.5h4" />;
export const IconQuote = () => <I d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6" />;
export const IconWord = () => <I d="M4 5h9a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5v12" />;
export const IconCopy = () => <I d="M9 9h11v11H9zM5 15H4V4h11v1" />;
export const IconClose = () => <I d="M6 6l12 12M18 6 6 18" />;
export const IconTrash = () => <I d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />;
export const IconDownload = () => <I d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const IconArrow = () => <I d="M5 12h14M13 6l6 6-6 6" />;
export const IconSearch = () => <I d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4" />;
export const IconSpark = () => <I d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />;
