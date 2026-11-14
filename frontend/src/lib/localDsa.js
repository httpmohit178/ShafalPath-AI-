const BANK = {
  Arrays: [
    ['Two Sum', 'two-sum', 'Easy', 'Use a hash map to find the matching complement in one pass.', 'Find two array values that sum to the target and return their indices.'],
    ['Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'Easy', 'Track the minimum price and the best profit seen so far.', 'Choose one buy day and one later sell day to maximize profit.'],
    ['Product of Array Except Self', 'product-of-array-except-self', 'Medium', 'Combine prefix and suffix products without division.', 'Return an output where each position is the product of every other input value.']
  ],
  Strings: [
    ['Valid Anagram', 'valid-anagram', 'Easy', 'Count characters and compare their frequencies.', 'Check whether two strings contain the same characters with the same counts.'],
    ['Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'Medium', 'Use a sliding window and remember the last index of each character.', 'Find the longest substring that contains no repeated characters.'],
    ['Valid Parentheses', 'valid-parentheses', 'Easy', 'Use a stack to match each closing bracket to the latest opening bracket.', 'Decide whether a string of brackets is properly nested and closed.']
  ],
  'Linked List': [
    ['Reverse Linked List', 'reverse-linked-list', 'Easy', 'Reverse one pointer at a time while retaining the next node.', 'Reverse the direction of all links and return the new head.'],
    ['Merge Two Sorted Lists', 'merge-two-sorted-lists', 'Easy', 'Advance the list with the smaller current value.', 'Merge two sorted linked lists into one sorted linked list.'],
    ['Linked List Cycle', 'linked-list-cycle', 'Easy', 'Use two pointers moving at different speeds.', 'Determine whether following links eventually revisits a node.']
  ],
  Trees: [
    ['Invert Binary Tree', 'invert-binary-tree', 'Easy', 'Swap the left and right child at every node.', 'Mirror a binary tree and return its root.'],
    ['Binary Tree Level Order Traversal', 'binary-tree-level-order-traversal', 'Medium', 'Use a queue to visit nodes one level at a time.', 'Return the node values grouped by tree depth.'],
    ['Validate Binary Search Tree', 'validate-binary-search-tree', 'Medium', 'Pass allowed lower and upper bounds down the tree.', 'Check whether every node satisfies binary search tree ordering.']
  ],
  Graphs: [
    ['Number of Islands', 'number-of-islands', 'Medium', 'Visit each connected land component with BFS or DFS.', 'Count connected groups of land cells in a grid.'],
    ['Clone Graph', 'clone-graph', 'Medium', 'Map original nodes to copies while traversing neighbors.', 'Create a deep copy of a connected graph.'],
    ['Course Schedule', 'course-schedule', 'Medium', 'Detect a cycle in the prerequisite dependency graph.', 'Determine whether all courses can be completed in prerequisite order.']
  ],
  'Dynamic Programming': [
    ['Climbing Stairs', 'climbing-stairs', 'Easy', 'Build each count from the previous two states.', 'Count the distinct ways to reach the top taking one or two steps.'],
    ['House Robber', 'house-robber', 'Medium', 'At each position compare skipping it with taking it plus the prior safe total.', 'Maximize the amount taken from non-adjacent houses.'],
    ['Coin Change', 'coin-change', 'Medium', 'Build the smallest coin count for each total up to the target.', 'Find the fewest coins needed to make the given amount.']
  ],
  Recursion: [
    ['Subsets', 'subsets', 'Medium', 'At each index choose to include or skip the current value.', 'Return every possible subset of the given distinct values.'],
    ['Permutations', 'permutations', 'Medium', 'Choose one unused value at each depth of the recursion.', 'Return all orderings of the input values.']
  ],
  'Binary Search': [
    ['Binary Search', 'binary-search', 'Easy', 'Discard half the remaining sorted range on each step.', 'Return the index of the target in a sorted array, or -1.'],
    ['Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'Medium', 'Identify which half is ordered before narrowing the range.', 'Find a target in a sorted array that was rotated at an unknown pivot.']
  ],
  'Stack/Queue': [
    ['Min Stack', 'min-stack', 'Medium', 'Store the current minimum alongside each stack state.', 'Build a stack that can return its minimum in constant time.'],
    ['Daily Temperatures', 'daily-temperatures', 'Medium', 'Use a monotonic stack to find the next warmer day.', 'For each day, report how many days until a warmer temperature.']
  ],
  Heap: [
    ['Top K Frequent Elements', 'top-k-frequent-elements', 'Medium', 'Count values and keep the k highest frequencies in a heap.', 'Return the k values that appear most often.'],
    ['Kth Largest Element in an Array', 'kth-largest-element-in-an-array', 'Medium', 'Use a size-k heap or selection algorithm.', 'Find the kth largest value without fully sorting the array.']
  ],
  Greedy: [
    ['Jump Game', 'jump-game', 'Medium', 'Track the farthest index reachable so far.', 'Decide whether jumps from the first index can reach the final index.'],
    ['Maximum Subarray', 'maximum-subarray', 'Medium', 'Keep the best subarray ending at the current position.', 'Find the contiguous subarray with the largest sum.']
  ],
  'Sliding Window': [
    ['Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'Medium', 'Move the left edge when a duplicate enters the current window.', 'Find the longest substring that contains no repeated characters.'],
    ['Minimum Size Subarray Sum', 'minimum-size-subarray-sum', 'Medium', 'Shrink the window as long as its sum still reaches the target.', 'Find the shortest contiguous subarray whose sum is at least the target.']
  ]
};

export function localDsaRecommendations(topics = ['Arrays'], company = 'Daily mix') {
  const day = Math.floor(Date.now() / 86400000);
  return topics.slice(0, 6).flatMap((topic) => {
    const problems = BANK[topic] || BANK.Arrays;
    return [0, 1].map((offset) => {
      const [title, slug, difficulty, summary, description] = problems[(day + offset) % problems.length];
      return { title, topic, company, difficulty, summary, description, leetcodeUrl: `https://leetcode.com/problems/${slug}/` };
    });
  });
}
