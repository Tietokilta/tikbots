# varjoISO Pistekortti Bot

Telegram-botti TiK:n orientaatioviikon varjoISO-pistekortin pisteiden seurantaan.
19 tehtävää, botin kautta ISOt merkitsevät tehtäviä suoritetuksi yksityisviestissä,
botti postaa onnitteluviestit (ja kuvat) ryhmään ja tulostaa tulostaulun.

*A Telegram bot for tracking varjoISO scorecard points during TiK's orientation week.*

## Komennot / Commands

- `/start` — rekisteröidy ja valitse kieli / register and choose language
- `/kieli` tai `/language` — vaihda kieli / switch language
- `/suorita` — merkitse tehtävä suoritetuksi / mark a task as completed
- `/peruuta` tai `/cancel` — peru meneillään oleva suoritus / cancel an in-progress completion
- `/tehtavat` tai `/tasks` — näytä kaikki tehtävät / show all tasks
- `/poistasuoritus`, `/poista` tai `/undo` — poista aiemmin merkitty suoritus / remove a previously marked completion
- `/pisteeni` — omat pisteet ja tehtävälista / your points and task list
- `/tulostaulu` — tulostaulu / leaderboard
- `/yksityisyys` tai `/privacy` — kytke ryhmäilmoitukset päälle/pois (oletus: päällä) / toggle group announcements on/off (default: on)
- `/rekisteroiryhma` — (admin, ryhmässä) rekisteröi ryhmä ilmoituskanavaksi / (admin, in-group) register this group as the announcement channel
- `/help` tai `/apua` — ohje / help

## Paikallinen demo / Local demo

1. Luo testibotti @BotFatherilla Telegramissa ja kopioi token.
2. `python3 -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `cp .env.example .env` ja täytä `BOT_TOKEN` (ja oma Telegram-ID `ADMIN_TELEGRAM_IDS`-kenttään, jos haluat testata `/rekisteroiryhma`)
5. `python main.py`
6. Avaa keskustelu botin kanssa Telegramissa ja aja `/start`.

Tietokanta luodaan automaattisesti `data/pistekortti.db` -tiedostoon.

## Palvelimelle asennus / Server deployment

Botti asennetaan NixOS-moduulilla, joka tulee tämän repositorion flakesta:

```nix
services.tikbots.varjoisopistekortti = {
  enable = true;
  # BOT_TOKEN ja ADMIN_TELEGRAM_IDS
  envFile = "/run/secrets/varjoisopistekortti.env";
};
```

Botti käyttää long pollingia, joten ei tarvita julkista URL:ia tai webhook-asetuksia -
sama koodi toimii identtisesti paikallisessa demossa ja palvelimella.

Tietokanta kirjoitetaan oletuksena polkuun `/var/lib/varjoisopistekortti/pistekortti.db`
(systemd `StateDirectory`), joten se säilyy uudelleenkäynnistysten yli. Polun voi
vaihtaa asettamalla `DB_PATH`-muuttujan `env`-optiolla.

## Tehtävien muokkaus / Editing tasks

Tehtävälista on tiedostossa `tasks.py`. Tehtävät synkronoidaan tietokantaan
automaattisesti botin käynnistyessä (avaimen `key` perusteella), joten tekstejä voi
muokata turvallisesti. Uuden tehtävän `key`-arvo pitää olla uniikki eikä sitä pidä
enää muuttaa jälkikäteen, koska suoritukset on sidottu tehtävän tietokanta-ID:hen.
