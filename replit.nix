{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.sqlite
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.sqlite ];
  };
}
