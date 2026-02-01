#!/usr/bin/env python
# -*- coding: utf-8 -*-
import telegram
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading
from telegram import LinkPreviewOptions
from telegram.ext import Application, CommandHandler
import asyncio
import os
from messages import NEWCOMMENT, NEWTHREAD, NEWCOMMENT_ENG, NEWTHREAD_ENG, NEWYEAR_HISTOTIK, NEWYEAR_HISTOTIK_ENG
import re
import urllib.request
import time

BOTTOKEN = os.environ['TELEGRAM_TOKEN']
bot = telegram.Bot(BOTTOKEN)

CHANNELS_PATH = os.environ['CHANNELS_PATH']
HISTOTIK_STATE_PATH = os.environ.get('HISTOTIK_STATE_PATH', os.path.join(os.path.dirname(CHANNELS_PATH), 'histotik_years.json'))
HISTOTIK_URL = os.environ.get('HISTOTIK_URL', "https://histotik.tietokilta.fi/Vuosi_vuodelta/year_header.html")
HISTOTIK_CHECK_INTERVAL = int(os.environ.get('HISTOTIK_CHECK_INTERVAL',3600))  # Check every hour

def load_known_years():
    """Load the set of known years from state file."""
    try:
        with open(HISTOTIK_STATE_PATH, 'r') as fp:
            return set(json.load(fp))
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

def save_known_years(years):
    """Save the set of known years to state file."""
    with open(HISTOTIK_STATE_PATH, 'w') as fp:
        json.dump(sorted(list(years)), fp)

def fetch_histotik_years():
    """Fetch available years from the histotik website."""
    try:
        req = urllib.request.Request(
            HISTOTIK_URL,
            headers={'User-Agent': 'TikBot/1.0'}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode('utf-8', errors='ignore')

        # Find all year links like href="1984.html", HREF="2021.html"
        year_pattern = re.compile(r'href="(\d{4})\.html"', re.IGNORECASE)
        years = set(year_pattern.findall(html))
        return years
    except Exception as ex:
        print(f"Error fetching histotik years: {type(ex).__name__} {ex}")
        return None

def histotik_monitor():
    """Background thread that monitors histotik for new years."""
    print(f"Starting histotik monitor (checking every {HISTOTIK_CHECK_INTERVAL}s)")

    # Wait for main loop to be ready
    while main_loop is None:
        time.sleep(1)

    while True:
        try:
            known_years = load_known_years()
            current_years = fetch_histotik_years()
            print(known_years,"_:D",current_years)
            if current_years is None:
                # Fetch failed, try again later
                time.sleep(HISTOTIK_CHECK_INTERVAL)
                continue

            # Initialize state if this is first run
            if not known_years:
                print(f"Initializing histotik state with {len(current_years)} years: {sorted(current_years)}")
                save_known_years(current_years)
                time.sleep(HISTOTIK_CHECK_INTERVAL)
                continue

            # Check for new years
            new_years = current_years - known_years
            if new_years:
                print(f"New years detected on histotik: {sorted(new_years)}")
                chats = load_chats()

                for year in sorted(new_years):
                    for c in chats:
                        try:
                            if c == "-1001233179885":
                                asyncio.run_coroutine_threadsafe(
                                    bot.send_message(c, NEWYEAR_HISTOTIK_ENG.format(year), parse_mode="HTML"),
                                    main_loop
                                )
                            else:
                                asyncio.run_coroutine_threadsafe(
                                    bot.send_message(c, NEWYEAR_HISTOTIK.format(year), parse_mode="HTML"),
                                    main_loop
                                )
                        except Exception as ex:
                            print(f"Error sending histotik notification to {c}: {type(ex).__name__} {ex}")

                # Update known years
                known_years.update(new_years)
                save_known_years(known_years)

        except Exception as ex:
            print(f"Error in histotik monitor: {type(ex).__name__} {ex}")

        time.sleep(HISTOTIK_CHECK_INTERVAL)

def load_chats():
    with open(CHANNELS_PATH, 'r') as fp:
        return json.load(fp)

def save_channels(chats):
    with open(CHANNELS_PATH, 'w') as fp:
        chats = list(set(chats))
        json.dump(chats, fp)

async def start(update, context):
    """Send a message when the command /start is issued."""
    chats = load_chats()
    chats.append( str( update.message.chat_id ) )
    save_channels(chats)
    await update.message.reply_text('Chat registered!')

async def help(update, context):
    """Send a message when the command /help is issued."""
    await update.message.reply_text('Help!')

def escape(text):
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

async def tg_bot():
    print("starting bot")
    """Start the bot."""
    application = Application.builder().token(BOTTOKEN).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help))

    # Start the Bot
    await application.initialize()
    await application.start()
    await application.updater.start_polling()

    # Keep running
    import signal
    stop = asyncio.Event()

    def signal_handler(sig, frame):
        stop.set()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    await stop.wait()

    await application.updater.stop()
    await application.stop()
    await application.shutdown()

