#pragma once
#include "timetable.h"
#include "graph_coloring.h"
#include "genetic.h"
#include "../lib/json.hpp"
#include <vector>
#include <string>

/*
 * SCHEDULER  -  Orchestrates the full pipeline:
 *   1. Parse JSON input
 *   2. Expand subjects → individual ClassSessions
 *   3. Run Graph Coloring (DSatur) → conflict-free initial assignment
 *   4. Run Genetic Algorithm       → optimise further
 *   5. Serialise result to JSON
 */
class Scheduler {
public:
    // Load subjects and rooms from parsed JSON
    void loadFromJSON(const nlohmann::json& j);

    // Run both algorithms and return best timetable
    Timetable generate();

    // Convert timetable to output JSON
    nlohmann::json toJSON(const Timetable& tt, double elapsedMs = 0.0);

private:
    std::vector<Subject>      subjects;
    std::vector<Room>         rooms;
    std::vector<ClassSession> sessions;   // expanded sessions
    std::string               className;
    int days         = 5;
    int periodsPerDay = 7;

    // Algorithm stats saved during generate()
    GraphColoring::Result gcResult;
    GAStats gaStats;

    // Expand each subject into (hoursPerWeek) individual sessions
    void expandSessions();

    // Pick a room (round-robin for simplicity)
    Room pickRoom(int sessionIndex);
};
