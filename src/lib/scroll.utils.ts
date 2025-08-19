/**
 * Scrolls to the bottom of the chat container with smooth behavior
 * Tries multiple selector approaches to ensure compatibility
 * @param delay - Optional delay before scrolling (default: 100ms)
 */
export const scrollToBottom = (delay: number = 100): void => {
  setTimeout(() => {
    // Try multiple approaches to ensure scroll happens
    const chatContainer = document.querySelector('[class*="StickToBottom"]');
    const scrollContainer = document.querySelector(
      '[class*="overflow-y-scroll"]'
    );

    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    } else if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    } else {
      // Fallback: scroll the window
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  }, delay);
};
