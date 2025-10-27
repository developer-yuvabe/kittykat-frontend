import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatAnalysisType,
  formatTimestamp,
  getStatusColor,
  getStatusIcon,
  calculateTimeTaken,
} from "@/lib/logs.utils";
import { AnalysisStatus } from "@/types/logs.types";
import { AnalysisLogDetail } from "@/types/types";
import { CheckCircle, FileText, XCircle } from "lucide-react";

export const BrandAnalysisLogs = (log: AnalysisLogDetail, isActive = false) => (
  <Card
    key={log.log_id}
    className={`border-0 shadow-none transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200"
        : "bg-gray-50/50 hover:bg-gray-50"
    }`}
  >
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        {getStatusIcon(log.status)}

        <div className="flex-1 min-w-0 space-y-3">
          {/* Header with improved spacing and contrast */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-gray-900">
                  {formatAnalysisType(log.analysis_type)}
                </h4>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${getStatusColor(log.status)}`}
              >
                {log.status.charAt(0).toUpperCase() +
                  log.status.slice(1).replace("_", " ")}
              </Badge>
            </div>
            <div className="text-right space-y-1 flex-shrink-0">
              <p className="text-xs text-gray-500 font-medium">
                {formatTimestamp(log.created_at)}
              </p>
            </div>
          </div>

          {/* Enhanced Progress Section */}
          {(log.status === AnalysisStatus.IN_PROGRESS ||
            log.status === AnalysisStatus.COMPLETED ||
            log.status === AnalysisStatus.FAILED) && (
            <div className="space-y-3 bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">
                  Progress
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {log.progress_percent}%
                </span>
              </div>
              <Progress
                value={log.progress_percent}
                className={`h-2.5 ${
                  log.status === AnalysisStatus.IN_PROGRESS
                    ? "bg-blue-100"
                    : "bg-green-100"
                }`}
              />

              {/* Enhanced Stats with better visual hierarchy */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {log.status === AnalysisStatus.IN_PROGRESS ? (
                    <span className="text-xs text-gray-600 font-medium">
                      Scraping latest {log.total_items} posts
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600 font-medium">
                      Scraped {log.successful_items} items from{" "}
                      {log.total_items} posts
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    {log.successful_items > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-700 font-semibold">
                          {log.successful_items}
                        </span>
                      </div>
                    )}
                    {log.failed_items > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-700 font-semibold">
                          {log.failed_items}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {!(log.status === AnalysisStatus.IN_PROGRESS) && (
                  <span className="text-xs text-gray-500 font-medium">
                    Time taken:{" "}
                    {calculateTimeTaken(
                      log.created_at,
                      log.completed_at,
                      log.updated_at
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Latest Message with better styling */}
          {log.user_friendly_messages &&
            log.user_friendly_messages.length > 0 && (
              <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Latest Update
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {
                    log.user_friendly_messages[
                      log.user_friendly_messages.length - 1
                    ]?.message
                  }
                </p>
              </div>
            )}
        </div>
      </div>
    </CardContent>
  </Card>
);
