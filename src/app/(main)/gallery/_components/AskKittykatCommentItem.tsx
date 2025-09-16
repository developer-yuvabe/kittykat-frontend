// components/AskKittykatCommentItem.tsx
import { Reply, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/types/gallery.types";
import { useState } from "react";
import { UserRoleId } from "@/types/user.types";
import { useUserStore } from "@/store/user.store";
import ZoomableImage from "@/components/ui/zoomable-image";
import { LikeIcon } from "@/components/ui/custom-icon";
import { cn, formatToLocalTime } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ZoomableVideo from "@/components/ui/zoomable-video";
import { getAssetTypeFromUrlCooked } from "@/lib/gallery.utils";
import { MarkdownText } from "@/components/thread/markdown-text";

interface AskKittykatCommentItemProps {
  comment: Comment;
  itemId: string;
  editingCommentId: string | null;
  setEditingComment: (id: string | null) => void;
  setReplyingTo: (id: string | null) => void;
  onUpdateComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onLikeComment: (comment: Comment, itemId: string) => void;
}

export function AskKittykatCommentItem({
  comment,
  itemId,
  editingCommentId,
  setEditingComment,
  setReplyingTo,
  onUpdateComment,
  onDeleteComment,
  onLikeComment,
}: AskKittykatCommentItemProps) {
  const [editText, setEditText] = useState(comment.text);
  const isEditing = editingCommentId === comment.id;

  const { user } = useUserStore();

  const isLiked = (comment?.likes ?? []).includes(user?.id ?? "");
  const likeCount = comment?.likes?.length || 0;

  const roleToBadge: Record<
    string,
    { variant: "admin" | "client" | "secondary"; label: string }
  > = {
    [UserRoleId.ADMIN]: { variant: "admin", label: "Kittykat" },
    [UserRoleId.USER]: { variant: "client", label: "Client" },
  };

  const badgeInfo = comment.is_tasklist
    ? { variant: "default", label: "Tasklist" }
    : roleToBadge[comment.added_by_role ?? ""] ??
      (user?.role.name === "admin"
        ? { variant: "admin", label: "Kittykat" }
        : user?.role.name === "user"
        ? { variant: "client", label: "Client" }
        : { variant: "secondary", label: user?.role.name ?? "Unknown" });

  const isTempComment = comment.id.startsWith("temp-");

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage />
        <AvatarFallback>
          {comment.added_by_name?.slice(0, 1).toUpperCase() ??
            comment.added_by.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {comment.added_by_name || comment.added_by}
          </span>

          {comment.added_by_role && (
            <Badge variant={badgeInfo.variant as any} className="text-xs">
              {badgeInfo.label}
            </Badge>
          )}

          <span className="text-xs text-gray-500">
            {formatDistanceToNow(formatToLocalTime(comment.added_at), {
              addSuffix: true,
            })}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onUpdateComment(comment.id, editText)}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingComment(null);
                  setEditText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-700 mb-2">
              <MarkdownText>{comment.text}</MarkdownText>
            </div>

            {comment?.attachments && comment.attachments.length > 0 && (
              <div className="flex flex-row gap-x-2 mb-2">
                {comment.attachments.map((attachment, idx) => {
                  const mediaType = getAssetTypeFromUrlCooked(attachment);

                  return mediaType === "video" ? (
                    <ZoomableVideo
                      key={idx}
                      src={attachment}
                      className="w-16 h-16 object-contain rounded border cursor-pointer"
                    />
                  ) : (
                    <ZoomableImage
                      key={idx}
                      src={attachment}
                      className="w-16 h-16 object-cover rounded border cursor-pointer"
                      variant="download"
                    />
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div
                onClick={() => onLikeComment(comment, itemId)}
                aria-disabled={isTempComment}
                className={cn(
                  "flex items-center space-x-1 cursor-pointer transition-opacity",
                  isTempComment
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                )}
              >
                <LikeIcon
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isLiked ? "text-blue-600" : ""
                  }`}
                />
                <span className="text-muted-foreground">{likeCount}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0"
                onClick={() => setReplyingTo(comment.id)}
                disabled={isTempComment}
              >
                <Reply className="w-3 h-3 mr-1" /> Reply
              </Button>
              {user &&
                ((user?.role as unknown as UserRoleId) === UserRoleId.ADMIN ||
                  (!comment.is_tasklist && comment.added_by === user?.id)) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditText(comment.text);
                      }}
                      disabled={isTempComment}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-red-600 hover:text-red-700"
                      onClick={() => onDeleteComment(comment.id)}
                      disabled={isTempComment}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
