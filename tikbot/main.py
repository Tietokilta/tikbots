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

def start(update, context):
    """Send a message when the command /start is issued."""
    chats = load_chats()
    chats.append( str( update.message.chat_id ) )
    save_channels(chats)
    update.message.reply_text('Chat registered!')

def help(update, context):
    """Send a message when the command /help is issued."""
    update.message.reply_text('Help!')

def escape(text):
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

def tg_bot():
    print("starting bot")
    """Start the bot."""
    application = Application.builder().token(BOTTOKEN).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help))

    # Start the Bot
    application.run_polling()

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
        loop = asyncio.get_event_loop()
        if event == 'post_created' and data['post']['post_number'] == 1:
            data = data['post']
            if data['topic_title'] != "Greetings!" and data['username'] != 'system' and data['topic_archetype'] != 'private_message':
                for c in chats:
                    try:
                        if (c=="-1001233179885"):
                            loop.run_until_complete(bot.send_message(c, NEWTHREAD_ENG.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML"))
                        else:
                            loop.run_until_complete(bot.send_message(c, NEWTHREAD.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML" ))
                        nchats.append(c)
                    except:
                        save = True
        elif event == 'post_created':
            data = data['post']
            if data['topic_title'] != "Greetings!" and data['username'] != 'system' and data['topic_archetype'] != 'private_message':
                for c in chats:
                    try:
                        if (c=="-1001233179885"):
                            loop.run_until_complete(bot.send_message(c, NEWCOMMENT_ENG.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML", link_preview_options=LinkPreviewOptions(is_disabled=True)))
                        else:
                            loop.run_until_complete(bot.send_message(c, NEWCOMMENT.format(escape(data['topic_title']), escape(data['topic_slug']), data['topic_id']), parse_mode="HTML", link_preview_options=LinkPreviewOptions(is_disabled=True)))
                        nchats.append(c)
                    except:
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

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.create_task(http_api())
    loop.run_until_complete(tg_bot())
    loop.run_forever()

