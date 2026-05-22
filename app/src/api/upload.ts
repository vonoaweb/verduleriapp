import api from './client';

export const uploadApi = {
  image(file: File): Promise<{ url: string; path: string }> {
    return api.upload('/upload/image', file, 'image');
  },

  deleteImage(path: string): Promise<{ message: string }> {
    return api.delete(`/upload/image`);
  },
};
