#pragma once
#include "timetable.h"
#include <vector>
#include <set>

/*
 * GRAPH COLORING  -  DSatur Algorithm
 * ====================================
 * MODEL:
 *   Graph G = (V, E)
 *   V  = every class session that must be scheduled
 *   E  = conflict edge: sessions share a teacher OR a room
 *         → they CANNOT occupy the same time-slot
 *   Color = time-slot index
 *
 * DSATUR (Brelaz, 1979):
 *   Greedy coloring that always picks the MOST CONSTRAINED
 *   uncolored vertex (highest saturation) next.
 *   Saturation(v) = # distinct colors already used by v's neighbors.
 *
 * Why better than plain greedy?
 *   Plain greedy chooses vertices in a fixed order.
 *   DSatur adapts dynamically → fewer colors needed on average.
 *
 * TIME COMPLEXITY:  O(V² + E)
 * SPACE COMPLEXITY: O(V + E)
 */

class GraphColoring {
public:
    struct Result {
        std::vector<int> slotOf;    // slotOf[i] = time-slot assigned to session i
        int chromaticNumber;        // distinct colors (slots) actually used
        int edgeCount;              // number of conflict edges in the graph
    };

    GraphColoring(const std::vector<ClassSession>& sessions, int totalSlots);

    // Step 1: build conflict edges
    void buildConflictGraph();

    // Step 2: run DSatur and return slot assignments
    Result color();

    const std::vector<std::vector<int>>& adjList() const { return adj; }

private:
    std::vector<ClassSession>   sessions;
    std::vector<std::vector<int>> adj;   // adjacency list
    int numSessions, totalSlots;

    int  saturation(int v, const std::vector<int>& coloring) const;
    bool isValidColor(int v, int c, const std::vector<int>& coloring) const;
};
