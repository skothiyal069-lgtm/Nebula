#ifndef GRAPH_HPP
#define GRAPH_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <limits>

struct Edge {
    std::string u;
    std::string v;
    int weight;
    std::string roomName;
};

struct Neighbor {
    std::string node;
    int weight;
    std::string roomName;
};

// DSU structure for Kruskal's
struct DisjointSets {
    std::unordered_map<std::string, std::string> parent;

    void makeSet(const std::string& v) {
        parent[v] = v;
    }

    std::string find(const std::string& v) {
        if (parent[v] == v) return v;
        return parent[v] = find(parent[v]); // Path compression
    }

    bool unionSets(const std::string& u, const std::string& v) {
        std::string rootU = find(u);
        std::string rootV = find(v);
        if (rootU != rootV) {
            parent[rootU] = rootV;
            return true;
        }
        return false;
    }
};

class Graph {
private:
    std::unordered_set<std::string> vertices;
    std::unordered_map<std::string, std::vector<Neighbor>> adjacencyList;
    std::vector<Edge> edges;

public:
    void addVertex(const std::string& vertex) {
        vertices.insert(vertex);
    }

    void addEdge(const std::string& u, const std::string& v, int weight, const std::string& roomName = "Direct") {
        addVertex(u);
        addVertex(v);

        // Update if exists or add
        auto& adjU = adjacencyList[u];
        auto itU = std::find_if(adjU.begin(), adjU.end(), [&](const Neighbor& n) { return n.node == v; });
        if (itU != adjU.end()) {
            itU->weight = weight;
            itU->roomName = roomName;
        } else {
            adjU.push_back({v, weight, roomName});
        }

        auto& adjV = adjacencyList[v];
        auto itV = std::find_if(adjV.begin(), adjV.end(), [&](const Neighbor& n) { return n.node == u; });
        if (itV != adjV.end()) {
            itV->weight = weight;
            itV->roomName = roomName;
        } else {
            adjV.push_back({u, weight, roomName});
        }

        // Add to flat edges
        auto itE = std::find_if(edges.begin(), edges.end(), [&](const Edge& e) {
            return (e.u == u && e.v == v) || (e.u == v && e.v == u);
        });
        if (itE != edges.end()) {
            itE->weight = weight;
        } else {
            edges.push_back({u, v, weight, roomName});
        }
    }

    std::string findShortestPathJson(const std::string& startNode, const std::string& endNode) {
        std::unordered_map<std::string, int> distances;
        std::unordered_map<std::string, std::string> previous;
        std::unordered_set<std::string> visited;

        // priority queue for Dijkstra: pair of (distance, node)
        typedef std::pair<int, std::string> PQElement;
        std::priority_queue<PQElement, std::vector<PQElement>, std::greater<PQElement>> pq;

        for (const auto& v : vertices) {
            if (v == startNode) {
                distances[v] = 0;
                pq.push({0, v});
            } else {
                distances[v] = std::numeric_limits<int>::max();
                pq.push({std::numeric_limits<int>::max(), v});
            }
            previous[v] = "";
        }

        std::vector<std::string> stepsJson;

        while (!pq.empty()) {
            auto smallest = pq.top();
            pq.pop();

            std::string curr = smallest.second;
            if (smallest.first == std::numeric_limits<int>::max()) break;

            visited.insert(curr);

            // Start logging step
            std::stringstream stepSs;
            stepSs << "{"
                   << "\"currentNode\":\"" << curr << "\","
                   << "\"distances\":{";
            size_t dIdx = 0;
            for (auto& dPair : distances) {
                stepSs << "\"" << dPair.first << "\":" 
                       << (dPair.second == std::numeric_limits<int>::max() ? 999999 : dPair.second)
                       << (dIdx + 1 < distances.size() ? "," : "");
                dIdx++;
            }
            stepSs << "},\"visited\":[";
            size_t vIdx = 0;
            for (auto& vItem : visited) {
                stepSs << "\"" << vItem << "\"" << (vIdx + 1 < visited.size() ? "," : "");
                vIdx++;
            }
            stepSs << "],\"evaluating\":[";

            // If we reached the end node, break
            if (curr == endNode) {
                stepSs << "]}";
                stepsJson.push_back(stepSs.str());
                break;
            }

            auto neighborsIt = adjacencyList.find(curr);
            if (neighborsIt != adjacencyList.end()) {
                size_t nIdx = 0;
                for (const auto& neighbor : neighborsIt->second) {
                    if (visited.find(neighbor.node) != visited.end()) continue;

                    int newDist = distances[curr] + neighbor.weight;
                    int oldDist = distances[neighbor.node];

                    stepSs << (nIdx > 0 ? "," : "")
                           << "{"
                           << "\"from\":\"" << curr << "\","
                           << "\"to\":\"" << neighbor.node << "\","
                           << "\"weight\":" << neighbor.weight << ","
                           << "\"oldDistance\":" << (oldDist == std::numeric_limits<int>::max() ? 999999 : oldDist) << ","
                           << "\"newDistance\":" << newDist
                           << "}";
                    nIdx++;

                    if (newDist < distances[neighbor.node]) {
                        distances[neighbor.node] = newDist;
                        previous[neighbor.node] = curr;
                        pq.push({newDist, neighbor.node});
                    }
                }
            }
            stepSs << "]}";
            stepsJson.push_back(stepSs.str());
        }

        // Build path array
        std::vector<std::string> path;
        std::string curr = endNode;
        while (!curr.empty() && distances[curr] != std::numeric_limits<int>::max()) {
            path.push_back(curr);
            curr = previous[curr];
            if (curr == startNode) {
                path.push_back(startNode);
                break;
            }
        }
        std::reverse(path.begin(), path.end());

        std::stringstream ss;
        ss << "{"
           << "\"path\":[";
        for (size_t i = 0; i < path.size(); i++) {
            ss << "\"" << path[i] << "\"" << (i + 1 < path.size() ? "," : "");
        }
        ss << "],\"distance\":" << (distances[endNode] == std::numeric_limits<int>::max() ? -1 : distances[endNode]) << ","
           << "\"steps\":[";
        for (size_t i = 0; i < stepsJson.size(); i++) {
            ss << stepsJson[i] << (i + 1 < stepsJson.size() ? "," : "");
        }
        ss << "]}";

        return ss.str();
    }

