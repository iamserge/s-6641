
export const logInfo = (message: string, ...args: any[]) => {
  console.log(`[INFO] ${message}`, ...args);
};

export const logError = (message: string, error: any) => {
  console.error(`[ERROR] ${message}`, error);
};
