{
  summer-body-bot,
  tikbot,
  wappupokemonbot,
  lib,
  ...
}:
{
  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";

  # Disable systemd-resolved to avoid assertion failure in containers
  services.resolved.enable = false;

  # Provide a default resolv.conf (e.g. Google DNS)
  environment.etc."resolv.conf".text = ''
    nameserver 8.8.8.8
    nameserver 1.1.1.1
  '';

  systemd.services.summer-body-bot = {
    enable = true;
    serviceConfig = {
      ExecStart = "${summer-body-bot}/bin/summer-body-bot";
      EnvironmentFile = "/share/summer-body-bot/env";
    };
  };

  systemd.services.tikbot = {
    enable = true;
    serviceConfig = {
      ExecStart = "${tikbot}/bin/tikbot";
      EnvFile = "/share/tikbot/env";
    };

    environment.CHANNELS_PATH = "/share/tikbot/channels.json";
  };

  systemd.services.wappupokemonbot = {
    enable = true;
    serviceConfig = {
      ExecStart = "${wappupokemonbot}/bin/wappupokemonbot";
      EnvFile = "/share/wappupokemonbot/env";
    };
  };
}
