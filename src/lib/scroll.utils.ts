/**
 * Scrolls to the bottom of the chat container with smooth behavior
 * Uses unique ID for reliable targeting - only scrolls the chat panel, not other panels
 * @param delay - Optional delay before scrolling (default: 100ms)
 */
export const scrollToBottom = (delay: number = 100): void => {
  setTimeout(() => {
    const chatScrollContainer = document.getElementById(
      "chat-panel-scroll-container"
    );

    if (chatScrollContainer) {
      chatScrollContainer.scrollTo({
        top: chatScrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, delay);
};
