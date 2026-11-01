#pragma once
#include "timetable.h"
#include <vector>
#include <random>

/*
 * GENETIC ALGORITHM  -  Schedule Optimiser
 * =========================================
 * CHROMOSOME  = one complete timetable  (chromosome[i] = slot for session i)
 * POPULATION  = pool of candidate timetables
 * FITNESS     = 1 / (1 + 10·hard + soft)   [higher = better]
 *
 * OPERATORS
 *   Selection  → Tournament selection (pick best from k random candidates)
 *   Crossover  → Single-point crossover (swap gene tails between two parents)
 *   Mutation   → Randomly reassign genes with probability p_m
 *   Elitism    → Top-E chromosomes survive unchanged each generation
 *
 * TIME COMPLEXITY:  O(G × P × N²)   G=generations, P=pop size, N=sessions
 * SPACE COMPLEXITY: O(P × N)
 */

// Config and Stats are kept OUTSIDE the class to avoid a Clang limitation
// with nested structs that have default member initializers used as
// default constructor arguments of the enclosing class.

struct GAConfig {
    int    populationSize = 80;
    int    maxGenerations = 400;
    double crossoverRate  = 0.85;
    double mutationRate   = 0.12;
    int    tournamentSize = 5;
    int    eliteCount     = 4;
    double targetFitness  = 0.99;   // stop early if perfect schedule found
};

struct GAStats {
    double initialFitness = 0.0;
    double finalFitness   = 0.0;
    int    generationsRun = 0;
    int    bestConflicts  = 0;
    std::vector<double> fitnessHistory;
};

class GeneticAlgorithm {
public:
    GeneticAlgorithm(const std::vector<ClassSession>& sessions,
                     int days, int periodsPerDay,
                     const GAConfig& cfg = GAConfig());

    // Seed initial population from graph-coloring solution
    void seedPopulation(const std::vector<int>& graphColorSolution);

    // Run evolution; returns best timetable found
    Timetable evolve();

    const GAStats& getStats() const { return stats; }

private:
    using Chromosome = std::vector<int>;

    std::vector<ClassSession> sessions;
    int days, periodsPerDay, totalSlots;
    GAConfig cfg;
    GAStats  stats;
    std::mt19937 rng;
    std::vector<Chromosome> population;

    double fitness(const Chromosome& c);
    int    hardConflicts(const Chromosome& c);
    int    softConflicts(const Chromosome& c);

    Chromosome randomChromosome();
    Chromosome tournamentSelect();
    std::pair<Chromosome, Chromosome> crossover(const Chromosome& a, const Chromosome& b);
    void mutate(Chromosome& c);
    void sortByFitness();
    Timetable buildTimetable(const Chromosome& best);
};
