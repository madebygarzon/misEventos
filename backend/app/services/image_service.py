from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
EVENT_FEATURED_VARIANTS: list[tuple[str, int]] = [("sm", 480), ("md", 768), ("lg", 1280)]


class ImageService:
    def __init__(self) -> None:
        self.max_size_bytes = settings.image_upload_max_size_mb * 1024 * 1024
        self.events_dir = Path(settings.media_root) / "events"
        self.events_dir.mkdir(parents=True, exist_ok=True)

    def _resize_to_width(self, image: Image.Image, target_width: int) -> Image.Image:
        if image.width <= target_width:
            return image.copy()
        ratio = target_width / image.width
        target_height = int(image.height * ratio)
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    def optimize_event_featured_image(self, upload_file: UploadFile, alt_text: str | None = None) -> dict:
        if upload_file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported image format. Use JPEG, PNG or WebP.",
            )

        raw = upload_file.file.read()
        if not raw:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image file.")
        if len(raw) > self.max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image exceeds {settings.image_upload_max_size_mb} MB.",
            )

        try:
            original = Image.open(BytesIO(raw))
            original = ImageOps.exif_transpose(original)
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file.") from exc

        if original.mode not in {"RGB", "RGBA"}:
            original = original.convert("RGB")

        variants: list[dict] = []
        urls_by_label: dict[str, str] = {}

        for label, width in EVENT_FEATURED_VARIANTS:
            resized = self._resize_to_width(original, width)
            filename = f"{uuid4().hex}_{label}_{resized.width}w.webp"
            output_path = self.events_dir / filename
            resized.save(output_path, format="WEBP", quality=82, method=6)
            relative_url = f"{settings.media_url_prefix}/events/{filename}"

            variants.append(
                {
                    "label": label,
                    "url": relative_url,
                    "width": resized.width,
                    "height": resized.height,
                    "format": "webp",
                }
            )
            urls_by_label[label] = relative_url

        return {
            "original_width": original.width,
            "original_height": original.height,
            "alt_text": alt_text.strip() if alt_text else None,
            "variants": variants,
            "featured_image_sm_url": urls_by_label["sm"],
            "featured_image_md_url": urls_by_label["md"],
            "featured_image_lg_url": urls_by_label["lg"],
        }
