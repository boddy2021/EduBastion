from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .Controllers import event_controller
import logging
import os
from .config import CORS_ORIGINS, UPLOAD_DIR, AI_DETECTOR_ENABLED, AI_DETECTOR_PRELOAD
from .Controllers import (
    professor_controller,
    student_controller,
    feedback_controller,
    user_controller,
    course_controller,
    class_controller,
    quiz_controller,
    chat_controller,
    proctoring_controller
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

for noisy in ("httpx", "httpcore", "urllib3", "filelock",
              "huggingface_hub.utils._http"):
    logging.getLogger(noisy).setLevel(logging.WARNING)

app = FastAPI(
    title="EduBastion",
    description="An integrated platform for automatic test evaluations and fraud attempts detection.",
    version="1.0.0",
    docs_url="/documentatie",
    redoc_url="/referinta"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.on_event("startup")
def _preload_ai_detector() -> None:
    """Start loading the detection models in the background.

    Non-blocking by design: the API serves traffic immediately, and essay
    answers submitted before the load finishes are simply not scanned.
    """
    if AI_DETECTOR_ENABLED and AI_DETECTOR_PRELOAD:
        from .Services import ai_detector_service
        ai_detector_service.warm_up_async()


@app.get("/", response_class=HTMLResponse)
async def get_root():
    html_content = """
    <html>
        <head>
            <title>EduBastion API</title>
            <style>
                body { font-family: system-ui, sans-serif; margin: 4rem auto;
                       max-width: 34rem; line-height: 1.6; color: #1f2933; }
                a { display: inline-block; margin-right: .75rem; padding: .6rem 1.1rem;
                    background: #2563eb; color: #fff; border-radius: 6px;
                    text-decoration: none; }
                a:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <h1>EduBastion API</h1>
            <p>Automated student assessment and exam fraud detection.</p>
            <a href="/documentatie">Documentation (Swagger)</a>
            <a href="/referinta">Reference (ReDoc)</a>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/health/detector", tags=["Health"])
def detector_status() -> dict:
    """Whether AI text detection is enabled and finished loading."""
    from .Services import ai_detector_service

    ready = ai_detector_service.is_ready()
    return {
        "enabled": AI_DETECTOR_ENABLED,
        "ready": ready,
        "detail": (
            "disabled" if not AI_DETECTOR_ENABLED
            else "ready" if ready
            else "loading models in background; answers are not scanned yet"
        ),
    }


app.include_router(
    professor_controller.router,
    prefix="/api/professor",
    tags=["Professor"]
)

app.include_router(
    student_controller.router,
    prefix="/api/student",
    tags=["Student"]
)

app.include_router(
    feedback_controller.router,
    prefix="/api",
    tags=["Feedback"]
)

app.include_router(
    user_controller.router,
    prefix="/api/users",
    tags=["Users"]
)

app.include_router(
    course_controller.router,
    prefix="/api/courses",
    tags=["Courses"]
)

app.include_router(
    class_controller.
    router, prefix="/api/classes",
    tags=["Classes"]
)

app.include_router(
    quiz_controller.router,
    prefix="/api/quizzes",
    tags=["Quizzes"]
)

app.include_router(
    chat_controller.router,
    prefix="/api/chat",
    tags=["Chat"]
)

app.include_router(
    event_controller.router,
    prefix="/api/events",
    tags=["Events"]
)

app.include_router(
    proctoring_controller.router,
    prefix="/api/proctoring",
    tags=["Proctoring System"]
)
