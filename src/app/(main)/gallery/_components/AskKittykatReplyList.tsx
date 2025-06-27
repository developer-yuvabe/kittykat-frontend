// components/AskKittykatReplyList.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeIcon } from "@/components/ui/custom-icon";
import { Textarea } from "@/components/ui/textarea";
import ZoomableImage from "@/components/ui/zoomable-image";
import { formatTime } from "@/lib/gallery.utils";
import { useUserStore } from "@/store/user.store";
import { CommentReply } from "@/types/gallery.types";
import { UserRoleId } from "@/types/user.types";
import { Edit, Trash2 } from "lucide-react";

import { useState } from "react";

interface EditingReply {
  commentId: string;
  replyId: string;
}

interface AskKittykatReplyListProps {
  replies: CommentReply[] | undefined;
  commentId: string;
  itemId: string;
  editingReply: EditingReply | null;
  setEditingReply: (value: EditingReply | null) => void;
  onUpdateReply: (commentId: string, replyId: string, text: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onLikeReply: (reply: CommentReply, itemId: string, commentId: string) => void;
}

export function AskKittykatReplyList({
  replies,
  commentId,
  itemId,
  editingReply,
  setEditingReply,
  onUpdateReply,
  onDeleteReply,
  onLikeReply,
}: AskKittykatReplyListProps) {
  const [editText, setEditText] = useState("");
  const isSubmitting = false; // Replace with actual state if needed
  const { user } = useUserStore();

  if (!replies || replies.length === 0) return null;

  return (
    <div className="ml-11 space-y-3">
      {replies.map((reply) => {
        const isEditing =
          editingReply?.commentId === commentId &&
          editingReply?.replyId === reply.id;

        const isLiked = (reply.likes ?? []).includes(user?.id ?? "");

        return (
          <div key={reply.id} className="flex gap-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={`/placeholder.svg?height=24&width=24`} />
              <AvatarFallback className="text-xs">
                {reply.added_by_name?.slice(0, 1).toUpperCase() ??
                  reply.added_by.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs">
                  {reply.added_by_name || reply.added_by}
                </span>
                {reply.added_by_role && (
                  <Badge
                    variant={
                      (
                        {
                          [UserRoleId.ADMIN]: "admin",
                          [UserRoleId.USER]: "client",
                        } as Record<UserRoleId, "admin" | "client">
                      )[reply.added_by_role as UserRoleId] ?? "secondary"
                    }
                    className="text-xs"
                  >
                    {{
                      [UserRoleId.ADMIN]: "Kittykat",
                      [UserRoleId.USER]: "Client",
                    }[reply.added_by_role] ?? "Unknown"}
                  </Badge>
                )}

                <span className="text-xs text-gray-500">
                  {formatTime(reply.added_at)}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[40px] text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        onUpdateReply(commentId, reply.id, editText)
                      }
                      disabled={isSubmitting}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingReply(null);
                        setEditText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-700 mb-1">{reply.text}</p>

                  {reply.attachments && reply.attachments?.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      {reply.attachments.map((attachment, idx) => (
                        <ZoomableImage
                          src={attachment}
                          key={idx}
                          className="w-16 h-16 object-cover rounded border cursor-pointer"
                          variant="download"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div
                      onClick={() => onLikeReply(reply, itemId, commentId)}
                      className="flex items-center space-x-1 cursor-pointer"
                    >
                      <LikeIcon
                        className={`w-4 h-4 transition-colors duration-200 ${
                          isLiked ? "text-blue-600" : ""
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {reply.likes?.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => {
                        setEditingReply({
                          commentId,
                          replyId: reply.id,
                        });
                        setEditText(reply.text);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-red-600 hover:text-red-700"
                      onClick={() => onDeleteReply(commentId, reply.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
