import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryContextValue {
  images: string[];
  isOpen: boolean;
  currentIndex: number;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
}

const ImageGalleryContext = createContext<GalleryContextValue | null>(null);

export function useGallery(): GalleryContextValue {
  const ctx = useContext(ImageGalleryContext);
  if (!ctx) {
    return {
      images: [],
      isOpen: false,
      currentIndex: -1,
      open: () => {},
      close: () => {},
      next: () => {},
      prev: () => {},
    };
  }
  return ctx;
}

interface ImageGalleryProviderProps {
  images: string[];
  children: ReactNode;
}

export function ImageGalleryProvider({ images, children }: ImageGalleryProviderProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);

  const isOpen = currentIndex >= 0;

  const open = useCallback((index: number) => {
    if (index >= 0) setCurrentIndex(index);
  }, []);

  const close = useCallback(() => setCurrentIndex(-1), []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < 0 || images.length === 0 ? i : (i + 1) % images.length));
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) =>
      i < 0 || images.length === 0 ? i : (i - 1 + images.length) % images.length,
    );
  }, [images.length]);

  const value = useMemo<GalleryContextValue>(
    () => ({ images, isOpen, currentIndex, open, close, next, prev }),
    [images, isOpen, currentIndex, open, close, next, prev],
  );

  return (
    <ImageGalleryContext.Provider value={value}>
      {children}
      {isOpen && <Lightbox />}
    </ImageGalleryContext.Provider>
  );
}

function Lightbox() {
  const { images, currentIndex, isOpen, close, next, prev } = useGallery();

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, next, prev]);

  if (!isOpen || currentIndex < 0 || currentIndex >= images.length) return null;

  const src = images[currentIndex];
  const hasMultiple = images.length > 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={close}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      >
        <X className="w-6 h-6" />
      </button>

      {hasMultiple && (
        <button
          type="button"
          aria-label="Previous image"
          className="absolute left-2 sm:left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      <img
        src={src}
        alt=""
        className="max-w-[95vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && (
        <button
          type="button"
          aria-label="Next image"
          className="absolute right-2 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  );
}
