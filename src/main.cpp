/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           SMART TIMETABLE GENERATOR                         ║
 * ║           Design & Analysis of Algorithms  –  DAA Project   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Algorithms Implemented:                                     ║
 * ║  ① Graph Coloring (DSatur)  – Conflict-free slot assignment ║
 * ║  ② Genetic Algorithm        – Schedule optimisation         ║
 * ║  ③ Greedy seeding           – Initial population for GA     ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Input  : JSON via stdin or file path as argv[1]            ║
 * ║  Output : JSON to stdout                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

#include <iostream>
#include <fstream>
#include <chrono>
#include "../lib/json.hpp"
#include "scheduler.h"

using json = nlohmann::json;
using namespace std;

int main(int argc, char* argv[]) {
    auto t0 = chrono::high_resolution_clock::now();

    // ── Read JSON input ──────────────────────────────────────────
    json input;
    try {
        if (argc > 1) {
            ifstream file(argv[1]);
            if (!file.is_open()) {
                cerr << R"({"error":"Cannot open file"})" << endl;
                return 1;
            }
            file >> input;
        } else {
            cin >> input;
        }
    } catch (exception& e) {
        cerr << "{\"error\":\"" << e.what() << "\"}" << endl;
        return 1;
    }

    // ── Run scheduler ────────────────────────────────────────────
    Scheduler scheduler;
    scheduler.loadFromJSON(input);
    Timetable result = scheduler.generate();

    auto t1 = chrono::high_resolution_clock::now();
    double ms = chrono::duration<double, milli>(t1 - t0).count();

    // ── Output JSON ──────────────────────────────────────────────
    cout << scheduler.toJSON(result, ms).dump(2) << endl;
    return 0;
}
