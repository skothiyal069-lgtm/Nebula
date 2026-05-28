#ifndef PRIORITY_QUEUE_HPP
#define PRIORITY_QUEUE_HPP

#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

struct HeapItem {
    std::string id;
    std::string content;
    long long sendAt; // Epoch time in ms
    std::string recipientName;
};

class MinHeap {
private:
    std::vector<HeapItem> heap;

    int getParentIndex(int i) { return (i - 1) / 2; }
    int getLeftChildIndex(int i) { return 2 * i + 1; }
    int getRightChildIndex(int i) { return 2 * i + 2; }

    void swap(int i1, int i2) {
        HeapItem temp = heap[i1];
        heap[i1] = heap[i2];
        heap[i2] = temp;
    }

    void heapifyUp(int index) {
        int curr = index;
        int parent = getParentIndex(curr);

        while (curr > 0 && heap[curr].sendAt < heap[parent].sendAt) {
            swap(curr, parent);
            curr = parent;
            parent = getParentIndex(curr);
        }
    }

    void heapifyDown(int index) {
        int curr = index;
        int left = getLeftChildIndex(curr);
        int right = getRightChildIndex(curr);
        int smallest = curr;

        int size = heap.size();

        if (left < size && heap[left].sendAt < heap[smallest].sendAt) {
            smallest = left;
        }

        if (right < size && heap[right].sendAt < heap[smallest].sendAt) {
            smallest = right;
        }

        if (smallest != curr) {
            swap(curr, smallest);
            heapifyDown(smallest);
        }
    }

public:
    void insert(HeapItem item) {
        heap.push_back(item);
        heapifyUp(heap.size() - 1);
    }

    bool isEmpty() {
        return heap.empty();
    }

    HeapItem peek() {
        if (heap.empty()) return HeapItem{"", "", 0, ""};
        return heap[0];
    }

    HeapItem extractMin() {
        if (heap.empty()) return HeapItem{"", "", 0, ""};
        if (heap.size() == 1) {
            HeapItem item = heap.back();
            heap.pop_back();
            return item;
        }

        HeapItem min = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        heapifyDown(0);
        return min;
    }

    size_t size() {
        return heap.size();
    }

    std::string getVisualizationJson() {
        std::stringstream ss;
        ss << "{\"nodes\":[";
        for (size_t i = 0; i < heap.size(); i++) {
            // Truncate content for display
            std::string contentDisp = heap[i].content;
            if (contentDisp.length() > 15) {
                contentDisp = contentDisp.substr(0, 12) + "...";
            }
            // Escape quotes
            std::string escapedDisp = "";
            for (char c : contentDisp) {
                if (c == '"') escapedDisp += "\\\"";
                else if (c == '\\') escapedDisp += "\\\\";
                else escapedDisp += c;
            }

            ss << "{"
               << "\"index\":" << i << ","
               << "\"id\":\"heap-" << i << "\","
               << "\"label\":\"" << escapedDisp << "\","
               << "\"timestamp\":" << heap[i].sendAt << ","
               << "\"recipient\":\"" << heap[i].recipientName << "\""
               << "}" << (i + 1 < heap.size() ? "," : "");
        }
        ss << "],\"links\":[";

        std::vector<std::string> links;
        for (size_t i = 0; i < heap.size(); i++) {
            size_t left = getLeftChildIndex(i);
            size_t right = getRightChildIndex(i);
            if (left < heap.size()) {
                links.push_back("{\"source\":\"heap-" + std::to_string(i) + "\",\"target\":\"heap-" + std::to_string(left) + "\"}");
            }
            if (right < heap.size()) {
                links.push_back("{\"source\":\"heap-" + std::to_string(i) + "\",\"target\":\"heap-" + std::to_string(right) + "\"}");
            }
        }

        for (size_t i = 0; i < links.size(); i++) {
            ss << links[i] << (i + 1 < links.size() ? "," : "");
        }
        ss << "],\"array\":[";
        for (size_t i = 0; i < heap.size(); i++) {
            ss << "{"
               << "\"id\":\"" << heap[i].id << "\","
               << "\"content\":\"" << heap[i].content << "\","
               << "\"sendAt\":" << heap[i].sendAt << ","
               << "\"recipientName\":\"" << heap[i].recipientName << "\""
               << "}" << (i + 1 < heap.size() ? "," : "");
        }
        ss << "]}";

        return ss.str();
    }
};

#endif
