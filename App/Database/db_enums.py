import enum


class UserRole(enum.Enum):
    student = "student"
    professor = "professor"
    admin = "admin"


class UserSex(enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class ContentType(enum.Enum):
    text = "text"
    video = "video"
    pdf = "pdf"
    quiz = "quiz"


class QuizStatus(enum.Enum):
    started = "started"
    finished = "finished"
    graded = "graded"


class ProctoringEvent(enum.Enum):
    tab_switch = "tab_switch"
    full_screen_exit = "full_screen_exit"
    person_missing = "person_missing"
    multiple_faces = "multiple_faces"
    background_noise = "background_noise"
