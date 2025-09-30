import { TasklistStatus } from "@/types/tasklist.types";

export const TASKLIST_STATUS_OPTIONS: Array<{
  value: TasklistStatus;
  label: string;
  description: string;
}> = [
  {
    value: "draft",
    label: "Draft",
    description: "Tasklist is in draft state",
  },
  {
    value: "request_created",
    label: "Request Created",
    description: "Tasklist request has been created",
  },
  {
    value: "in_progress",
    label: "In Progress",
    description: "Tasklist is currently being worked on",
  },
  {
    value: "in_review",
    label: "In Review",
    description: "Tasklist is under review",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Tasklist has been approved",
  },
  {
    value: "requested_revision",
    label: "Requested Revision",
    description: "Revision has been requested",
  },
  {
    value: "a2i_media_created",
    label: "A2I Media Created",
    description: "A2I media has been created",
  },
];
