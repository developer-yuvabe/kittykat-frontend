import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaLibraryTabsProps {
  isSticky?: boolean;
}

function MediaLibraryTabs({ isSticky }: MediaLibraryTabsProps) {
  const tabs = [
    { value: "all-media", label: "All Media" },
    { value: "moodboard", label: "Moodboards" },
    { value: "images", label: "Images" },
    // { value: "videos", label: "Videos" },
    { value: "models", label: "Models" },
    { value: "products", label: "Products" },
  ];

  return (
    <div className={isSticky ? "sticky top-0 z-40 bg-white" : ""}>
      <h1 className="text-2xl font-bold mb-4">Media library</h1>
      <TabsList className="mb-4 border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

export default MediaLibraryTabs;
