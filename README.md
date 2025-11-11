# TiK bots

This repository contains a set of telegram bots and 

## Building

```sh
nix build
```

## Running

```sh
docker load -i result
docker run -v summer-body-bot.env:/summer-body-bot/env tikbot.env:/tikbot/env wappupokemonbot.env:/wappupokemonbot/env -it tikbots:latest
```

## NixOS
The flake exposes the NixOS module `tikbots` (also `default`) that can be used to set up the bots to run on a NixOS machine.
