export function computeReorderData(
  currentIds: string[],
  draggedIds: string[],
  overId: string
): { id: string; brand_sort_order: number }[] | null {
  if (!currentIds.length || !draggedIds.length) return null;

  const draggedIdSet = new Set(draggedIds);
  const draggedIdsOrdered = currentIds.filter((id) => draggedIdSet.has(id));
  const remainingIds = currentIds.filter((id) => !draggedIdSet.has(id));

  const targetIndexInRemaining = remainingIds.indexOf(overId);
  if (targetIndexInRemaining === -1) return null;

  const firstDraggedIndex = draggedIdsOrdered
    .map((id) => currentIds.indexOf(id))
    .reduce((min, idx) => (idx < min ? idx : min), Number.POSITIVE_INFINITY);

  const overIndex = currentIds.indexOf(overId);
  if (overIndex === -1) return null;

  // Move after the target when dragging downward, before when moving upward
  const isMovingDown = firstDraggedIndex < overIndex;
  const insertIndex = isMovingDown
    ? targetIndexInRemaining + 1
    : targetIndexInRemaining;

  const reorderedIds = [
    ...remainingIds.slice(0, insertIndex),
    ...draggedIdsOrdered,
    ...remainingIds.slice(insertIndex),
  ];

  return reorderedIds.map((id, index) => ({
    id,
    brand_sort_order: index,
  }));
}
