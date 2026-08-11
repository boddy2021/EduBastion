from ..Questions.question import Question


class Quiz:
    def __init__(self, title, duration):
        self.__title = title
        self.__questions: list[Question] = []
        self.__duration = duration

    @property
    def title(self):
        return self.__title

    @title.setter
    def title(self, value):
        self.__title = value

    @property
    def questions(self):
        return self.__questions

    @property
    def duration(self):
        return self.__duration

    @duration.setter
    def duration(self, value):
        self.__duration = value

    def add_question(self, question):
        self.__questions.append(question)

    def remove_question(self, question):
        self.__questions.remove(question)

    def return_quiz(self):
        quiz = {
            "title": self.title if self.title else None,
            "duration": self.duration if self.duration else None,
            "questions": []}

        for i, question in enumerate(self.questions):
            quiz["questions"].append({
                "index": i,
                **question.return_question()
            })
        return quiz
