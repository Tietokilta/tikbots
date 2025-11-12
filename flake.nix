{
  description = "TiK bots docker container";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = func: nixpkgs.lib.genAttrs systems (system: func nixpkgs.legacyPackages.${system});
    in
    {
      nixosModules = {
        default = self.nixosModules.tikbots;
        tikbots = import ./nixos;
      };

      packages = forAllSystems (pkgs: rec {
        summer-body-bot = pkgs.callPackage ./summer-body-bot.nix { };
        tikbot = pkgs.callPackage ./tikbot.nix { };
        wappupokemonbot = pkgs.callPackage ./wappupokemonbot.nix { };

        summer-body-bot-docker = pkgs.dockerTools.buildLayeredImage {
          name = "summer-body-bot";
          tag = "latest";

          contents = [
            pkgs.dockerTools.caCertificates
          ];

          config.Cmd = [ "${summer-body-bot}/bin/summer-body-bot" ];
        };

        wappupokemonbot-docker = pkgs.dockerTools.buildLayeredImage {
          name = "wappupokemonbot";
          tag = "latest";

          contents = [
            pkgs.dockerTools.caCertificates
          ];

          config.Cmd = [ "${wappupokemonbot}/bin/wappupokemonbot" ];
        };

        tikbot-docker = pkgs.dockerTools.buildLayeredImage {
          name = "tikbot";
          tag = "latest";

          contents = [
            pkgs.dockerTools.caCertificates
          ];

          config.Cmd = [ "${tikbot}/bin/tikbot" ];
        };

        # TODO: perhaps use dockerTools.mergeImages
        docker = pkgs.dockerTools.buildLayeredImage {
          name = "tikbots";
          tag = "latest";

          contents = [
            pkgs.dockerTools.binSh
            pkgs.dockerTools.caCertificates
          ];

          config.Cmd =
            let
              entrypoint = pkgs.writeShellScriptBin "entrypoint.sh" ''
                sh -ac ". /summer-body-bot/env; exec ${summer-body-bot}/bin/summer-body-bot" &
                sh -ac ". /tikbot/env; exec ${tikbot}/bin/tikbot" &
                sh -ac ". /wappupokemonbot/env; exec ${wappupokemonbot}/bin/wappupokemonbot" &
                wait
              '';
            in
            [ "${entrypoint}/bin/entrypoint.sh" ];
        };

        default = docker;
      });
    };
}
