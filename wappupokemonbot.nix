{
  buildNpmPackage,
  importNpmLock,
  makeWrapper,
  nodejs-slim,
}:

buildNpmPackage {
  pname = "wappupokemonbot";
  version = "1.0.0";
  src = ./wappupokemonbot/.;

  nativeBuildInputs = [
    makeWrapper
  ];

  npmDeps = importNpmLock {
    npmRoot = ./wappupokemonbot/.;
  };

  dontBuild = true;

  postInstall = ''
    # The module creates a directory on import... 🤦
    # https://github.com/Naltox/telegram-node-bot/blob/master/lib/api/InputFile.js#L30-L34
    mkdir -p $out/lib/node_modules/wappupokemonbot/node_modules/telegram-node-bot/lib/api/temp/

    makeWrapper ${nodejs-slim}/bin/node $out/bin/wappupokemonbot \
      --add-flags $out/lib/node_modules/wappupokemonbot/bot.js
  '';

  npmConfigHook = importNpmLock.npmConfigHook;

  meta.mainProgram = "wappupokemonbot";
}
