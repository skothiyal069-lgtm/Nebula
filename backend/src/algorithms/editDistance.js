export function computeEditDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;

  // Initialize matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // Deletion
          dp[i][j - 1] + 1,    // Insertion
          dp[i - 1][j - 1] + 1 // Replacement
        );
      }
    }
  }

  // Traceback to find the alignment path
  const path = [];
  let i = m;
  let j = n;
  
  path.push({ r: i, c: j, op: 'End' });
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && word1[i - 1] === word2[j - 1]) {
      path.push({ r: i - 1, c: j - 1, op: 'Match' });
      i--;
      j--;
    } else {
      let currentVal = dp[i][j];
      let deletion = i > 0 ? dp[i - 1][j] : Infinity;
      let insertion = j > 0 ? dp[i][j - 1] : Infinity;
      let substitution = (i > 0 && j > 0) ? dp[i - 1][j - 1] : Infinity;

      let min = Math.min(deletion, insertion, substitution);

      if (min === substitution) {
        path.push({ r: i - 1, c: j - 1, op: 'Substitute' });
        i--;
        j--;
      } else if (min === deletion) {
        path.push({ r: i - 1, c: j, op: 'Delete' });
        i--;
      } else {
        path.push({ r: i, c: j - 1, op: 'Insert' });
        j--;
      }
    }
  }

  // Reverse path to trace from start (0,0) to end (m,n)
  path.reverse();

  return {
    distance: dp[m][n],
    matrix: dp,
    path
  };
}

// Predict response based on similarity (edit distance)
export function getSmartReplySuggestions(userMessage, templates = []) {
  if (!userMessage) return [];
  
  const suggestions = templates.map(template => {
    const result = computeEditDistance(userMessage.toLowerCase(), template.phrase.toLowerCase());
    // Calculate normalized similarity percentage
    const maxLen = Math.max(userMessage.length, template.phrase.length);
    const similarity = maxLen === 0 ? 100 : ((maxLen - result.distance) / maxLen * 100);
    
    return {
      template: template.phrase,
      reply: template.reply,
      distance: result.distance,
      similarity: parseFloat(similarity.toFixed(1)),
      matrix: result.matrix,
      path: result.path
    };
  });

  // Sort by similarity descending
  return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// Standard cyberpunk AI suggestions
export const SUGGESTION_TEMPLATES = [
  { phrase: "hello", reply: "Salutations agent, what is the mission status?" },
  { phrase: "hi", reply: "Connection established. How can I assist you today?" },
  { phrase: "how are you", reply: "Systems operational. CPU temperature 38°C. Ready to assist." },
  { phrase: "need help", reply: "Decrypting support manuals. What protocol requires assistance?" },
  { phrase: "bye", reply: "Sign-off sequence initiated. Safe travels in the net." },
  { phrase: "what is nebula chat", reply: "Nebula Chat is a secure, high-speed quantum communication node." },
  { phrase: "meeting time", reply: "Sync sequence scheduled for 14:00 hours at node sector 7." },
  { phrase: "where are you", reply: "I live inside the machine, running alongside the local nodes." }
];
