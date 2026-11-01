#include "timetable.h"

// ── Global constant definitions (declared extern in timetable.h) ─────────────
// Defined in exactly ONE translation unit to avoid multiple-definition errors.

const std::vector<std::string> DAY_NAMES = {
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
};

const std::vector<std::string> PERIOD_TIMES = {
    "9:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-1:00",  "2:00-3:00",  "3:00-4:00",  "4:00-5:00"
};

const std::vector<std::string> SUBJECT_COLORS = {
    "#6C63FF","#FF6584","#43D9AD","#FFB347","#4FC3F7",
    "#A29BFE","#FD79A8","#00CEC9","#FDCB6E","#74B9FF",
    "#E17055","#55EFC4","#FFEAA7","#DFE6E9","#B2BEC3"
};
