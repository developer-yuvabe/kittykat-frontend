import { useEffect, useState } from "react";
import { fetchTopics, Topic } from "@/services/api/pexels.service";
import { createClient, PhotosWithTotalResults, ErrorResponse } from "pexels";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { env } from "@/config/env";

const client = createClient(env.NEXT_PUBLIC_PEXELS_API_KEY);

export default function TopicsGrid() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState("");

  // Load topics initially
  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchTopics();
        setTopics(result);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
      }
    };
    load();
  }, []);

  // React Query Infinite Scroll for Search
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery<PhotosWithTotalResults, ErrorResponse>({
      queryKey: ["search", search],
      queryFn: async ({ pageParam = 1 }) => {
        if (!search) throw new Error("No search query provided");
        const result = await client.photos.search({
          query: search,
          per_page: 16,
          page: (pageParam as number) ?? 1,
        });

        if ("photos" in result) {
          return result;
        }
        throw new Error((result as ErrorResponse).error ?? "API Error");
      },
      getNextPageParam: (lastPage) => {
        // only fetch next if available
        return lastPage.next_page ? lastPage.page + 1 : undefined;
      },
      enabled: !!search,
      initialPageParam: 1,
    });

  const handleSelectTopic = (topic: string) => {
    setSearch(topic);
  };

  const handleBack = () => {
    setSearch("");
  };

  // Intersection Observer to auto-load next page
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="mb-4 flex gap-2 items-center">
        {search && <Button onClick={handleBack}>Back</Button>}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search millions of online images..."
          className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Grid Section */}
      {search ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.pages.map((page) =>
              page.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative cursor-pointer rounded-lg overflow-hidden shadow-md group"
                >
                  <img
                    src={photo.src.medium}
                    alt={photo.alt ?? ""}
                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))
            )}
          </div>

          {/* Loader while fetching more */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}
        </>
      ) : isFetching ? (
        <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topics.map((t) => (
            <div
              key={t.id}
              className="relative cursor-pointer rounded-lg overflow-hidden shadow-md group"
              onClick={() => handleSelectTopic(t.topic)}
            >
              <img
                src={t.thumbnail_url || "https://via.placeholder.com/300"}
                alt={t.topic ?? ""}
                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {t.topic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
