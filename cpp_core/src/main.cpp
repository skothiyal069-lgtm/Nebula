#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include "trie.hpp"
#include "huffman.hpp"
#include "graph.hpp"
#include "priority_queue.hpp"
#include "edit_distance.hpp"

// Utility functions to split strings
std::vector<std::string> split(const std::string& str, char delim) {
    std::vector<std::string> tokens;
    std::stringstream ss(str);
    std::string token;
    while (std::getline(ss, token, delim)) {
        tokens.push_back(token);
    }
    return tokens;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Error: Nebula Engine requires arguments." << std::endl;
        std::cerr << "Usage: ./nebula_core [mode] [args...]" << std::endl;
        return 1;
    }

    std::string mode = argv[1];

    if (mode == "--trie") {
        if (argc < 4) {
            std::cerr << "Usage: ./nebula_core --trie <query> <comma_separated_words>" << std::endl;
            return 1;
        }
        std::string query = argv[2];
        std::string wordsList = argv[3];

        Trie trie;
        std::vector<std::string> words = split(wordsList, ',');
        for (const auto& word : words) {
            if (!word.empty()) {
                trie.insert(word);
            }
        }

        std::cout << trie.getVisualizationJson(query) << std::endl;
    } 
    else if (mode == "--huffman") {
        if (argc < 3) {
            std::cerr << "Usage: ./nebula_core --huffman <text>" << std::endl;
            return 1;
        }
        std::string text = argv[2];
        HuffmanCoding huffman;
        std::cout << huffman.getVisualizationJson(text) << std::endl;
    } 
    else if (mode == "--edit-distance") {
        if (argc < 4) {
            std::cerr << "Usage: ./nebula_core --edit-distance <word1> <word2>" << std::endl;
            return 1;
        }
        std::string word1 = argv[2];
        std::string word2 = argv[3];
        std::cout << EditDistance::computeJson(word1, word2) << std::endl;
    } 
    else if (mode == "--network") {
        // argv[2]: start node (optional, can be empty string "")
        // argv[3]: end node (optional, can be empty string "")
        // argv[4]: pipe & comma separated edges "u|v|weight|roomName,u|v|weight|roomName,..."
        if (argc < 5) {
            std::cerr << "Usage: ./nebula_core --network <start> <end> <edges>" << std::endl;
            return 1;
        }
        std::string start = argv[2];
        std::string end = argv[3];
        std::string edgesList = argv[4];

        Graph graph;
        std::vector<std::string> edgesStr = split(edgesList, ',');
        for (const auto& edgeStr : edgesStr) {
            if (edgeStr.empty()) continue;
            std::vector<std::string> parts = split(edgeStr, '|');
            if (parts.size() >= 3) {
                std::string u = parts[0];
                std::string v = parts[1];
                int weight = std::stoi(parts[2]);
                std::string roomName = (parts.size() >= 4) ? parts[3] : "Direct";
                graph.addEdge(u, v, weight, roomName);
            }
        }

        std::cout << graph.getNetworkJson(start, end) << std::endl;
    } 
    else if (mode == "--scheduler") {
        // argv[2]: comma & pipe separated queue items "id|content|sendAt|recipientName,..."
        if (argc < 3) {
            std::cerr << "Usage: ./nebula_core --scheduler <items>" << std::endl;
            return 1;
        }
        std::string itemsList = argv[2];

        MinHeap heap;
        std::vector<std::string> itemsStr = split(itemsList, ',');
        for (const auto& itemStr : itemsStr) {
            if (itemStr.empty()) continue;
            std::vector<std::string> parts = split(itemStr, '|');
            if (parts.size() >= 4) {
                HeapItem item;
                item.id = parts[0];
                item.content = parts[1];
                item.sendAt = std::stoll(parts[2]);
                item.recipientName = parts[3];
                heap.insert(item);
            }
        }

        std::cout << heap.getVisualizationJson() << std::endl;
    } 
    else {
        std::cerr << "Error: Unknown execution mode " << mode << std::endl;
        return 1;
    }

    return 0;
}
