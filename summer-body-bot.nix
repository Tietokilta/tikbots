{
  buildNpmPackage,
  importNpmLock,
  makeWrapper,
  nodejs-slim,
}:

buildNpmPackage {
  pname = "summer-body-bot";
  version = "1.0.0";
  src = ./summer-body-bot/.;

  nativeBuildInputs = [
    makeWrapper
  ];

  npmDeps = importNpmLock {
    npmRoot = ./summer-body-bot/.;
  };

  dontBuild = true;

  postInstall = ''
    makeWrapper ${nodejs-slim}/bin/node $out/bin/summer-body-bot \
      --add-flags $out/lib/node_modules/summer-body-bot/index.js
  '';

  npmConfigHook = importNpmLock.npmConfigHook;
}
