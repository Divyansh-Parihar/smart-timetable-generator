#include "genetic.h"
#include <algorithm>
#include <map>
#include <numeric>

// ── Constructor ──────────────────────────────────────────────────────────────
GeneticAlgorithm::GeneticAlgorithm(
    const std::vector<ClassSession>& sessions,
    int days, int periodsPerDay,
    const GAConfig& cfg)
    : sessions(sessions), days(days), periodsPerDay(periodsPerDay),
      totalSlots(days * periodsPerDay), cfg(cfg),
      rng(std::random_device{}()) {}

// ── Random chromosome (baseline) ────────────────────────────────────────────
GeneticAlgorithm::Chromosome GeneticAlgorithm::randomChromosome() {
    std::uniform_int_distribution<int> dist(0, totalSlots - 1);
    Chromosome c(sessions.size());
    for (auto& g : c) g = dist(rng);
    return c;
}

// ── Seed population from graph-coloring result ───────────────────────────────
void GeneticAlgorithm::seedPopulation(const std::vector<int>& gcSol) {
    population.clear();
    population.push_back(gcSol);   // best known starting point

    std::uniform_int_distribution<int> sessDist(0, (int)sessions.size() - 1);
    std::uniform_int_distribution<int> slotDist(0, totalSlots - 1);

    for (int i = 1; i < cfg.populationSize; i++) {
        Chromosome c = gcSol;
        int mutations = (int)sessions.size() / 3;
        for (int m = 0; m < mutations; m++)
            c[sessDist(rng)] = slotDist(rng);
        population.push_back(c);
    }
}

// ── Count HARD conflicts (must be zero for a valid timetable) ────────────────
// Hard constraint: no two sessions in the same slot share a teacher OR a room
int GeneticAlgorithm::hardConflicts(const Chromosome& c) {
    int conflicts = 0;
    int n = (int)sessions.size();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (c[i] != c[j]) continue;
            if (sessions[i].subject.teacher == sessions[j].subject.teacher) conflicts++;
            if (sessions[i].room.id         == sessions[j].room.id)         conflicts++;
        }
    }
    return conflicts;
}

// ── Count SOFT conflicts (preferences) ───────────────────────────────────────
// Soft: penalise teacher teaching >3 consecutive periods in a day
int GeneticAlgorithm::softConflicts(const Chromosome& c) {
    int penalty = 0;
    std::map<std::pair<std::string,int>, std::vector<int>> teacherDayPeriods;

    for (int i = 0; i < (int)sessions.size(); i++) {
        int day    = c[i] / periodsPerDay;
        int period = c[i] % periodsPerDay;
        teacherDayPeriods[{sessions[i].subject.teacher, day}].push_back(period);
    }
    for (auto& [key, periods] : teacherDayPeriods) {
        std::sort(periods.begin(), periods.end());
        int consec = 1;
        for (int i = 1; i < (int)periods.size(); i++) {
            consec = (periods[i] == periods[i-1] + 1) ? consec + 1 : 1;
            if (consec > 3) penalty++;
        }
    }
    return penalty;
}

// ── Fitness function ─────────────────────────────────────────────────────────
double GeneticAlgorithm::fitness(const Chromosome& c) {
    return 1.0 / (1.0 + hardConflicts(c) * 10.0 + softConflicts(c) * 0.5);
}

// ── Sort population by descending fitness ────────────────────────────────────
void GeneticAlgorithm::sortByFitness() {
    std::stable_sort(population.begin(), population.end(),
        [this](const Chromosome& a, const Chromosome& b) {
            return fitness(a) > fitness(b);
        });
}

// ── Tournament selection ─────────────────────────────────────────────────────
GeneticAlgorithm::Chromosome GeneticAlgorithm::tournamentSelect() {
    std::uniform_int_distribution<int> dist(0, (int)population.size() - 1);
    int best = dist(rng);
    double bestFit = fitness(population[best]);
    for (int t = 1; t < cfg.tournamentSize; t++) {
        int idx = dist(rng);
        double f = fitness(population[idx]);
        if (f > bestFit) { bestFit = f; best = idx; }
    }
    return population[best];
}

// ── Single-point crossover ───────────────────────────────────────────────────
std::pair<GeneticAlgorithm::Chromosome, GeneticAlgorithm::Chromosome>
GeneticAlgorithm::crossover(const Chromosome& a, const Chromosome& b) {
    std::uniform_int_distribution<int> dist(1, (int)a.size() - 1);
    int pt = dist(rng);
    Chromosome c1 = a, c2 = b;
    for (int i = pt; i < (int)a.size(); i++) std::swap(c1[i], c2[i]);
    return {c1, c2};
}

// ── Mutation: randomly reassign genes ────────────────────────────────────────
void GeneticAlgorithm::mutate(Chromosome& c) {
    std::uniform_real_distribution<double> prob(0.0, 1.0);
    std::uniform_int_distribution<int>     slotDist(0, totalSlots - 1);
    for (auto& gene : c)
        if (prob(rng) < cfg.mutationRate)
            gene = slotDist(rng);
}

// ── Convert best chromosome to Timetable ────────────────────────────────────
Timetable GeneticAlgorithm::buildTimetable(const Chromosome& best) {
    Timetable tt;
    tt.hardConflicts = hardConflicts(best);
    tt.softConflicts = softConflicts(best);
    tt.fitness       = fitness(best);
    for (int i = 0; i < (int)sessions.size(); i++) {
        int day    = best[i] / periodsPerDay;
        int period = best[i] % periodsPerDay;
        tt.assignments.push_back({sessions[i], {day, period}});
    }
    return tt;
}

// ── Main evolution loop ──────────────────────────────────────────────────────
Timetable GeneticAlgorithm::evolve() {
    sortByFitness();
    stats.initialFitness = fitness(population[0]);
    stats.fitnessHistory.push_back(stats.initialFitness);

    std::uniform_real_distribution<double> prob(0.0, 1.0);

    for (int gen = 0; gen < cfg.maxGenerations; gen++) {
        std::vector<Chromosome> newPop;

        // Elitism
        for (int e = 0; e < cfg.eliteCount && e < (int)population.size(); e++)
            newPop.push_back(population[e]);

        // Crossover + mutation to fill rest
        while ((int)newPop.size() < cfg.populationSize) {
            Chromosome p1 = tournamentSelect();
            Chromosome p2 = tournamentSelect();
            Chromosome c1, c2;
            if (prob(rng) < cfg.crossoverRate) {
                auto [ch1, ch2] = crossover(p1, p2);
                c1 = ch1; c2 = ch2;
            } else {
                c1 = p1; c2 = p2;
            }
            mutate(c1); mutate(c2);
            newPop.push_back(c1);
            if ((int)newPop.size() < cfg.populationSize) newPop.push_back(c2);
        }

        population = newPop;
        sortByFitness();
        double bestFit = fitness(population[0]);
        stats.fitnessHistory.push_back(bestFit);

        // Early exit if perfect
        if (bestFit >= cfg.targetFitness) {
            stats.generationsRun = gen + 1;
            break;
        }
        stats.generationsRun = gen + 1;
    }

    stats.finalFitness  = fitness(population[0]);
    stats.bestConflicts = hardConflicts(population[0]);
    return buildTimetable(population[0]);
}
