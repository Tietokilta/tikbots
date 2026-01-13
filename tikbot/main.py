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
from messages import NEWCOMMENT, NEWTHREAD, NEWCOMMENT_ENG, NEWTHREAD_ENG

BOTTOKEN = os.environ['TELEGRAM_TOKEN']
bot = telegram.Bot(BOTTOKEN)

CHANNELS_PATH = os.environ['CHANNELS_PATH']

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

    # Run the bot in the main event loop
    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)
    try:
        main_loop.run_until_complete(tg_bot())
    finally:
        main_loop.close()

