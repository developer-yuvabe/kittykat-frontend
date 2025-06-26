// components/AskKittykatCommentItem.tsx
import { ThumbsUp, Reply, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/types/gallery.types";
import { useState } from "react";
import { UserRoleId } from "@/types/user.types";
import { formatTime } from "@/lib/gallery.utils";
import { useUserStore } from "@/store/user.store";
import ZoomableImage from "@/components/ui/zoomable-image";

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

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
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
            <Badge
              variant={
                (
                  {
                    [UserRoleId.ADMIN]: "admin",
                    [UserRoleId.USER]: "client",
                  } as Record<UserRoleId, "admin" | "client">
                )[comment.added_by_role as UserRoleId] ?? "secondary"
              }
              className="text-xs"
            >
              {{
                [UserRoleId.ADMIN]: "Kittykat",
                [UserRoleId.USER]: "Client",
              }[comment.added_by_role] ?? "Unknown"}
            </Badge>
          )}

          <span className="text-xs text-gray-500">
            {formatTime(comment.added_at)}
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
            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>

            {comment?.attachments && comment?.attachments?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {comment?.attachments.map((attachment, idx) => (
                  <ZoomableImage
                    src={attachment}
                    key={idx}
                    className="w-16 h-16 object-cover rounded border cursor-pointer"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div
                onClick={() => onLikeComment(comment, itemId)}
                className="flex items-center space-x-1 cursor-pointer"
              >
                <ThumbsUp
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isLiked ? "text-blue-600 fill-blue-600" : "text-gray-400"
                  }`}
                />
                <span className="text-muted-foreground">{likeCount}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" /> Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0"
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditText(comment.text);
                }}
              >
                <Edit className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-red-600 hover:text-red-700"
                onClick={() => onDeleteComment(comment.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
