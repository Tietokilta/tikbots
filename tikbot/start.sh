#!/bin/bash -e
source /home/visa/clones/tikbot/.venv/bin/activate
python3 -m pip install -r /home/visa/clones/tikbot/requirements.txt
python3 /home/visa/clones/tikbot/main.py
