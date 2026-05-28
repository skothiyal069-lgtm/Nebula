#ifndef TRIE_HPP
#define TRIE_HPP

#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <sstream>

struct TrieNode {
    char ch;
    std::unordered_map<char, TrieNode*> children;
    bool isEndOfWord;
    std::string data; // Username stored at terminus

    TrieNode(char c = '\0') : ch(c), isEndOfWord(false), data("") {}
    
    ~TrieNode() {
        for (auto& pair : children) {
            delete pair.second;
        }
    }
};

class Trie {
private:
    TrieNode* root;

    void collectWords(TrieNode* node, std::vector<std::string>& results) {
        if (node->isEndOfWord) {
            results.push_back(node->data);
        }
        for (auto& pair : node->children) {
            collectWords(pair.second, results);
        }
    }

    void buildVisualData(TrieNode* node, std::string parentId, int depth, int& nodeId, 
                         const std::string& query, bool isHighlighted,
                         std::vector<std::string>& nodesJson, std::vector<std::string>& linksJson) {
        std::string currentId = "n-" + std::to_string(nodeId++);
        
        // Escape json data
        std::string label = (node->ch == '\0') ? "ROOT" : std::string(1, node->ch);
        std::string isWordStr = node->isEndOfWord ? "true" : "false";
        std::string highlightStr = isHighlighted ? "true" : "false";

        std::stringstream ss;
        ss << "{"
           << "\"id\":\"" << currentId << "\","
           << "\"label\":\"" << label << "\","
           << "\"isWord\":" << isWordStr << ","
           << "\"depth\":" << depth << ","
           << "\"highlight\":" << highlightStr << ","
           << "\"value\":" << (node->isEndOfWord ? "\"" + node->data + "\"" : "null")
           << "}";
        nodesJson.push_back(ss.str());

        if (!parentId.empty()) {
            std::stringstream linkSs;
            linkSs << "{"
                   << "\"source\":\"" << parentId << "\","
                   << "\"target\":\"" << currentId << "\","
                   << "\"highlight\":" << highlightStr
                   << "}";
            linksJson.push_back(linkSs.str());
        }

        // Limit visualization depth to keep graph neat in UI
        if (depth >= 4) return;

        char nextChar = '\0';
        if (isHighlighted && depth < query.length()) {
            nextChar = tolower(query[depth]);
        }

        for (auto& pair : node->children) {
            char childChar = pair.first;
            bool matchesQuery = isHighlighted && (childChar == nextChar);
            buildVisualData(pair.second, currentId, depth + 1, nodeId, query, matchesQuery, nodesJson, linksJson);
        }
    }

public:
    Trie() {
        root = new TrieNode();
    }

    ~Trie() {
        delete root;
    }

    void insert(std::string word) {
        if (word.empty()) return;
        TrieNode* current = root;
        std::string lowerWord = word;
        std::transform(lowerWord.begin(), lowerWord.end(), lowerWord.begin(), ::tolower);

        for (char ch : lowerWord) {
            if (current->children.find(ch) == current->children.end()) {
                current->children[ch] = new TrieNode(ch);
            }
            current = current->children[ch];
        }
        current->isEndOfWord = true;
        current->data = word; // Store original casing
    }

    std::vector<std::string> search(std::string prefix) {
        std::vector<std::string> results;
        TrieNode* current = root;
        std::string lowerPrefix = prefix;
        std::transform(lowerPrefix.begin(), lowerPrefix.end(), lowerPrefix.begin(), ::tolower);

        for (char ch : lowerPrefix) {
            if (current->children.find(ch) == current->children.end()) {
                return results;
            }
            current = current->children[ch];
        }
        collectWords(current, results);
        return results;
    }

    std::string getVisualizationJson(const std::string& query) {
        std::vector<std::string> nodesJson;
        std::vector<std::string> linksJson;

        // Walk down the query path first to verify if path matches
        bool pathFound = true;
        TrieNode* current = root;
        std::string lowerQuery = query;
        std::transform(lowerQuery.begin(), lowerQuery.end(), lowerQuery.begin(), ::tolower);

        for (char ch : lowerQuery) {
            if (current->children.find(ch) == current->children.end()) {
                pathFound = false;
                break;
            }
            current = current->children[ch];
        }

        int startNodeId = 0;
        buildVisualData(root, "", 0, startNodeId, lowerQuery, pathFound, nodesJson, linksJson);

        std::stringstream ss;
        ss << "{\"nodes\":[";
        for (size_t i = 0; i < nodesJson.size(); i++) {
            ss << nodesJson[i] << (i + 1 < nodesJson.size() ? "," : "");
        }
        ss << "],\"links\":[";
        for (size_t i = 0; i < linksJson.size(); i++) {
            ss << linksJson[i] << (i + 1 < linksJson.size() ? "," : "");
        }
        ss << "]}";

        return ss.str();
    }
};

#endif
