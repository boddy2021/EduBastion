from .question import Question


class LongAnswerQuestion(Question):
    def __init__(self, text, answer, title="", link=""):
        super().__init__(text, answer, title, link)

    def return_question(self):
        return super().return_question()
