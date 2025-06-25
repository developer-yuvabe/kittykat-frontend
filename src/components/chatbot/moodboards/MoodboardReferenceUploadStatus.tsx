// components/ManualCampaignUploadStatus.tsx

interface MoodboardReferenceUploadStatusProps {
  isUploading: boolean;
  uploadError?: string | null;
}

export const MoodboardReferenceUploadStatus = ({
  isUploading,
  uploadError,
}: MoodboardReferenceUploadStatusProps) => {
  return (
    <div className="space-y-4">
      {/* Upload Status */}
      {isUploading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading...
          </div>
        </div>
      )}

      {uploadError && (
        <div className="text-center py-2 text-red-600 text-sm">
          {uploadError}
        </div>
      )}
    </div>
  );
};
