from .question import Question


class CheckBoxQuestion(Question):
    def __init__(self, text, answer, choices, title="", link=""):
        try:
            assert isinstance(answer, list)
        except AssertionError:
            raise ValueError("Answers must be a list")

        super().__init__(text, answer, title, link)
        self.__choices = choices

    @property
    def choices(self):
        return self.__choices

    @choices.setter
    def choices(self, value):
        self.__choices = value

    def return_question(self):
        question = super().return_question()
        question["choices"] = self.choices
        return question
