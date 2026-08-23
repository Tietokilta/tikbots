{
  pkgs,
  lib,
  config,
  options,
  ...
}:
let
  cfg = config.services.tikbots.varjoisopistekortti;
  inherit (lib)
    mkEnableOption
    mkIf
    mkOption
    types
    ;
in
{
  options.services.tikbots.varjoisopistekortti = {
    enable = mkEnableOption "varjoisopistekortti";
    package = mkOption {
      description = "The package to use for varjoisopistekortti";
      type = types.package;
      default = pkgs.callPackage ../varjoisopistekortti.nix { };
    };
    user = mkOption {
      description = "The user account to run the bot under";
      type = types.str;
      default = "varjoisopistekortti";
    };

    envFile = mkOption {
      description = ''
        File containing environment variables to be set for the bot.

        This option should be used to set environment variables
        that should stay a secret, and `env` for variables
        that are ok to be public.
      '';
      type = with types; nullOr path;
      default = null;
    };

    env = mkOption {
      description = ''
        Attribute set of environment variables to be set for the bot.

        Do not set secret variables using this option, as they will be
        public.
      '';
      inherit (options.environment.variables) type apply;
      default = { };
    };
  };

  config = mkIf cfg.enable {
    systemd.services.varjoisopistekortti = {
      enable = true;
      wantedBy = [ "multi-user.target" ];
      environment = {
        DB_PATH = "/var/lib/varjoisopistekortti/pistekortti.db";
      }
      // cfg.env;

      serviceConfig = {
        EnvironmentFile = mkIf (cfg.envFile != null) cfg.envFile;
        Type = "simple";
        ExecStart = lib.getExe cfg.package;
        User = cfg.user;
        Group = cfg.user;
        Restart = "on-failure";
        RestartSec = "5";
        StateDirectory = "varjoisopistekortti";
      };
    };

    users = {
      users.${cfg.user} = {
        group = cfg.user;
        isSystemUser = true;
      };
      groups.${cfg.user} = { };
    };
  };
}
