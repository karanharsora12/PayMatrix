import { api } from "./client";
import { getImageUrl } from "@/config/env";

export { getImageUrl };
export const getFileUrl = getImageUrl;

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    if (!res.data?.url) {
      throw new Error("No URL returned from upload");
    }
    
    return getImageUrl(res.data.url);
  },
};
