{
  pkgs,
  config,
  lib,
  options,
  ...
}:
let
  cfg = config.services.tikbots.summer-body-bot;
  inherit (lib)
    mkEnableOption
    mkIf
    mkOption
    types
    ;
in
{
  options.services.tikbots.summer-body-bot = {
    enable = mkEnableOption "summer-body-bot";
    package = mkOption {
      description = "The package to use for summer-body-bot";
      type = with types; nullOr package;
      default = pkgs.callPackage ../summer-body-bot.nix { };
    };
    user = mkOption {
      description = "The user account to run the bot under";
      type = types.str;
      default = "summer-body-bot";
    };

    useLocalPostgres = mkOption {
      description = ''
        Whether to create and use a local Postgresql database.
        If this option is set to true, do not set an environment
        variable for `DATABASE_URL`, if this is set to false, set
        the `DATABASE_URL` manually.
      '';
      type = types.bool;
      default = true;
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
    systemd.services.summer-body-bot = {
      enable = true;
      wantedBy = [ "multi-user.target" ];
      after = mkIf (cfg.useLocalPostgres) [
        "postgresql.service"
      ];

      environment =
        cfg.env
        // (lib.optionalAttrs (cfg.useLocalPostgres) {
          # DATABASE_URL = "postgresql://localhost:${toString config.services.postgresql.settings.port}/${cfg.user}";
          POSTGRES_USER = cfg.user;
          POSTGRES_DB = cfg.user;
          POSTGRES_HOST = "/run/postgresql";
          POSTGRES_PASSWORD = "";
        });

      serviceConfig = {
        EnvironmentFile = mkIf (cfg.envFile != null) cfg.envFile;
        Type = "simple";
        ExecStart = lib.getExe cfg.package;
        User = cfg.user;
        Group = cfg.user;
        Restart = "on-failure";
        RestartSec = "5";
      };
    };

    services.postgresql = lib.mkIf cfg.useLocalPostgres {
      enable = true;
      ensureDatabases = [ cfg.user ];
      ensureUsers = [
        {
          name = cfg.user;
          ensureDBOwnership = true;
        }
      ];
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
