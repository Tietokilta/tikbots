{
  description = "TiK bots docker container";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = rec {
          summer-body-bot = pkgs.callPackage ./summer-body-bot.nix { };
          tikbot = pkgs.callPackage ./tikbot.nix { };
          wappupokemonbot = pkgs.callPackage ./wappupokemonbot.nix { };

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

          #docker =
          #  (nixpkgs.lib.nixosSystem {
          #    modules = [
          #      {
          #        _module.args = {
          #          inherit summer-body-bot tikbot wappupokemonbot;
          #        };
          #      }
          #      "${nixpkgs}/nixos/modules/virtualisation/docker-image.nix"
          #      "${nixpkgs}/nixos/modules/installer/cd-dvd/channel.nix"
          #      ./configuration.nix
          #    ];
          #  }).config.system.build.tarball;
        };
      }
    );
}
