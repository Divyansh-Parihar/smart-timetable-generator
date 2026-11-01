#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Smart Timetable Generator  —  Build & Run
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   SMART TIMETABLE GENERATOR  —  DAA Project  ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Download nlohmann/json if missing ─────────────────────
LIB="$DIR/lib/json.hpp"
if [ ! -f "$LIB" ]; then
  echo "  [1/3] Downloading nlohmann/json …"
  mkdir -p "$DIR/lib"
  curl -sSL \
    "https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp" \
    -o "$LIB"
  echo "  ✓  json.hpp downloaded"
else
  echo "  [1/3] json.hpp already present"
fi

# ── 2. Compile C++ ───────────────────────────────────────────
echo "  [2/3] Compiling C++ engine …"
mkdir -p "$DIR/bin"

g++ -std=c++17 -O2 -o "$DIR/bin/timetable" \
  "$DIR/src/main.cpp"           \
  "$DIR/src/timetable.cpp"      \
  "$DIR/src/graph_coloring.cpp" \
  "$DIR/src/genetic.cpp"        \
  "$DIR/src/scheduler.cpp"      \
  -I"$DIR"

echo "  ✓  Binary built at bin/timetable"

# ── 3. Start Python server ───────────────────────────────────
echo "  [3/3] Starting web server …"
echo ""
python3 "$DIR/server.py"
