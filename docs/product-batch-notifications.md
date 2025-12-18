# Product Extraction Batch Progress Notification System

## Overview
This implementation adds real-time progress tracking for product extraction batches using Server-Sent Events (SSE). Users can see live updates as their images are processed, with notifications appearing in the bottom-right corner of the screen.

## Architecture

### Backend Integration
The system connects to the backend SSE endpoint:
```
GET /product-batch/{batch_id}
```

This endpoint streams batch status updates in real-time with the following structure:
```json
{
  "event": "batch_status",
  "data": {
    "status": "pending" | "processing" | "completed" | "failed",
    "total_images": number,
    "processed_images": number
  }
}
```

## Components Created

### 1. **useProductBatchProgress Hook** 
`src/hooks/sse/useProductBatchProgress.tsx`

Custom hook that manages SSE connection for a specific batch:
- Connects to the SSE endpoint when a batchId is provided
- Parses and manages batch status updates
- Triggers callbacks on completion or error
- Automatically closes connection when batch is completed/failed

**Usage:**
```tsx
const { batchStatus, isConnected, closeConnection } = useProductBatchProgress({
  batchId: "batch-123",
  onComplete: (status) => {
    console.log("Batch completed!", status);
  },
  onError: () => {
    console.error("Connection error");
  }
});
```

### 2. **ProductBatchNotification Component**
`src/components/notifications/ProductBatchNotification.tsx`

Visual component that displays batch progress:
- Shows status icon (spinner for processing, checkmark for completed, X for failed)
- Displays progress bar with percentage
- Color-coded based on status
- Auto-dismiss capability for completed/failed batches

**Features:**
- Real-time progress bar
- Status-specific styling and icons
- Brand name badge
- Dismiss button (hidden during processing)

### 3. **ProductBatchNotificationList Component**
`src/components/notifications/ProductBatchNotificationList.tsx`

Container component that manages all active batch notifications:
- Renders multiple batch notifications simultaneously
- Handles auto-dismissal after completion (5 seconds)
- Refetches gallery when batch completes
- Shows toast notifications for completion/failure
- Animated entry/exit transitions using Framer Motion

**Position:** Fixed bottom-right corner, responsive width

### 4. **Product Batch Store**
`src/store/product-batch.store.ts`

Zustand store for managing active batches:
```typescript
interface ActiveProductBatch {
  batchId: string;
  brandId: string;
  brandName: string;
  startedAt: string;
}
```

**Actions:**
- `addBatch()` - Add a new batch to track
- `removeBatch()` - Remove completed/failed batch
- `clearBatches()` - Clear all batches

## Integration Points

### MediaBulkActions Component
Updated to use the batch notification system:

1. **Import the store:**
```tsx
import { useProductBatchStore } from "@/store/product-batch.store";
```

2. **Add batch when extraction starts:**
```tsx
if (response.success && response.batch_id) {
  addBatch({
    batchId: response.batch_id,
    brandId: brandId,
    brandName: brandName,
    startedAt: new Date().toISOString(),
  });
  
  toast.success("Product extraction started! Track progress in the notification panel.");
}
```

### MainLayout Component
Added global notification list that appears on all pages:
```tsx
<ProductBatchNotificationList />
```

## Type Definitions

### Updated Types
**`src/services/api/a2i.service.ts`:**
```typescript
export interface ProductExtractionResponse {
  success: boolean;
  batch_id?: string; // NEW: Batch ID for tracking
  total_images_processed: number;
  total_products_extracted: number;
  image_results: ImageResult[];
}
```

**`src/types/notification.types.ts`:**
```typescript
export interface ProductBatchNotificationItem {
  batch_id: string;
  brand_id: string;
  brand_name: string;
  created_at: string;
}
```

## User Flow

1. **User selects images and clicks "Extract Products"**
   - Frontend sends request to backend
   - Backend returns `batch_id` in response

2. **Batch is added to notification system**
   - `addBatch()` called with batch details
   - Notification appears in bottom-right corner

3. **Real-time progress updates**
   - SSE connection streams status updates
   - Progress bar updates automatically
   - User sees: "Processing... X of Y images"

4. **Completion**
   - Status changes to "completed" or "failed"
   - Gallery automatically refetches to show new products
   - Toast notification appears
   - Notification auto-dismisses after 5 seconds

## Benefits

1. **Better UX**: Users see real-time progress instead of waiting blindly
2. **Non-blocking**: Users can continue working while extraction runs
3. **Scalable**: Can track multiple batches simultaneously
4. **Resilient**: Handles connection errors gracefully
5. **Informative**: Clear status indicators and progress percentage

## Styling

The notification system uses:
- Color-coded backgrounds (blue for processing, green for completed, red for failed)
- Animated entry/exit transitions
- Responsive width (max 96rem, adapts to viewport)
- Fixed positioning that doesn't interfere with content
- Stacking support for multiple notifications

## Error Handling

- Connection errors automatically remove the batch
- Empty responses from backend trigger error callback
- Failed batches show error message and auto-dismiss
- Graceful fallback to synchronous flow if no batch_id returned

## Future Enhancements

Potential improvements:
1. Add ability to cancel in-progress batches
2. Show thumbnail preview of processed images
3. Add sound notification on completion
4. Persist batch history for review
5. Add batch retry capability
