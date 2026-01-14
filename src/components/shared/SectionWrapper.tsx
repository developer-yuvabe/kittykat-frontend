import { cn } from "@/lib/utils";
import { useThreadStore } from "@/store/thread.store";
import { useQueryState } from "nuqs";
import React, { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";

const SectionWrapper = ({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { showChatAssistant } = useThreadStore();
  const [scrollTo, setScrollTo] = useQueryState("scrollTo");

  useEffect(() => {
    if (scrollTo === id) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollTo(null);
    }
  }, [scrollTo, id]);

  return (
    <div
      id={id}
      className={cn("py-14 border-b scroll-mt-24", className, {
        "px-24": showChatAssistant,
      })}
      ref={ref}
    >
      <section className="container mx-auto">{children}</section>
    </div>
  );
};

export const SectionWrapperSkeleton = () => {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          className="py-14 border-b scroll-mt-24 px-24 last:border-b-0"
          key={idx}
        >
          <section className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex gap-x-4 items-center">
                <Skeleton className="w-12 h-12 rounded-lg bg-gray-200" />
                <div className="w-14 h-14 rounded-lg bg-gray-200 text-white flex items-center justify-center" />

                <div className="space-y-2">
                  <Skeleton className="w-80 h-6 rounded-lg bg-gray-200" />
                  <Skeleton className="w-60 h-6 rounded-lg bg-gray-200" />
                </div>
              </div>

              <div className="flex items-center gap-x-2">
                <div>
                  <Skeleton className="w-24 h-12 rounded-lg bg-gray-200" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg bg-gray-200" />
              </div>
            </div>
          </section>
        </div>
      ))}
    </div>
  );
};

export default SectionWrapper;
