export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(url);
};


