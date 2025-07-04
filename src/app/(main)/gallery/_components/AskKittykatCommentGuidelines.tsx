import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

export const AskKittykatCommentGuidelines = () => {
  const { user } = useUserStore();

  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  return (
    <div className="text-center py-8">
      {isAdmin ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            The client has not given any comments yet on this asset.
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-4">Contact us to Edit</p>
          <div className="text-center text-gray-500 text-sm space-y-2">
            <p>
              To request edits for this image, please provide detailed
              instructions in the comment box below.
            </p>
            <div className="flex justify-center">
              <ul className="list-disc space-y-1 text-left max-w-md pl-4">
                <li>
                  <span className="font-medium">Specify the changes:</span>{" "}
                  Clearly describe what you want to modify, add, or remove in
                  the image.
                </li>
                <li>
                  <span className="font-medium">Upload reference assets:</span>{" "}
                  Attach any images, sketches, or files that can help clarify
                  your request.
                </li>
                <li>
                  <span className="font-medium">
                    Be as detailed as possible:
                  </span>{" "}
                  The more information you provide, the better we can assist
                  you.
                </li>
              </ul>
            </div>
            <p>
              Once submitted, our team will review your request and respond as
              soon as possible.
            </p>
            <p className="text-xs text-red-600 font-semibold">
              Note: Image edit requests are chargeable as per the scope of work.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