def http_api():
    server_address = ("0.0.0.0", 4000)
    httpd = HTTPServer(server_address, S)
    print(f"Starting httpd server on 0.0.0.0:4000")
    httpd.serve_forever()

class S(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()


    def _html(self, message):
        """This just generates an HTML document that includes `message`
        in the body. Override, or re-write this do do more interesting stuff.
        """
        content = f"<html><body><h1>{message}</h1></body></html>"
        return content.encode("utf8")  # NOTE: must return a bytes object!

    def do_GET(self):
        self._set_headers()
        self.wfile.write(self._html("hi!"))

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        chats = load_chats()

        save = False
        # Doesn't do anything with posted data
        event = self.headers.get('X-Discourse-Event')
        data = json.loads(self.rfile.read(int(self.headers.get('content-length'))))
        print(event, data)
        nchats = []
        if event == 'post_created' and data['post']['post_number'] == 1:
            data = data['post']
            if data['topic_title'] != "Greetings!" and data['username'] != 'system' and data['topic_archetype'] != 'private_message':
                for c in chats:
                    try:
                        if (c=="-1001233179885"):
                            asyncio.run_coroutine_threadsafe(bot.send_message(c, NEWTHREAD_ENG.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML"), main_loop)
                        else:
                            asyncio.run_coroutine_threadsafe(bot.send_message(c, NEWTHREAD.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML"), main_loop)
                        nchats.append(c)
                    except Exception as ex:
                        print(f"Error sending to {c}: {type(ex).__name__} {ex}")
                        save = True
        elif event == 'post_created':
            data = data['post']
            if data['topic_title'] != "Greetings!" and data['username'] != 'system' and data['topic_archetype'] != 'private_message':
                for c in chats:
                    try:
                        if (c=="-1001233179885"):
                            asyncio.run_coroutine_threadsafe(bot.send_message(c, NEWCOMMENT_ENG.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML", link_preview_options=LinkPreviewOptions(is_disabled=True)), main_loop)
                        else:
                            asyncio.run_coroutine_threadsafe(bot.send_message(c, NEWCOMMENT.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML", link_preview_options=LinkPreviewOptions(is_disabled=True)), main_loop)
                        nchats.append(c)
                    except Exception as ex:
                        print(f"Error sending to {c}: {type(ex).__name__} {ex}")
                        save = True
                chats = nchats
        if save:
            save_channels(chats)
        self._set_headers()
        try:
            # this fails occasionally for whatever reason
            self.wfile.write(self._html("POST!"))
        except Exception as ex:
            print(type(ex).__name__, ex)

main_loop = None

if __name__ == "__main__":
    # Start HTTP server in a separate thread
    http_thread = threading.Thread(target=http_api, daemon=True)
    http_thread.start()
    print("HTTP server started in background thread")

    # Start histotik monitor in a separate thread
    histotik_thread = threading.Thread(target=histotik_monitor, daemon=True)
    histotik_thread.start()
    print("Histotik monitor started in background thread")

    # Run the bot in the main event loop
    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)
    try:
        main_loop.run_until_complete(tg_bot())
    finally:
        main_loop.close()

