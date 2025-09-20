export const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    if (remainingHours > 0 && remainingMinutes > 0) {
      return `${days}d ${remainingHours}h ${remainingMinutes}m left`;
    } else if (remainingHours > 0) {
      return `${days}d ${remainingHours}h left`;
    } else if (remainingMinutes > 0) {
      return `${days}d ${remainingMinutes}m left`;
    }
    return `${days}d left`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    if (remainingMinutes > 0 && remainingSeconds > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s left`;
    } else if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m left`;
    }
    return `${hours}h left`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    // Always show seconds when we're in the minutes range for better countdown experience
    return `${minutes}m ${remainingSeconds}s left`;
  }

  if (seconds > 0) {
    return `${seconds}s left`;
  }

  return 'Expired';
};

export const formatFixedScheduleTime = (timeString: string): string => {
  const date = new Date(timeString);
  
  // Format as user's local time
  const localTime = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  // Also show UTC time for reference
  const utcTime = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
  
  return `${localTime} (${utcTime})`;
};