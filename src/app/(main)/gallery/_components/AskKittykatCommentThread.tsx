import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Reply } from "lucide-react";
import { Comment } from "@/types/gallery.types";

interface AskKittykatCommentThreadProps {
  comments: Comment[];
  itemId: string;
  editingComment: string | null;
  editText: string;
  setEditText: (text: string) => void;
  setEditingComment: (id: string | null) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  isSubmitting: boolean;
  onUpdateComment: (
    itemId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  handleSubmitReply: (commentId: string) => void;
  formatTime: (isoString: string) => string;
}

export const AskKittykatCommentThread: React.FC<
  AskKittykatCommentThreadProps
> = ({
  comments,
  itemId,
  editingComment,
  editText,
  setEditText,
  setEditingComment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  isSubmitting,
  onUpdateComment,
  handleSubmitReply,
  formatTime,
}) => {
  return (
    <>
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
              <AvatarFallback>
                {comment.added_by.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.added_by}</span>
                {comment.added_by.toLowerCase().includes("kitty") && (
                  <Badge variant="secondary" className="text-xs">
                    Kitty Kat
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(comment.added_at)}
                </span>
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await onUpdateComment(itemId, comment.id, editText);
                        setEditingComment(null);
                        setEditText("");
                      }}
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

                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {comment.attachments.map((attachment, idx) => (
                        <img
                          key={idx}
                          src={attachment || "/placeholder.svg"}
                          alt="Attachment"
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      <ThumbsUp className="w-3 h-3 mr-1" /> Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="w-3 h-3 mr-1" /> Reply
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-11 space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={`/placeholder.svg?height=24&width=24`} />
                    <AvatarFallback className="text-xs">
                      {reply.added_by.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">
                        {reply.added_by}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(reply.added_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyingTo === comment.id && (
            <div className="ml-11 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
};
