STRINGS: dict[str, dict[str, str]] = {
    "welcome": {
        "fi": (
            "Tervetuloa varjoISO-pistekorttibottiin! 🎉\n"
            "Valitse ensin kieli alta."
        ),
        "en": (
            "Welcome to the varjoISO scorecard bot! 🎉\n"
            "Pick a language below to get started."
        ),
    },
    "language_set": {
        "fi": "Kieli asetettu suomeksi. Käytä /suorita merkitäksesi tehtäviä suoritetuksi.",
        "en": "Language set to English. Use /suorita to mark tasks as completed.",
    },
    "choose_task": {
        "fi": "📋 *Valitse suoritettu tehtävä*",
        "en": "📋 *Choose the task you completed*",
    },
    "no_tasks_left": {
        "fi": "Olet suorittanut kaikki kertaluontoiset tehtävät! Voit yhä suorittaa toistettavan tehtävän uudelleen.",
        "en": "You've completed all one-time tasks! You can still redo the repeatable task.",
    },
    "ask_photo": {
        "fi": "Liitä kuva suorituksesta?",
        "en": "Attach a photo of the completion?",
    },
    "photo_yes": {"fi": "📷 Kyllä", "en": "📷 Yes"},
    "photo_no": {"fi": "⏭ Ei", "en": "⏭ Skip"},
    "send_photo_now": {
        "fi": "Lähetä kuva nyt. (Voit perua komennolla /peruuta)",
        "en": "Send the photo now. (You can cancel with /peruuta)",
    },
    "already_done": {
        "fi": "Olet jo suorittanut tämän tehtävän.",
        "en": "You've already completed this task.",
    },
    "completion_confirmed": {
        "fi": "✅ Merkitty suoritetuksi: \"{task}\"\nPisteesi yhteensä: {points}",
        "en": "✅ Marked as completed: \"{task}\"\nYour total points: {points}",
    },
    "group_announcement": {
        "fi": "🎉 {name} suoritti: \"{task}\" (+1 p)",
        "en": "🎉 {name} completed: \"{task}\" (+1 pt)",
    },
    "my_points_header": {
        "fi": "Tehtäviä suoritettu: {done}/{max_points} — Pisteitä yhteensä: {points}",
        "en": "Tasks completed: {done}/{max_points} — Total points: {points}",
    },
    "done_marker": {"fi": "✅", "en": "✅"},
    "todo_marker": {"fi": "⬜", "en": "⬜"},
    "leaderboard_header": {
        "fi": "🏆 varjoISO-tulostaulu 🏆",
        "en": "🏆 varjoISO leaderboard 🏆",
    },
    "leaderboard_empty": {
        "fi": "Kukaan ei ole vielä suorittanut yhtään tehtävää.",
        "en": "No one has completed any tasks yet.",
    },
    "group_registered": {
        "fi": "Tämä ryhmä on nyt rekisteröity varjoISO-pistekortin ilmoituskanavaksi.",
        "en": "This group is now registered as the varjoISO scorecard announcement channel.",
    },
    "group_only": {
        "fi": "Tämä komento toimii vain ryhmässä.",
        "en": "This command only works in a group.",
    },
    "not_admin": {
        "fi": "Sinulla ei ole oikeuksia tähän komentoon.",
        "en": "You don't have permission to run this command.",
    },
    "no_group_registered": {
        "fi": "Ryhmää ei ole vielä rekisteröity. Aja /rekisteroiryhma ryhmässä.",
        "en": "No group has been registered yet. Run /rekisteroiryhma in the group.",
    },
    "language_prompt": {
        "fi": "Valitse kieli / Choose language:",
        "en": "Valitse kieli / Choose language:",
    },
    "cancel_button": {"fi": "❌ Peruuta", "en": "❌ Cancel"},
    "cancelled": {
        "fi": "Peruttu, ei muutoksia.",
        "en": "Cancelled, no changes made.",
    },
    "nothing_to_cancel": {
        "fi": "Ei ole mitään meneillään olevaa suoritusta peruttavaksi.",
        "en": "There's no ongoing completion to cancel.",
    },
    "already_done_toast": {
        "fi": "✅ Tämä on jo suoritettu.",
        "en": "✅ You've already completed this one.",
    },
    "choose_remove": {
        "fi": "🗑 *Valitse poistettava suoritus*",
        "en": "🗑 *Choose a completion to remove*",
    },
    "no_completions_to_remove": {
        "fi": "Sinulla ei ole yhtään suoritusta poistettavaksi.",
        "en": "You don't have any completions to remove.",
    },
    "confirm_remove": {
        "fi": "Poistetaanko suoritus?\n\n_{task}_",
        "en": "Remove this completion?\n\n_{task}_",
    },
    "remove_yes": {"fi": "🗑 Kyllä, poista", "en": "🗑 Yes, remove"},
    "remove_confirmed": {
        "fi": "🗑 Poistettu: \"{task}\"\nPisteesi yhteensä: {points}",
        "en": "🗑 Removed: \"{task}\"\nYour total points: {points}",
    },
    "nothing_to_remove": {
        "fi": "Tätä ei enää löytynyt poistettavaksi (ehkä jo poistettu).",
        "en": "This could no longer be found to remove (maybe already removed).",
    },
    "privacy_intro": {
        "fi": (
            "🔔 *Suoritusten julkaisu ryhmään*\n\n"
            "Nykyinen asetus: {status}\n\n"
            "Kun tämä on päällä, botti postaa ryhmään onnittelun (ja kuvan) "
            "aina kun merkitset tehtävän suoritetuksi. Voit halutessasi kytkeä "
            "tämän pois, jolloin suorituksesi kirjautuvat pisteisiin ja "
            "tulostauluun ihan normaalisti, mutta niistä ei postata ryhmään."
        ),
        "en": (
            "🔔 *Announcing completions to the group*\n\n"
            "Current setting: {status}\n\n"
            "When this is on, the bot posts a celebration (and photo) to the "
            "group every time you mark a task as completed. You can turn "
            "this off — your completions still count toward your points and "
            "the leaderboard, they just won't be posted to the group."
        ),
    },
    "privacy_status_on": {"fi": "🔔 Päällä (julkinen)", "en": "🔔 On (public)"},
    "privacy_status_off": {"fi": "🔕 Pois päältä (yksityinen)", "en": "🔕 Off (private)"},
    "privacy_button_on": {"fi": "🔔 Julkaise ryhmään", "en": "🔔 Announce to group"},
    "privacy_button_off": {"fi": "🔕 Älä julkaise (yksityinen)", "en": "🔕 Don't announce (private)"},
    "privacy_set_on": {
        "fi": "🔔 Suoritukset julkaistaan taas ryhmään.",
        "en": "🔔 Completions will be announced to the group again.",
    },
    "privacy_set_off": {
        "fi": "🔕 Suorituksiasi ei enää julkaista ryhmään. Pisteet kirjautuvat silti normaalisti.",
        "en": "🔕 Your completions will no longer be announced to the group. Points still count normally.",
    },
    "tasks_list_header": {
        "fi": "🎉 *varjoISO-pistekortti* 🎉\n_{done}/{total} tehtävää suoritettu — pisteitä yhteensä {points}_",
        "en": "🎉 *varjoISO Scorecard* 🎉\n_{done}/{total} tasks completed — total points {points}_",
    },
    "repeatable_note": {
        "fi": "🔁 = voit suorittaa useita kertoja",
        "en": "🔁 = can be completed multiple times",
    },
    "help_text": {
        "fi": (
            "🎉 *varjoISO-pistekortti* 🎉\n"
            "Kerää pisteitä suorittamalla hauskoja tehtäviä orientaatioviikolla "
            "ja kilpaile muiden ISOjen kanssa siitä, kuka kerää eniten!\n\n"

            "*✅ Tehtävän suorittaminen*\n"
            "Kun teet jonkin tehtävän, kirjaa se botille komennolla /suorita. "
            "Valitse listasta tehtävä, ja voit halutessasi liittää kuvan "
            "todisteeksi — botti postaa sen ryhmään kaikkien iloksi! Jos "
            "valitsit väärän tehtävän, /peruuta perii koko toiminnon.\n\n"

            "*📋 Tehtävälistan katsominen*\n"
            "/tehtavat näyttää kaikki 19 tehtävää ja sen, mitkä olet jo "
            "suorittanut. 🔁-merkityn tehtävän voi suorittaa useita kertoja.\n\n"

            "*🗑 Virheen korjaaminen*\n"
            "Merkkasitko jotain vahingossa? /poistasuoritus näyttää "
            "suorittamasi tehtävät — valitse poistettava ja vahvista.\n\n"

            "*🏆 Pisteet ja tulostaulu*\n"
            "/pisteeni näyttää omat pisteesi ja tehtävälistan. "
            "/tulostaulu näyttää kaikkien ISOjen pisteet rinnakkain.\n\n"

            "*⚙️ Asetukset*\n"
            "/kieli vaihtaa botin kielen suomen ja englannin välillä. "
            "/yksityisyys päättää, postaako botti ryhmään aina kun saat "
            "pisteen (oletuksena päällä) — voit halutessasi kytkeä tämän "
            "pois, jolloin pisteesi kirjautuvat silti normaalisti.\n\n"

            "Jos olet ryhmän ISO-vastaava ja botti pitää liittää ryhmään, "
            "kysy ohjeet ylläpitäjältä."
        ),
        "en": (
            "🎉 *varjoISO Scorecard* 🎉\n"
            "Earn points by completing fun tasks during orientation week "
            "and compete with the other ISOs for the top spot!\n\n"

            "*✅ Marking a task done*\n"
            "Whenever you complete a task, log it with /suorita. Pick the "
            "task from the list, and optionally attach a photo as proof — "
            "the bot will post it to the group for everyone to enjoy! Picked "
            "the wrong one? /peruuta cancels the whole thing.\n\n"

            "*📋 Viewing the task list*\n"
            "/tehtavat shows all 19 tasks and which ones you've already "
            "completed. A task marked 🔁 can be completed more than once.\n\n"

            "*🗑 Fixing a mistake*\n"
            "Marked something by accident? /poistasuoritus shows what "
            "you've completed — pick the one to remove and confirm.\n\n"

            "*🏆 Points and leaderboard*\n"
            "/pisteeni shows your own points and task list. /tulostaulu "
            "shows everyone's points side by side.\n\n"

            "*⚙️ Settings*\n"
            "/kieli switches the bot's language between Finnish and "
            "English. /yksityisyys controls whether the bot posts to the "
            "group whenever you earn a point (on by default) — you can "
            "turn this off and your points will still count normally.\n\n"

            "If you're the group's ISO lead and need to connect the bot "
            "to your group, ask your admin for setup instructions."
        ),
    },
}


def t(key: str, lang: str, **kwargs) -> str:
    lang = lang if lang in ("fi", "en") else "fi"
    text = STRINGS[key][lang]
    return text.format(**kwargs) if kwargs else text
