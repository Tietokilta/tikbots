{
  lib,
  stdenvNoCC,
  bun,
  fetchFromGitHub,
  importNpmLock,
  makeWrapper,
}:
let
  version = "1.0.0";
  src = fetchFromGitHub {
    owner = "AJBogo9";
    repo = "activity-challenge-bot";
    rev = "e55e4eb2ac6a031b11cb9f26b24e3cc734178c44";
    hash = "sha256-ZIlu9aIkPiex+1ijijVJ/v4RD8kXil3XgYD39VuU1dg=";
  };
  node_modules = stdenvNoCC.mkDerivation (finalAttrs: {
    pname = "node_modules";
    inherit src version;

    impureEnvVars = lib.fetchers.proxyImpureEnvVars ++ [
      "GIT_PROXY_COMMAND"
      "SOCKS_SERVER"
    ];

    patches = [
      ./test.patch
    ];

    nativeBuildInputs = [ bun ];
    dontConfigure = true;
    buildPhase = ''
      bun install \
        --force \
        --frozen-lockfile \
        --ignore-scripts \
        --no-progress \
        --production \
        --no-cache
    '';
    installPhase = ''
      mkdir -p $out/node_modules

      rm -r ./node_modules/.cache
      cp -R ./node_modules $out
    '';
    outputHash = "sha256-miQkuWQwFjoEvR4Ybgy0S1bV6fJnU6eI74uCw7b2m/Q=";
    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
  });
in
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "summer-body-bot";
  inherit src version;

  # patches = [
  #     ./test.patch
  #   ];
  # postPatch = ''
  #   substituteInPlace src/config/index.ts \
  #     --replace-fail "DATABASE_URL: z.string().url('Invalid DATABASE_URL')," ""
  # '';

  nativeBuildInputs = [
    makeWrapper
  ];
  dontBuild = true;


  installPhase = ''
    runHook preInstall

    mkdir $out
    ln -s ${node_modules}/node_modules $out/node_modules
    cp -R ./* $out

    # bun is referenced naked in the package.json generated script
    makeWrapper ${lib.getExe bun} $out/bin/summer-body-bot \
      --add-flags "--cwd $out $out/index.ts"

    # --prefix PATH : ${lib.makeBinPath [ bun ]} \

    runHook postInstall
  '';

  npmConfigHook = importNpmLock.npmConfigHook;

  meta.mainProgram = "summer-body-bot";
})
