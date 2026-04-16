from pydantic import BaseModel


class ImageVariantResponse(BaseModel):
    label: str
    url: str
    width: int
    height: int
    format: str = "webp"


class EventFeaturedImageUploadResponse(BaseModel):
    original_width: int
    original_height: int
    alt_text: str | None = None
    variants: list[ImageVariantResponse]
    featured_image_sm_url: str
    featured_image_md_url: str
    featured_image_lg_url: str
