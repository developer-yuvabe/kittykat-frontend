"use client";

import { useState } from "react";
import { TaskListTable } from "./_components/TaskListTable";
import { TaskListFilters } from "./_components/TaskListFilters";
import { TaskListDetailsDrawer } from "./_components/TaskListDetailsDrawer";
import {
  TaskListAdjustCredits,
  TaskListEditNotes,
} from "./_components/TaskListActions";
import type { TasklistFilters, TasklistRecord } from "@/types/tasklist.types";
import { useTaskList } from "@/hooks/useTaskList";

// Initial filters with reasonable defaults
const initialFilters: TasklistFilters = {
  page: 1,
  page_size: 20,
};

export default function TaskListPage() {
  const [filters, setFilters] = useState<TasklistFilters>(initialFilters);
  const [selectedTasklist, setSelectedTasklist] =
    useState<TasklistRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Action modal states
  const [adjustCreditsOpen, setAdjustCreditsOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [actionTasklist, setActionTasklist] = useState<TasklistRecord | null>(
    null
  );

  const { isAdmin, brands } = useTaskList();

  const handleTasklistSelect = (tasklist: TasklistRecord) => {
    setSelectedTasklist(tasklist);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    // Clear selection after a brief delay to allow for smooth closing animation
    setTimeout(() => setSelectedTasklist(null), 300);
  };

  // Action handlers

  const handleAdjustCredits = (tasklist: TasklistRecord) => {
    setActionTasklist(tasklist);
    setAdjustCreditsOpen(true);
  };

  const handleEditNotes = (tasklist: TasklistRecord) => {
    setActionTasklist(tasklist);
    setEditNotesOpen(true);
  };

  const closeActionModals = () => {
    setAdjustCreditsOpen(false);
    setEditNotesOpen(false);
    setActionTasklist(null);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Filters Section */}
      <TaskListFilters
        filters={filters}
        onFiltersChange={setFilters}
        isAdmin={isAdmin}
        availableBrands={brands.map((brand) => ({
          id: brand.brand_id,
          name: brand.brand_name,
        }))}
        availableCampaigns={brands.flatMap((brand) =>
          brand.campaigns.map((campaign) => ({
            id: campaign.id,
            name: campaign.title,
            brand_id: brand.brand_id,
          }))
        )}
      />

      {/* Main Table */}
      <div className="flex-1 min-h-0">
        <TaskListTable
          filters={filters}
          onFiltersChange={setFilters}
          onTasklistSelect={handleTasklistSelect}
          onAdjustCredits={handleAdjustCredits}
          onEditNotes={handleEditNotes}
        />
      </div>

      {/* Details Drawer */}
      <TaskListDetailsDrawer
        tasklistId={selectedTasklist?.id || null}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        brandId={selectedTasklist?.brand_id}
      />

      {/* Action Modals (Admin Only) */}
      {isAdmin && (
        <>
          <TaskListAdjustCredits
            tasklist={actionTasklist}
            isOpen={adjustCreditsOpen}
            onClose={closeActionModals}
          />

          <TaskListEditNotes
            tasklist={actionTasklist}
            isOpen={editNotesOpen}
            onClose={closeActionModals}
          />
        </>
      )}
    </div>
  );
}
