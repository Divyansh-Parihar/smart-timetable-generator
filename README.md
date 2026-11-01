# Smart Timetable Generator 🗓️

> **DAA Project** | Graph Coloring (DSatur) + Genetic Algorithm

## Algorithms Used

| Algorithm | Role | Complexity |
|---|---|---|
| **Graph Coloring (DSatur)** | Build conflict graph; assign conflict-free time slots | O(V² + E) |
| **Genetic Algorithm** | Optimise the schedule across generations | O(G × P × N²) |
| **Greedy Seeding** | Seed GA population from the GC solution | O(N) |

## Project Structure

```
DAA PROJECT/
├── src/
│   ├── timetable.h          ← Data structures
│   ├── graph_coloring.h/.cpp ← DSatur algorithm
│   ├── genetic.h/.cpp        ← Genetic algorithm
│   ├── scheduler.h/.cpp      ← Pipeline orchestrator
│   └── main.cpp              ← Entry point (reads JSON → outputs JSON)
├── lib/
│   └── json.hpp              ← nlohmann/json (auto-downloaded)
├── bin/
│   └── timetable             ← Compiled binary (auto-built)
├── web/
│   ├── index.html            ← UI
│   ├── style.css             ← Dark-mode design
│   └── app.js                ← Frontend logic
├── server.py                 ← Python HTTP bridge
└── run.sh                    ← One-click build & launch
```

## Quick Start

```bash
chmod +x run.sh
./run.sh
```

Then open **http://localhost:8080** in your browser.

## How It Works

1. **Input**: Subjects (name, teacher, hours/week) + Rooms + Config
2. **Graph Coloring**: Every class session = graph node.  
   Two nodes share an edge if they have the same teacher or room.  
   DSatur colors the graph so no adjacent nodes share a time-slot.
3. **Genetic Algorithm**: Seeds population from the GC solution,  
   then evolves for up to 400 generations using tournament selection,  
   single-point crossover, and random mutation.
4. **Output**: Conflict-free timetable grid + algorithm statistics

## Requirements

- `g++` with C++17 support
- `python3` (standard library only)
- Internet connection (first run only — to download `json.hpp`)
