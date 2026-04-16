from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status

from app.api.deps import require_roles
from app.schemas.upload import EventFeaturedImageUploadResponse, ImageVariantResponse
from app.services.image_service import ImageService

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post(
    "/events/featured-image",
    response_model=EventFeaturedImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_event_featured_image(
    request: Request,
    file: UploadFile = File(...),
    alt_text: str | None = Form(default=None),
    _: set[str] = Depends(require_roles("organizer", "admin")),
) -> EventFeaturedImageUploadResponse:
    service = ImageService()
    result = service.optimize_event_featured_image(upload_file=file, alt_text=alt_text)
    base_url = str(request.base_url).rstrip("/")

    def _absolute(url: str) -> str:
        return f"{base_url}{url}"

    variants = [
        ImageVariantResponse(
            label=item["label"],
            url=_absolute(item["url"]),
            width=item["width"],
            height=item["height"],
            format=item["format"],
        )
        for item in result["variants"]
    ]

    return EventFeaturedImageUploadResponse(
        original_width=result["original_width"],
        original_height=result["original_height"],
        alt_text=result["alt_text"],
        variants=variants,
        featured_image_sm_url=_absolute(result["featured_image_sm_url"]),
        featured_image_md_url=_absolute(result["featured_image_md_url"]),
        featured_image_lg_url=_absolute(result["featured_image_lg_url"]),
    )
