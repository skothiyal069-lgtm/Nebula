CXX = clang++
CXXFLAGS = -std=c++17 -O3 -Wall

TARGET = nebula_core
SRC = src/main.cpp

all: $(TARGET)

$(TARGET): $(SRC) src/trie.hpp src/huffman.hpp src/graph.hpp src/priority_queue.hpp src/edit_distance.hpp
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

clean:
	rm -f $(TARGET)

.PHONY: all clean
