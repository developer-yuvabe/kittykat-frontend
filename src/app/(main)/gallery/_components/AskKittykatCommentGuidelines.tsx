import { Lock } from "lucide-react";

export const AskKittykatCommentGuidelines = () => {
  return (
    <div className="text-center py-8">
      <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500 mb-4">Contact us to Edit</p>
      <div className="text-center text-gray-500 text-sm space-y-2">
        <p>
          To request edits for this image, please provide detailed instructions
          in the comment box below.
        </p>
        <div className="flex justify-center">
          <ul className="list-disc space-y-1 text-left max-w-md pl-4">
            <li>
              <span className="font-medium">Specify the changes:</span> Clearly
              describe what you want to modify, add, or remove in the image.
            </li>
            <li>
              <span className="font-medium">Upload reference assets:</span>{" "}
              Attach any images, sketches, or files that can help clarify your
              request.
            </li>
            <li>
              <span className="font-medium">Be as detailed as possible:</span>{" "}
              The more information you provide, the better we can assist you.
            </li>
          </ul>
        </div>
        <p>
          Once submitted, our team will review your request and respond as soon
          as possible.
        </p>
      </div>
    </div>
  );
};
