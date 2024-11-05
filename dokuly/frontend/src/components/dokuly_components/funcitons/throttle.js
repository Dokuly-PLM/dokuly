/**
 * Throttle a function so that it can be called at most once every `delay` milliseconds.
 *
 * @param {Function} callback - The function to be throttled.
 * @param {number} delay - The time, in milliseconds, to wait before allowing the function to be called again.
 * @return {Function} - A new function that, when called, will execute `callback` in a throttled manner.
 */
export function throttle(callback, delay) {
  let isThrottlingActive = false; // Indicates whether throttling is currently active
  let lastArgs = null; // Stores the latest arguments passed to the throttled function

  // Function to handle the execution of the callback with stored arguments
  function executeWithStoredArgs() {
    // If there are no stored arguments, set throttling to inactive
    if (lastArgs === null) {
      isThrottlingActive = false;
    } else {
      // Execute the callback with the stored arguments
      callback(...lastArgs);

      // Reset stored arguments
      lastArgs = null;

      // Schedule the next execution
      setTimeout(executeWithStoredArgs, delay);
    }
  }

  // The throttled function
  return (...args) => {
    // If throttling is active, store the latest arguments
    if (isThrottlingActive) {
      lastArgs = args;
      return;
    }

    // Execute the callback immediately if throttling is not active
    callback(...args);

    // Activate throttling
    isThrottlingActive = true;

    // Schedule the next allowed execution
    setTimeout(executeWithStoredArgs, delay);
  };
}
