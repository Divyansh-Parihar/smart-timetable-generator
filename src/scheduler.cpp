#include "scheduler.h"
#include <stdexcept>
#include <ctime>

using json = nlohmann::json;

// ── Parse JSON input ─────────────────────────────────────────────────────────
void Scheduler::loadFromJSON(const json& j) {
    className     = j.value("className", "Class A");
    days          = j.value("days", 5);
    periodsPerDay = j.value("periodsPerDay", 7);

    subjects.clear();
    rooms.clear();

    // Parse subjects
    int colorIdx = 0;
    for (auto& s : j.at("subjects")) {
        Subject sub;
        sub.id           = s.value("id", colorIdx + 1);
        sub.name         = s.at("name").get<std::string>();
        sub.teacher      = s.at("teacher").get<std::string>();
        sub.hoursPerWeek = s.value("hoursPerWeek", 3);
        sub.color        = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.size()];
        subjects.push_back(sub);
        colorIdx++;
    }

    // Parse rooms
    int rid = 1;
    for (auto& r : j.at("rooms")) {
        Room room;
        room.id       = r.value("id", rid++);
        room.name     = r.at("name").get<std::string>();
        room.capacity = r.value("capacity", 60);
        rooms.push_back(room);
    }

    expandSessions();
}

// ── Expand each subject into individual 1-hour sessions ─────────────────────
void Scheduler::expandSessions() {
    sessions.clear();
    int sid = 0;
    for (auto& sub : subjects) {
        for (int h = 0; h < sub.hoursPerWeek; h++) {
            ClassSession cs;
            cs.id      = sid;
            cs.subject = sub;
            cs.room    = pickRoom(sid);
            sessions.push_back(cs);
            sid++;
        }
    }
}

Room Scheduler::pickRoom(int sessionIndex) {
    if (rooms.empty()) {
        // Default fallback room
        return {1, "Room 101", 60};
    }
    return rooms[sessionIndex % rooms.size()];
}

// ── Run full scheduling pipeline ────────────────────────────────────────────
Timetable Scheduler::generate() {
    int totalSlots = days * periodsPerDay;

    // ── PHASE 1: Graph Coloring (DSatur) ──
    // Builds conflict graph and assigns a non-conflicting slot to each session
    GraphColoring gc(sessions, totalSlots);
    gc.buildConflictGraph();
    gcResult = gc.color();

    // Clamp slots to valid range
    for (auto& s : gcResult.slotOf)
        s = s % totalSlots;

    // ── PHASE 2: Genetic Algorithm ──
    // Uses graph-coloring solution to seed the initial population,
    // then evolves toward a conflict-free, preference-satisfying schedule.
    GeneticAlgorithm ga(sessions, days, periodsPerDay);
    ga.seedPopulation(gcResult.slotOf);
    Timetable result = ga.evolve();
    gaStats = ga.getStats();

    return result;
}

// ── Serialise result to JSON ─────────────────────────────────────────────────
json Scheduler::toJSON(const Timetable& tt, double elapsedMs) {
    json out;
    out["status"]        = (tt.hardConflicts == 0) ? "success" : "partial";
    out["className"]     = className;
    out["fitness"]       = tt.fitness;
    out["hardConflicts"] = tt.hardConflicts;
    out["softConflicts"] = tt.softConflicts;
    out["totalSessions"] = (int)sessions.size();

    // Build day-by-day grid
    json grid = json::array();
    for (int d = 0; d < days; d++) {
        json dayObj;
        dayObj["day"]     = d;
        dayObj["dayName"] = DAY_NAMES[d];
        json periods      = json::array();

        for (int p = 0; p < periodsPerDay; p++) {
            json cell;
            cell["period"] = p;
            cell["time"]   = (p < (int)PERIOD_TIMES.size()) ? PERIOD_TIMES[p] : "N/A";
            cell["subject"] = nullptr;

            // Find assignment for this slot
            for (auto& a : tt.assignments) {
                if (a.slot.day == d && a.slot.period == p) {
                    cell["subject"] = a.session.subject.name;
                    cell["teacher"] = a.session.subject.teacher;
                    cell["room"]    = a.session.room.name;
                    cell["color"]   = a.session.subject.color;
                    break;
                }
            }
            periods.push_back(cell);
        }
        dayObj["periods"] = periods;
        grid.push_back(dayObj);
    }
    out["timetable"] = grid;

    // Algorithm statistics
    out["stats"]["elapsedMs"]             = elapsedMs;
    out["stats"]["graphColoring"]["nodes"] = (int)sessions.size();
    out["stats"]["graphColoring"]["edges"] = gcResult.edgeCount;
    out["stats"]["graphColoring"]["colors"]= gcResult.chromaticNumber;
    out["stats"]["genetic"]["generations"] = gaStats.generationsRun;
    out["stats"]["genetic"]["initialFit"]  = gaStats.initialFitness;
    out["stats"]["genetic"]["finalFit"]    = gaStats.finalFitness;
    out["stats"]["genetic"]["fitnessHistory"] = gaStats.fitnessHistory;

    return out;
}
