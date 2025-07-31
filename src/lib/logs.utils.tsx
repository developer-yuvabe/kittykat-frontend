import { SocialOptionId } from "@/types/campaign.types";
import { AnalysisStatus } from "@/types/logs.types";
import { AnalysisLogDetail } from "@/types/types";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export const formatTimestamp = (timestamp: string | { $date: string }) => {
  try {
    const rawDate =
      typeof timestamp === "string" ? timestamp : timestamp?.$date;

    const date = new Date(rawDate);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 604800000) {
      // If within 7 days, show relative time
      return formatDistanceToNow(date, { addSuffix: true });
    }

    // For older dates, format as: Jul 31 or Jul 31, 2024
    return format(
      date,
      date.getFullYear() !== now.getFullYear() ? "MMM d, yyyy" : "MMM d"
    );
  } catch (error) {
    console.error("Error formatting timestamp:", timestamp, error);
    return "Invalid date";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case AnalysisStatus.IN_PROGRESS:
    case "processing": // Legacy support
      return (
        <Activity className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
      );
    case AnalysisStatus.PENDING:
      return <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    case AnalysisStatus.COMPLETED:
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    case AnalysisStatus.FAILED:
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    case AnalysisStatus.CANCELLED:
      return <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
};

export const getPlatformFromOptionId = (optionId: string): string => {
  switch (optionId) {
    case SocialOptionId.Instagram:
      return "instagram";
    case SocialOptionId.Pinterest:
      return "pinterest";
    case SocialOptionId.Facebook:
      return "facebook";
    case SocialOptionId.Website:
      return "website";
    default:
      return "unknown";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case AnalysisStatus.IN_PROGRESS:
    case "processing": // Legacy support
      return "bg-blue-50 text-blue-700 border-blue-200";
    case AnalysisStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case AnalysisStatus.COMPLETED:
      return "bg-green-50 text-green-700 border-green-200";
    case AnalysisStatus.FAILED:
      return "bg-red-50 text-red-700 border-red-200";
    case AnalysisStatus.CANCELLED:
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export const formatAnalysisType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getEstimatedTimeRemaining = (log: AnalysisLogDetail) => {
  if (
    (log.status !== AnalysisStatus.IN_PROGRESS &&
      log.status !== "processing") ||
    log.progress_percent === 0
  )
    return null;

  const startTime = new Date(log.started_at || log.created_at).getTime();
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const estimatedTotal = (elapsedTime / log.progress_percent) * 100;
  const remaining = estimatedTotal - elapsedTime;

  if (remaining < 60000) return "< 1 min";
  if (remaining < 3600000) return `${Math.round(remaining / 60000)} min`;
  return `${Math.round(remaining / 3600000)} hr`;
};
