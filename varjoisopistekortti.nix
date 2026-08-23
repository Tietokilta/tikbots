{
  stdenvNoCC,
  python3,
  makeWrapper,
}:
let
  python = python3.withPackages (p: [
    p.python-telegram-bot
    p.python-dotenv
  ]);
in

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "varjoisopistekortti";
  version = "1.0.0";

  src = ./varjoisopistekortti/.;

  dontBuild = true;

  nativeBuildInputs = [
    makeWrapper
  ];

  installPhase = ''
    makeWrapper ${python}/bin/python $out/bin/varjoisopistekortti \
      --add-flag ${finalAttrs.src}/main.py
  '';

  meta.mainProgram = "varjoisopistekortti";
})