    std::string findMSTJson() {
        std::vector<Edge> sortedEdges = edges;
        std::sort(sortedEdges.begin(), sortedEdges.end(), [](const Edge& a, const Edge& b) {
            return a.weight < b.weight;
        });

        DisjointSets dsu;
        for (const auto& v : vertices) {
            dsu.makeSet(v);
        }

        std::vector<Edge> mstEdges;
        int totalCost = 0;
        std::vector<std::string> stepsJson;

        for (const auto& edge : sortedEdges) {
            std::string rootU = dsu.find(edge.u);
            std::string rootV = dsu.find(edge.v);
            bool createsCycle = (rootU == rootV);

            if (!createsCycle) {
                dsu.unionSets(edge.u, edge.v);
                mstEdges.push_back(edge);
                totalCost += edge.weight;
            }

            // Log step
            std::stringstream stepSs;
            stepSs << "{"
                   << "\"edgeChecked\":{"
                   << "\"u\":\"" << edge.u << "\","
                   << "\"v\":\"" << edge.v << "\","
                   << "\"weight\":" << edge.weight << ","
                   << "\"roomName\":\"" << edge.roomName << "\""
                   << "},"
                   << "\"createsCycle\":" << (createsCycle ? "true" : "false") << ","
                   << "\"totalCost\":" << totalCost << ","
                   << "\"mstState\":[";
            for (size_t i = 0; i < mstEdges.size(); i++) {
                stepSs << "{"
                       << "\"u\":\"" << mstEdges[i].u << "\","
                       << "\"v\":\"" << mstEdges[i].v << "\","
                       << "\"weight\":" << mstEdges[i].weight << ","
                       << "\"roomName\":\"" << mstEdges[i].roomName << "\""
                       << "}" << (i + 1 < mstEdges.size() ? "," : "");
            }
            stepSs << "]}";
            stepsJson.push_back(stepSs.str());
        }

        std::stringstream ss;
        ss << "{"
           << "\"totalCost\":" << totalCost << ","
           << "\"mstEdges\":[";
        for (size_t i = 0; i < mstEdges.size(); i++) {
            ss << "{"
               << "\"u\":\"" << mstEdges[i].u << "\","
               << "\"v\":\"" << mstEdges[i].v << "\","
               << "\"weight\":" << mstEdges[i].weight << ","
               << "\"roomName\":\"" << mstEdges[i].roomName << "\""
               << "}" << (i + 1 < mstEdges.size() ? "," : "");
        }
        ss << "],\"steps\":[";
        for (size_t i = 0; i < stepsJson.size(); i++) {
            ss << stepsJson[i] << (i + 1 < stepsJson.size() ? "," : "");
        }
        ss << "]}";

        return ss.str();
    }

    std::string getNetworkJson(const std::string& start, const std::string& end) {
        std::stringstream ss;
        ss << "{"
           << "\"vertices\":[";
        size_t vIdx = 0;
        for (const auto& v : vertices) {
            ss << "\"" << v << "\"" << (vIdx + 1 < vertices.size() ? "," : "");
            vIdx++;
        }
        ss << "],\"edges\":[";
        for (size_t i = 0; i < edges.size(); i++) {
            ss << "{"
               << "\"u\":\"" << edges[i].u << "\","
               << "\"v\":\"" << edges[i].v << "\","
               << "\"weight\":" << edges[i].weight << ","
               << "\"roomName\":\"" << edges[i].roomName << "\""
               << "}" << (i + 1 < edges.size() ? "," : "");
        }
        ss << "],";

        if (!start.empty() && !end.empty() && vertices.find(start) != vertices.end() && vertices.find(end) != vertices.end()) {
            ss << "\"dijkstra\":" << findShortestPathJson(start, end) << ",";
        } else {
            ss << "\"dijkstra\":null,";
        }

        ss << "\"mst\":" << findMSTJson() << "}";

        return ss.str();
    }
};

#endif
