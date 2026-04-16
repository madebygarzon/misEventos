import { api } from "./client";

export type FeaturedImageUploadResponse = {
  original_width: number;
  original_height: number;
  alt_text?: string | null;
  variants: Array<{
    label: "sm" | "md" | "lg";
    url: string;
    width: number;
    height: number;
    format: "webp";
  }>;
  featured_image_sm_url: string;
  featured_image_md_url: string;
  featured_image_lg_url: string;
};

export const uploadEventFeaturedImageRequest = async (
  file: File,
  altText?: string
): Promise<FeaturedImageUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (altText?.trim()) {
    formData.append("alt_text", altText.trim());
  }
  const { data } = await api.post<FeaturedImageUploadResponse>("/uploads/events/featured-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data;
};
