// Bulletproof Clipboard Utilities with fallbacks for all browsers and security contexts

/**
 * Copies text to clipboard with modern Clipboard API and legacy execCommand fallback.
 * Returns true if successful, false otherwise.
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Method 1: Modern navigator.clipboard API
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed, attempting fallback...', err);
  }

  // Method 2: Fallback textarea + execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Prevent scrolling to bottom of page in MS Edge / iOS
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    console.error('execCommand copy failed');
    return false;
  }
}

/**
 * Reads text from clipboard.
 * Returns string if successful, null if failed or permission denied.
 */
export async function readTextFromClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return text || '';
    }
  } catch (err) {
    console.warn('navigator.clipboard.readText failed or permission denied:', err);
  }
  return null;
}
