from __future__ import annotations

import struct
import sys
from pathlib import Path


def python_bits() -> int:
  return struct.calcsize("P") * 8


def print_32bit_windows_error() -> int:
  print("Dashboard-Start abgebrochen.")
  print(f"Aktives Python: {sys.executable}")
  print("Erkannte Architektur: 32-Bit")
  print("")
  print("Grund:")
  print("Das Dashboard verwendet Streamlit. In dieser Windows-Umgebung scheitert die")
  print("Installation an der Abhängigkeit pyarrow, weil dafür kein 32-Bit-Wheel")
  print("verfügbar ist.")
  print("")
  print("Vorgehen:")
  print("1. Installiere ein 64-Bit-Python auf dem System.")
  print("2. Prüfe danach mit: py -0p")
  print("3. Installiere die Dashboard-Abhängigkeiten mit dem 64-Bit-Python:")
  print("   py -3.13 -m pip install -r dashboard/requirements.txt")
  print("4. Starte danach erneut:")
  print("   py -3.13 dashboard/run_dashboard.py")
  print("")
  print("Hinweis:")
  print("Die Dashboard-Daten kannst du weiterhin schon lokal vorbereiten mit:")
  print("npm run dashboard:prepare")
  return 1


def print_missing_streamlit_error() -> int:
  print("Dashboard-Start abgebrochen.")
  print(f"Aktives Python: {sys.executable}")
  print(f"Erkannte Architektur: {python_bits()}-Bit")
  print("")
  print("Streamlit ist in dieser Python-Umgebung nicht installiert.")
  print("Installiere zuerst die Dashboard-Abhängigkeiten:")
  print("py -3.13 -m pip install -r dashboard/requirements.txt")
  return 1


def main() -> int:
  if sys.platform == "win32" and python_bits() == 32:
    return print_32bit_windows_error()

  try:
    import streamlit.web.cli as stcli
  except ModuleNotFoundError:
    return print_missing_streamlit_error()

  app_path = Path(__file__).resolve().parent / "app.py"
  sys.argv = ["streamlit", "run", str(app_path)]
  return stcli.main()


if __name__ == "__main__":
  raise SystemExit(main())
