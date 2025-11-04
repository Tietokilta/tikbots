{
  stdenvNoCC,
  python3,
  makeWrapper,
}:
let
  python = python3.withPackages (p: [ p.python-telegram-bot ]);
in

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "tikbot";
  version = "1.0.0";

  src = ./tikbot/.;

  dontBuild = true;

  nativeBuildInputs = [
    makeWrapper
  ];

  installPhase = ''
    makeWrapper ${python}/bin/python $out/bin/tikbot \
      --add-flag ${finalAttrs.src}/main.py
  '';

  meta.mainProgram = "tikbot";
})
