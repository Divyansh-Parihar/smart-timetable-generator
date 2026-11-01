#pragma once
#include <string>
#include <vector>

// ============================================================
//  SMART TIMETABLE GENERATOR  -  Data Structures
//  DAA Project | Algorithms: Graph Coloring + Genetic Algorithm
// ============================================================

// Declared here, defined once in timetable.cpp
extern const std::vector<std::string> DAY_NAMES;
extern const std::vector<std::string> PERIOD_TIMES;
extern const std::vector<std::string> SUBJECT_COLORS;

// ----- Core structs -----

struct Subject {
    int    id;
    std::string name;
    std::string teacher;
    int    hoursPerWeek;
    std::string color;          // used by the UI
};

struct Room {
    int    id;
    std::string name;
    int    capacity;
};

// A slot = one cell in the grid (day × period)
struct TimeSlot {
    int day;     // 0 = Monday … 4 = Friday
    int period;  // 0 = first period

    bool operator==(const TimeSlot& o) const {
        return day == o.day && period == o.period;
    }
    bool operator<(const TimeSlot& o) const {
        return day * 100 + period < o.day * 100 + o.period;
    }
};

// One indivisible class session (e.g. one hour of Maths)
struct ClassSession {
    int     id;
    Subject subject;
    Room    room;
};

// A session assigned to a timeslot
struct Assignment {
    ClassSession session;
    TimeSlot     slot;
};

// The complete result
struct Timetable {
    std::vector<Assignment> assignments;
    int    hardConflicts = 0;
    int    softConflicts = 0;
    double fitness       = 0.0;
};
