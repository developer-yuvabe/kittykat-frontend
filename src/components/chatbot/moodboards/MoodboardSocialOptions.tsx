"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, X, Edit } from "lucide-react";
import { SocialOption, SocialOptionId } from "@/types/campaign.types";
import { LimitsState } from "@/types/moodboard.types";

interface MoodboardSocialOptionsProps {
  socialOptions: SocialOption[];
  selectedOptions: string[];
  updateEditValue: (id: SocialOptionId, value: string) => void;
  saveEdit: (id: SocialOptionId) => void;
  cancelEditing: (id: SocialOptionId) => void;
  startEditing: (id: SocialOptionId) => void;
  toggleOption: (id: SocialOptionId) => void;
  limits: LimitsState;
  setLimits: React.Dispatch<React.SetStateAction<LimitsState>>;
}

export const MoodboardSocialOptions: React.FC<MoodboardSocialOptionsProps> = ({
  socialOptions,
  selectedOptions,
  updateEditValue,
  saveEdit,
  cancelEditing,
  startEditing,
  toggleOption,
  limits,
  setLimits,
}) => {
  const getLimitKey = (optionId: SocialOptionId): keyof LimitsState | null => {
    switch (optionId) {
      case "pinterest":
        return "pinterest_limit";
      case "instagram":
        return "instagram_limit";
      // case "facebook":
      //   return "facebook_limit";
      case "website":
        return "website_limit";
      default:
        return null;
    }
  };

  const handleLimitChange = (optionId: SocialOptionId, value: string) => {
    const limitKey = getLimitKey(optionId);
    if (limitKey) {
      const numValue = parseInt(value) || 0;
      setLimits((prev) => ({
        ...prev,
        [limitKey]: Math.max(0, numValue), // Ensure non-negative values
      }));
    }
  };

  return (
    <div className="space-y-4">
      {socialOptions.map((option) => {
        const limitKey = getLimitKey(option.id);
        const currentLimit = limitKey ? limits[limitKey] : null;

        return (
          <Card
            key={option.id}
            className="py-2 rounded-sm"
          >
            <CardContent className="px-2 m-0 ">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex-shrink-0">{option.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base flex flex-row gap-x-2">
                    <div>{option.name}</div>
                    {currentLimit !== null && (
                      <div className="flex items-center space-x-1">
                        <Input
                          type="number"
                          value={currentLimit}
                          onChange={(e) =>
                            handleLimitChange(option.id, e.target.value)
                          }
                          className="w-16 h-7 text-xs px-2"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </h3>

                  {option.isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Input
                        value={option.editValue}
                        onChange={(e) =>
                          updateEditValue(option.id, e.target.value)
                        }
                        className="text-sm flex-1 min-w-[150px]"
                        placeholder="Enter URL"
                      />
                      <Button
                        size="sm"
                        onClick={() => saveEdit(option.id)}
                        className="px-2"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelEditing(option.id)}
                        className="px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 ">
                      <a
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate flex-1 min-w-0"
                      >
                        {option.url}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(option.id)}
                        className="px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 self-start sm:self-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      // checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => toggleOption(option.id)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
