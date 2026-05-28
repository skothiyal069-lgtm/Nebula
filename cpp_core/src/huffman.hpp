#ifndef HUFFMAN_HPP
#define HUFFMAN_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <sstream>
#include <iomanip>

struct HuffmanNode {
    char ch;
    int freq;
    HuffmanNode* left;
    HuffmanNode* right;

    HuffmanNode(char c, int f, HuffmanNode* l = nullptr, HuffmanNode* r = nullptr)
        : ch(c), freq(f), left(l), right(r) {}

    ~HuffmanNode() {
        delete left;
        delete right;
    }
};

struct CompareNode {
    bool operator()(HuffmanNode* const& n1, HuffmanNode* const& n2) {
        return n1->freq > n2->freq;
    }
};

class HuffmanCoding {
private:
    HuffmanNode* root;
    std::unordered_map<char, std::string> codes;
    std::unordered_map<char, int> frequencies;

    void generateCodes(HuffmanNode* node, const std::string& code) {
        if (!node) return;

        if (node->ch != '\0') {
            codes[node->ch] = code;
            return;
        }

        generateCodes(node->left, code + "0");
        generateCodes(node->right, code + "1");
    }

    void buildVisualData(HuffmanNode* node, std::string parentId, const std::string& path, int& idCounter,
                         std::vector<std::string>& nodesJson, std::vector<std::string>& linksJson) {
        if (!node) return;

        std::string currentId = "huff-" + std::to_string(idCounter++);
        
        std::string label = "";
        std::string isLeaf = (node->ch != '\0') ? "true" : "false";
        
        if (node->ch != '\0') {
            // Escape special chars
            if (node->ch == '\n') label = "\\n";
            else if (node->ch == '"') label = "\\\"";
            else if (node->ch == '\\') label = "\\\\";
            else label = std::string(1, node->ch);
            label = "'" + label + "'";
        } else {
            label = "sum:" + std::to_string(node->freq);
        }

        std::stringstream ss;
        ss << "{"
           << "\"id\":\"" << currentId << "\","
           << "\"label\":\"" << label << "\","
           << "\"freq\":" << node->freq << ","
           << "\"isLeaf\":" << isLeaf << ","
           << "\"code\":\"" << (node->ch != '\0' ? codes[node->ch] : "") << "\","
           << "\"path\":\"" << path << "\""
           << "}";
        nodesJson.push_back(ss.str());

        if (!parentId.empty()) {
            std::stringstream linkSs;
            linkSs << "{"
                   << "\"source\":\"" << parentId << "\","
                   << "\"target\":\"" << currentId << "\","
                   << "\"bit\":\"" << path.substr(path.length() - 1) << "\""
                   << "}";
            linksJson.push_back(linkSs.str());
        }

        buildVisualData(node->left, currentId, path + "0", idCounter, nodesJson, linksJson);
        buildVisualData(node->right, currentId, path + "1", idCounter, nodesJson, linksJson);
    }

public:
    HuffmanCoding() : root(nullptr) {}

    ~HuffmanCoding() {
        delete root;
    }

    void buildTree(const std::string& text) {
        if (text.empty()) return;

        delete root;
        root = nullptr;
        codes.clear();
        frequencies.clear();

        for (char ch : text) {
            frequencies[ch]++;
        }

        std::priority_queue<HuffmanNode*, std::vector<HuffmanNode*>, CompareNode> pq;

        for (auto& pair : frequencies) {
            pq.push(new HuffmanNode(pair.first, pair.second));
        }

        // Edge case: single character
        if (pq.size() == 1) {
            HuffmanNode* single = pq.top();
            pq.pop();
            root = new HuffmanNode('\0', single->freq, single, nullptr);
            generateCodes(root, "");
            return;
        }

        while (pq.size() > 1) {
            HuffmanNode* left = pq.top();
            pq.pop();
            HuffmanNode* right = pq.top();
            pq.pop();

            HuffmanNode* parent = new HuffmanNode('\0', left->freq + right->freq, left, right);
            pq.push(parent);
        }

        if (!pq.empty()) {
            root = pq.top();
        }
        
        generateCodes(root, "");
    }

    std::string encode(const std::string& text) {
        std::string encoded = "";
        for (char ch : text) {
            encoded += codes[ch];
        }
        return encoded;
    }

    std::string getVisualizationJson(const std::string& text) {
        buildTree(text);
        std::string encoded = encode(text);

        std::vector<std::string> nodesJson;
        std::vector<std::string> linksJson;
        int idCounter = 0;
        buildVisualData(root, "", "", idCounter, nodesJson, linksJson);

        int originalBits = text.length() * 8;
        int compressedBits = encoded.length();
        double ratio = (originalBits > 0) ? ((double)(originalBits - compressedBits) / originalBits * 100.0) : 0.0;

        // Escape input text for JSON safety
        std::string escapedText = "";
        for (char c : text) {
            if (c == '"') escapedText += "\\\"";
            else if (c == '\\') escapedText += "\\\\";
            else if (c == '\n') escapedText += "\\n";
            else escapedText += c;
        }

        std::stringstream ss;
        ss << "{"
           << "\"text\":\"" << escapedText << "\","
           << "\"encoded\":\"" << encoded << "\","
           << "\"nodes\":[";
        for (size_t i = 0; i < nodesJson.size(); i++) {
            ss << nodesJson[i] << (i + 1 < nodesJson.size() ? "," : "");
        }
        ss << "],\"links\":[";
        for (size_t i = 0; i < linksJson.size(); i++) {
            ss << linksJson[i] << (i + 1 < linksJson.size() ? "," : "");
        }
        ss << "],\"codes\":{";
        size_t cIdx = 0;
        for (auto& pair : codes) {
            std::string chKey = std::string(1, pair.first);
            if (pair.first == '\n') chKey = "\\n";
            else if (pair.first == '"') chKey = "\\\"";
            else if (pair.first == '\\') chKey = "\\\\";
            
            ss << "\"" << chKey << "\":\"" << pair.second << "\""
               << (cIdx + 1 < codes.size() ? "," : "");
            cIdx++;
        }
        ss << "},\"stats\":{"
           << "\"originalBits\":" << originalBits << ","
           << "\"compressedBits\":" << compressedBits << ","
           << "\"compressionRatio\":" << std::fixed << std::setprecision(1) << ratio
           << "}}";

        return ss.str();
    }
};

#endif
