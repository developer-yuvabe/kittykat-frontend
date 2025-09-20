import ConceptVisualEditor from "@/app/(main)/concept-visual/_components/ConceptVisualEditor";
import { getModels } from "@/services/api/models.service";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useModelsStore } from "@/store/models.store";
import { useQuery } from "@tanstack/react-query";
import { LogoSection } from "./LogoSection";
import { NavLinks } from "./NavLinks";
import { UserProfileMenu } from "./UserProfileMenu";

export function TopNavigation() {
  const { setModels, setIsModelsFetched } = useModelsStore();
  const { isConceptVisualOpened, setIsConceptVisualOpened } =
    useConceptVisualStore();

  useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      try {
        const fetchedModels = await getModels();
        setModels(fetchedModels);
        return fetchedModels;
      } finally {
        setIsModelsFetched(true);
      }
    },
  });

  return (
    <>
      <div className="w-full h-24 px-4 flex items-center justify-between bg-white sticky top-0 z-40 border-b">
        <LogoSection />
        <NavLinks />
        <UserProfileMenu />
      </div>

      {/* Keep editor at the root level */}
      <ConceptVisualEditor
        open={isConceptVisualOpened}
        onOpenChange={setIsConceptVisualOpened}
      />
    </>
  );
}
