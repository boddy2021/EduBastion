from urllib.parse import urlparse


class Question:
    def __init__(self, text, answer, title="", link=""):
        self.check_link(link)
        self.__text = text
        self.__answer = answer
        self.__title = title
        self.__link = link

    def check_link(self, link):
        if link:
            valid = urlparse(link)
            if not all([valid.scheme, valid.netloc]):
                raise ValueError("Invalid URL")

    @property
    def title(self):
        return self.__title

    @title.setter
    def title(self, value):
        self.__title = value

    @property
    def link(self):
        return self.__link

    @link.setter
    def link(self, value):
        self.__link = value

    @property
    def text(self):
        return self.__text

    @text.setter
    def text(self, value):
        self.__text = value

    @property
    def answer(self):
        return self.__answer

    @answer.setter
    def answer(self, value):
        self.__answer = value

    def return_question(self):
        return {
            "type": self.__class__.__name__,
            "title": self.title,
            "link": self.link if self.link else None,
            "text": self.text,
            "answer": self.answer
        }
