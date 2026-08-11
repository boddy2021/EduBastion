from .question import Question


class TrueFalseQuestion(Question):
    def __init__(self, text, answer: bool, title="", link=""):
        try:
            assert isinstance(answer, bool)
        except AssertionError:
            raise ValueError("Answer must be a boolean value (True or False).")

        super().__init__(text, answer, title, link)
        self.__choices = ["True", "False"]

    @property
    def choices(self):
        return self.__choices

    def return_question(self):
        question = super().return_question()
        question["choices"] = self.choices
        return question
