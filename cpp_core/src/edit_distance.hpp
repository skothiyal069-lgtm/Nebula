#ifndef EDIT_DISTANCE_HPP
#define EDIT_DISTANCE_HPP

#include <string>
#include <vector>
#include <algorithm>
#include <sstream>

struct PathStep {
    int r;
    int c;
    std::string op;
};

class EditDistance {
public:
    static std::string computeJson(const std::string& word1, const std::string& word2) {
        int m = word1.length();
        int n = word2.length();

        std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));

        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = std::min({
                        dp[i - 1][j] + 1,    // Deletion
                        dp[i][j - 1] + 1,    // Insertion
                        dp[i - 1][j - 1] + 1 // Replacement
                    });
                }
            }
        }

        // Traceback path
        std::vector<PathStep> path;
        int i = m;
        int j = n;
        path.push_back({i, j, "End"});

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && word1[i - 1] == word2[j - 1]) {
                path.push_back({i - 1, j - 1, "Match"});
                i--;
                j--;
            } else {
                int deletion = (i > 0) ? dp[i - 1][j] : 999999;
                int insertion = (j > 0) ? dp[i][j - 1] : 999999;
                int substitution = (i > 0 && j > 0) ? dp[i - 1][j - 1] : 999999;

                int minCost = std::min({deletion, insertion, substitution});

                if (minCost == substitution) {
                    path.push_back({i - 1, j - 1, "Substitute"});
                    i--;
                    j--;
                } else if (minCost == deletion) {
                    path.push_back({i - 1, j, "Delete"});
                    i--;
                } else {
                    path.push_back({i, j - 1, "Insert"});
                    j--;
                }
            }
        }

        std::reverse(path.begin(), path.end());

        // Format to JSON
        std::stringstream ss;
        ss << "{"
           << "\"distance\":" << dp[m][n] << ","
           << "\"matrix\":[";
        for (int r = 0; r <= m; r++) {
            ss << "[";
            for (int c = 0; c <= n; c++) {
                ss << dp[r][c] << (c < n ? "," : "");
            }
            ss << "]" << (r < m ? "," : "");
        }
        ss << "],\"path\":[";
        for (size_t p = 0; p < path.size(); p++) {
            ss << "{"
               << "\"r\":" << path[p].r << ","
               << "\"c\":" << path[p].c << ","
               << "\"op\":\"" << path[p].op << "\""
               << "}" << (p + 1 < path.size() ? "," : "");
        }
        ss << "]}";

        return ss.str();
    }
};

#endif
