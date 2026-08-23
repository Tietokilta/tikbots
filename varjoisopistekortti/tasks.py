from dataclasses import dataclass


@dataclass(frozen=True)
class Task:
    key: str
    text_fi: str
    text_en: str
    repeatable: bool = False


TASKS: list[Task] = [
    Task(
        "hymni",
        "Laula hymni, joka päivä orientaatioviikolla",
        "Sing the anthem every day of orientation week",
    ),
    Task(
        "fuksikapteeni_lupa",
        "Kysy fuksikapteenilta lupaa avata juoma",
        "Ask the fuksikapteeni for permission to open a drink",
    ),
    Task(
        "nimikirjoitukset",
        "Kerää viiden ei-TiKin ISOn nimikirjoitus käteesi",
        "Collect the signatures of five non-TiK ISOs on your arm",
    ),
    Task(
        "iso_vastaava_lapset",
        "Kysy ISO-vastaavalta, miten lapsia tehdään",
        "Ask the ISO-vastaava how babies are made",
    ),
    Task(
        "kellotuskilpailu",
        "Voita kellotuskilpailu",
        "Win the kellotuskilpailu (timing competition)",
    ),
    Task(
        "welhotutkinto",
        "Suorita akateeminen welhotutkinto",
        "Complete the academic welhotutkinto",
    ),
    Task(
        "uusi_toimikunta",
        "Keksi uusi toimikunta ja pitchaa se hallituslaiselle",
        "Invent a new toimikunta and pitch it to a board member",
    ),
    Task(
        "kaksi_kokousta",
        "Osallistu kahteen erilaiseen kokoukseen (esim. gokous, vokous...)",
        "Attend two different kinds of meetings (e.g. gokous, vokous...)",
    ),
    Task(
        "ie_juoma",
        "Tarjoa IE-juoma vastuuISOlle",
        "Offer an IE drink to the vastuuISO",
        repeatable=True,
    ),
    Task(
        "shanghai_valot",
        "Opeta Shanghain valot -tanssi fukseille",
        "Teach the freshmen the Shanghai valot dance",
    ),
    Task(
        "vedä_perseet",
        "Vedä perseet torstaina",
        "Vedä perseet (go all out) on Thursday",
    ),
    Task(
        "selfie_fuksikapteenit",
        "Ota selfie ei-TiKin fuksikapteenien kanssa",
        "Take a selfie with non-TiK fuksikapteenis",
    ),
    Task(
        "kv_kippari",
        "Kysy kv-kipparilta mitä tehdä, jos olen kadottanut fuksin rallienglanniksi",
        "Ask the kv-kippari in rally English what to do if you've lost a freshman",
    ),
    Task(
        "haasta_fuksi",
        "Haasta fuksi pelissä (beer pongissa yms.)",
        "Challenge a freshman to a game (beer pong etc.)",
    ),
    Task(
        "kymmenen_juomaa",
        "Maista orientaatioviikon aikana kymmentä eri juomaa",
        "Taste ten different drinks during orientation week",
    ),
    Task(
        "karaoke",
        "Laula karaokea randomin kanssa",
        "Sing karaoke with a random person",
    ),
    Task(
        "slangitermi",
        "Opeta fukseille Otaniemi-slangitermi jota ei ole olemassa",
        "Teach the freshmen an Otaniemi slang term that doesn't exist",
    ),
    Task(
        "korttipeli",
        "Pelaa jotain juomapeliä korteilla",
        "Play a drinking game with cards",
    ),
    Task(
        "meemi_noora",
        "Näytä Nooralle meemi",
        "Show Noora a meme",
    ),
]

TASKS_BY_KEY: dict[str, Task] = {task.key: task for task in TASKS}
