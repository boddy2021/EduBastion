import re


SUSPICIOUS_KEYWORDS = [

    "google", "chatgpt", "chat gpt", "gemini", "copilot", "wikipedia",
    "siri", "alexa", "cortana", "telefon", "laptop", "ecran", "microfon",


    "ajută-mă", "caută", "răspunsul", "ce zici", "cum e", "spune-mi",
    "scrie", "citește", "soluția", "zi-mi", "șoptește", "cum se face",
    "trimite-mi", "vezi pe", "rezolvarea", "dictează", "dă-mi mesaj",


    "help me", "search", "answer", "what is", "tell me", "read it",
    "write it", "solution", "whisper", "how to", "send me", "look up",
    "dictate", "copy", "phone", "mobile", "text me", "cheat",


    "aide-moi", "cherche", "réponse", "c'est quoi", "dis-moi", "écris",
    "lis", "solution", "tricher", "chuchote", "envoie-moi", "regarde sur",
    "téléphone", "portable", "comment on fait", "dicte",


    "ayúdame", "busca", "respuesta", "qué es", "dime", "escribe",
    "lee", "solución", "copiar", "susurra", "móvil", "celular",
    "envíame", "mira en", "cómo se hace", "pásame", "díctame",


    "aiutami", "cerca", "risposta", "cos'è", "dimmi", "scrivi",
    "leggi", "soluzione", "copiare", "suggerisci", "cellulare",
    "mandami", "guarda su", "come si fa", "passami", "dettami",


    "hilf mir", "suche", "antwort", "was ist", "sag mir", "schreib",
    "lies", "lösung", "spicken", "flüster", "handy", "schick mir",
    "schau auf", "wie macht man", "diktiere",


    "ajuda-me", "me ajuda", "pesquisa", "resposta", "o que é", "me diz",
    "escreve", "lê", "solução", "colar", "sussurra", "celular", "telemóvel",
    "manda-me", "olha no", "como faz", "dita pra mim"
]


def analyze_transcript_for_cheating(transcript: str, quiz_questions: list) -> dict:

    if not transcript or len(transcript.strip()) < 10:
        return {"has_cheated": False, "penalty_points": 0, "details": []}

    transcript_lower = transcript.lower()
    penalty = 0
    reasons = []

    found_keywords = [
        kw for kw in SUSPICIOUS_KEYWORDS if kw in transcript_lower]

    if found_keywords:
        calculated_penalty = min(40, 15 + (len(found_keywords) - 1) * 5)
        penalty += calculated_penalty

        unique_keywords = list(set(found_keywords))
        reasons.append(
            f"Has used forbidden words during the test: {', '.join(unique_keywords)}")

    read_questions_count = 0
    for q in quiz_questions:
        q_text = q.get("text", "").lower()

        q_clean = re.sub(r'[^\w\s]', '', q_text)

        words = q_clean.split()
        if len(words) >= 4:
            snippet = " ".join(words[:5])
            if snippet in transcript_lower:
                read_questions_count += 1

    if read_questions_count > 0:
        penalty += 15
        reasons.append(
            f"Has read {read_questions_count} question{'s' if read_questions_count != 1 else ''} aloud (possible communication with the outside).")

    has_cheated = penalty > 0

    return {
        "has_cheated": has_cheated,
        "penalty_points": penalty,
        "details": reasons
    }
