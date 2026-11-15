const templates = [
  {
    title: 'Pair Sum', topic: 'Arrays · Hash Map', expectedOutput: '[0,1]',
    statement: 'Given an array of integers and a target, return the indices of the two values that add up to the target. Exactly one answer exists.',
    examples: ['nums = [2,7,11,15], target = 9 → [0,1]', 'nums = [3,2,4], target = 6 → [1,2]'], constraints: ['2 ≤ nums.length ≤ 10⁴', 'Do not use the same element twice.'], hint: 'Store values you have already seen in a map.',
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Return the matching indices.\n}\nconsole.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));',
      python: 'import json\ndef two_sum(nums, target):\n    # Return the matching indices.\n    pass\nprint(json.dumps(two_sum([2, 7, 11, 15], 9), separators=(",", ":")))',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n  // Return the matching indices.\n  return {};\n}\nint main(){vector<int> n{2,7,11,15};auto a=twoSum(n,9);cout<<"["<<a[0]<<","<<a[1]<<"]";}',
      java: 'class Main {\n static int[] twoSum(int[] nums,int target){ return new int[0]; }\n public static void main(String[] args){int[] a=twoSum(new int[]{2,7,11,15},9);System.out.print("["+a[0]+","+a[1]+"]");}\n}'
    }
  },
  {
    title: 'Reverse a String', topic: 'Strings · Two Pointers', expectedOutput: 'lafas',
    statement: 'Write a function that returns a string with its characters in reverse order. Do not use a built-in reverse helper.',
    examples: ['s = "safal" → "lafas"', 's = "code" → "edoc"'], constraints: ['0 ≤ s.length ≤ 10⁴', 'The input contains printable ASCII characters.'], hint: 'Use two pointers or build the output from the last character to the first.',
    starterCode: {
      javascript: 'function reverseString(s) {\n  // Return the reversed string.\n}\nconsole.log(reverseString("safal"));',
      python: 'def reverse_string(s):\n    # Return the reversed string.\n    pass\nprint(reverse_string("safal"))',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nstring reverseString(string s){ return ""; }\nint main(){cout<<reverseString("safal");}',
      java: 'class Main {\n static String reverseString(String s){ return ""; }\n public static void main(String[] args){System.out.print(reverseString("safal"));}\n}'
    }
  },
  {
    title: 'Valid Parentheses', topic: 'Stacks · Strings', expectedOutput: 'true',
    statement: 'Given a string containing only (), [] and {}, return true if every opening bracket is closed by the same type in the correct order.',
    examples: ['s = "()[]{}" → true', 's = "([)]" → false'], constraints: ['0 ≤ s.length ≤ 10⁴'], hint: 'Keep opening brackets on a stack and match each closing bracket with the latest one.',
    starterCode: {
      javascript: 'function isValid(s) {\n  // Return true when brackets match.\n}\nconsole.log(isValid("()[]{}"));',
      python: 'def is_valid(s):\n    # Return True when brackets match.\n    pass\nprint(str(is_valid("()[]{}")).lower())',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nbool isValid(string s){ return false; }\nint main(){cout<<(isValid("()[]{}")?"true":"false");}',
      java: 'class Main {\n static boolean isValid(String s){ return false; }\n public static void main(String[] args){System.out.print(isValid("()[]{}"));}\n}'
    }
  },
  {
    title: 'Best Time to Buy and Sell', topic: 'Arrays · Greedy', expectedOutput: '5',
    statement: 'Given daily stock prices, return the maximum profit from one buy followed by one later sell. Return 0 if no profit is possible.',
    examples: ['prices = [7,1,5,3,6,4] → 5', 'prices = [7,6,4,3,1] → 0'], constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'], hint: 'Track the lowest price seen so far and the best profit at each step.',
    starterCode: {
      javascript: 'function maxProfit(prices) {\n  // Return the best single-transaction profit.\n}\nconsole.log(maxProfit([7, 1, 5, 3, 6, 4]));',
      python: 'def max_profit(prices):\n    # Return the best single-transaction profit.\n    pass\nprint(max_profit([7, 1, 5, 3, 6, 4]))',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint maxProfit(vector<int>& p){ return 0; }\nint main(){vector<int> p{7,1,5,3,6,4};cout<<maxProfit(p);}',
      java: 'class Main {\n static int maxProfit(int[] p){ return 0; }\n public static void main(String[] args){System.out.print(maxProfit(new int[]{7,1,5,3,6,4}));}\n}'
    }
  },
  {
    title: 'Binary Search', topic: 'Arrays · Binary Search', difficulty: 'Easy', expectedOutput: '3',
    statement: 'Given a sorted array and a target, return the target index or -1 when it is absent. Use O(log n) time.',
    examples: ['nums = [-1,0,3,5,9,12], target = 5 → 3', 'nums = [-1,0,3,5,9,12], target = 2 → -1'], constraints: ['1 ≤ nums.length ≤ 10⁴', 'Values are sorted in ascending order.'], hint: 'Keep a left and right boundary and halve the search range each step.',
    starterCode: { javascript: 'function search(nums, target) {\n  // Return the index or -1.\n}\nconsole.log(search([-1, 0, 3, 5, 9, 12], 5));' }
  },
  {
    title: 'Maximum Subarray', topic: 'Arrays · Dynamic Programming', difficulty: 'Medium', expectedOutput: '6',
    statement: 'Return the largest sum of any non-empty contiguous subarray.',
    examples: ['nums = [-2,1,-3,4,-1,2,1,-5,4] → 6', 'nums = [1] → 1'], constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁴ ≤ nums[i] ≤ 10⁴'], hint: 'At each position, decide whether to extend the current range or start a new one.',
    starterCode: { javascript: 'function maxSubArray(nums) {\n  // Return the maximum contiguous sum.\n}\nconsole.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]));' }
  },
  {
    title: 'First Non-Repeating Character', topic: 'Strings · Hash Map', difficulty: 'Easy', expectedOutput: '0',
    statement: 'Return the index of the first character that appears exactly once, or -1 if every character repeats.',
    examples: ['s = "leetcode" → 0', 's = "aabb" → -1'], constraints: ['1 ≤ s.length ≤ 10⁵', 'The input contains lowercase English letters.'], hint: 'Count character frequency in one pass, then scan the string again.',
    starterCode: { javascript: 'function firstUniqueChar(s) {\n  // Return the first unique character index.\n}\nconsole.log(firstUniqueChar("leetcode"));' }
  },
  {
    title: 'Move Zeroes', topic: 'Arrays · Two Pointers', difficulty: 'Easy', expectedOutput: '[1,3,12,0,0]',
    statement: 'Move every zero to the end of the array while keeping the order of non-zero values. Modify the array in place.',
    examples: ['nums = [0,1,0,3,12] → [1,3,12,0,0]', 'nums = [0] → [0]'], constraints: ['1 ≤ nums.length ≤ 10⁴', 'Do not create another array.'], hint: 'Write non-zero values forward, then fill the remaining positions with zero.',
    starterCode: { javascript: 'function moveZeroes(nums) {\n  // Modify nums in place.\n  return nums;\n}\nconsole.log(JSON.stringify(moveZeroes([0, 1, 0, 3, 12])));' }
  },
  {
    title: 'Longest Common Prefix', topic: 'Strings · Scanning', difficulty: 'Easy', expectedOutput: 'fl',
    statement: 'Return the longest prefix shared by every string in the array. Return an empty string when none is shared.',
    examples: ['["flower","flow","flight"] → "fl"', '["dog","racecar","car"] → ""'], constraints: ['1 ≤ strs.length ≤ 200', 'Strings contain lowercase English letters.'], hint: 'Compare characters at each position until one string differs or ends.',
    starterCode: { javascript: 'function longestCommonPrefix(strs) {\n  // Return the shared prefix.\n}\nconsole.log(longestCommonPrefix(["flower", "flow", "flight"]));' }
  },
  {
    title: 'Longest Consecutive Sequence', topic: 'Arrays · Hash Set', difficulty: 'Hard', expectedOutput: '4',
    statement: 'Given an unsorted array of integers, return the length of the longest consecutive elements sequence. Your solution should run in O(n) time.',
    examples: ['nums = [100,4,200,1,3,2] → 4', 'nums = [0,3,7,2,5,8,4,6,0,1] → 9'], constraints: ['0 ≤ nums.length ≤ 10⁵', '−10⁹ ≤ nums[i] ≤ 10⁹'], hint: 'Put values in a set and only start counting from values that have no predecessor.',
    starterCode: { javascript: 'function longestConsecutive(nums) {\n  // Return the longest consecutive run length.\n}\nconsole.log(longestConsecutive([100, 4, 200, 1, 3, 2]));' }
  }
];

export function makeLocalChallenge(previousTitles = [], difficulty = 'Easy', topic = 'Random topic') {
  const previous = new Set(previousTitles.map((title) => String(title).toLowerCase()));
  const topicKey = String(topic).toLowerCase().split(/\s+/)[0];
  const matching = topicKey === 'random' ? templates : templates.filter((item) => item.topic.toLowerCase().includes(topicKey));
  const source = matching.length ? matching : templates;
  const difficultyMatches = difficulty === 'Random' ? source : source.filter((item) => (item.difficulty || 'Easy') === difficulty);
  const tier = difficultyMatches.length ? difficultyMatches : source;
  const available = tier.filter((item) => !previous.has(item.title.toLowerCase()));
  const pool = available.length ? available : tier;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return { ...selected, id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, difficulty: selected.difficulty || difficulty, acceptance: 'Practice', hint: selected.hint, generatedBy: 'local' };
}
