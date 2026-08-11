class Feedback:
    def __init__(self, title: str, feedback_text: str, rating: int):
        self.__title = title
        self.__feedback_text = feedback_text
        self.__rating = rating

    @property
    def feedback_text(self):
        return self.__feedback_text

    @feedback_text.setter
    def feedback_text(self, value: str):
        self.__feedback_text = value

    @property
    def title(self):
        return self.__title

    @title.setter
    def title(self, value: str):
        self.__title = value

    @property
    def rating(self):
        return self.__rating

    @rating.setter
    def rating(self, value: int):
        self.__rating = value

    def return_feedback(self):
        return {
            "title": self.title,
            "feedback_text": self.feedback_text,
            "rating": self.rating
        }
