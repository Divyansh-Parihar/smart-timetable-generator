#include "graph_coloring.h"
#include <algorithm>

GraphColoring::GraphColoring(const std::vector<ClassSession>& sessions, int totalSlots)
    : sessions(sessions), numSessions((int)sessions.size()), totalSlots(totalSlots) {
    adj.resize(numSessions);
}

// Build an edge between every pair of sessions that conflict
void GraphColoring::buildConflictGraph() {
    for (int i = 0; i < numSessions; i++) {
        for (int j = i + 1; j < numSessions; j++) {
            bool sameTeacher = (sessions[i].subject.teacher == sessions[j].subject.teacher);
            bool sameRoom    = (sessions[i].room.id         == sessions[j].room.id);

            if (sameTeacher || sameRoom) {
                adj[i].push_back(j);
                adj[j].push_back(i);
            }
        }
    }
}

// Saturation = number of distinct colors (slots) already used by neighbors of v
int GraphColoring::saturation(int v, const std::vector<int>& coloring) const {
    std::set<int> usedColors;
    for (int u : adj[v])
        if (coloring[u] != -1)
            usedColors.insert(coloring[u]);
    return (int)usedColors.size();
}

// Check whether color c causes a conflict for node v
bool GraphColoring::isValidColor(int v, int c, const std::vector<int>& coloring) const {
    for (int u : adj[v])
        if (coloring[u] == c)
            return false;
    return true;
}

// ---- DSatur coloring ----
GraphColoring::Result GraphColoring::color() {
    std::vector<int> coloring(numSessions, -1);  // -1 = not yet colored

    for (int iter = 0; iter < numSessions; iter++) {
        // Pick uncolored vertex with highest saturation; break ties by degree
        int chosen = -1, maxSat = -1, maxDeg = -1;
        for (int v = 0; v < numSessions; v++) {
            if (coloring[v] != -1) continue;
            int sat = saturation(v, coloring);
            int deg = (int)adj[v].size();
            if (sat > maxSat || (sat == maxSat && deg > maxDeg)) {
                chosen = v; maxSat = sat; maxDeg = deg;
            }
        }
        if (chosen == -1) break;

        // Assign the lowest valid color (slot) within totalSlots
        bool assigned = false;
        for (int c = 0; c < totalSlots; c++) {
            if (isValidColor(chosen, c, coloring)) {
                coloring[chosen] = c;
                assigned = true;
                break;
            }
        }
        // Fallback (rare): wrap around if all slots conflicted
        if (!assigned) coloring[chosen] = iter % totalSlots;
    }

    // Count distinct colors used and number of edges
    int maxColor = *std::max_element(coloring.begin(), coloring.end());
    int edgeCount = 0;
    for (int v = 0; v < numSessions; v++) edgeCount += (int)adj[v].size();
    edgeCount /= 2;

    return {coloring, maxColor + 1, edgeCount};
}
