import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { BrandPersona } from "@/types/persona.types";
import BrandPersonaCard from "./BrandPersonaCard";

interface BrandPersonaCarouselProps {
  personas: BrandPersona[];
  brandId: string;
  onEdit?: (persona: BrandPersona) => void;
  onDuplicate?: (persona: BrandPersona) => void;
  onDelete?: (personaId: string) => void;
}

// Create context for view more/less state across all cards
const ViewMoreContext = createContext<{
  viewMore: boolean;
  setViewMore: (value: boolean) => void;
}>({
  viewMore: false,
  setViewMore: () => {},
});

export const useViewMore = () => useContext(ViewMoreContext);

function BrandPersonaCarousel({
  personas,
  brandId,
  onEdit,
  onDuplicate,
  onDelete,
}: BrandPersonaCarouselProps) {
  const [viewMore, setViewMore] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const previousLengthRef = useRef(personas.length);

  useEffect(() => {
    if (!carouselApi) return;

    const previousLength = previousLengthRef.current;
    if (personas.length > previousLength) {
      requestAnimationFrame(() => {
        // Smooth animated scroll
        carouselApi.scrollTo(personas.length - 1, false);
      });
    }

    previousLengthRef.current = personas.length;
  }, [carouselApi, personas.length]);

  return (
    <ViewMoreContext.Provider value={{ viewMore, setViewMore }}>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        setApi={setCarouselApi}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {personas.map((persona) => (
            <CarouselItem
              key={persona.id}
              className="pl-4 md:basis-1/2 lg:basis-1/3"
            >
              <BrandPersonaCard
                persona={persona}
                brandId={brandId}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {personas.length > 1 && (
          <>
            <CarouselPrevious className="-left-2" />
            <CarouselNext className="-right-2" />
          </>
        )}
      </Carousel>
    </ViewMoreContext.Provider>
  );
}

export default BrandPersonaCarousel;
