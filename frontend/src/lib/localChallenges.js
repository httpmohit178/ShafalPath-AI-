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
  }
];

export function makeLocalChallenge(previousTitles = [], difficulty = 'Easy') {
  const previous = new Set(previousTitles.map((title) => String(title).toLowerCase()));
  const available = templates.filter((item) => !previous.has(item.title.toLowerCase()));
  const pool = available.length ? available : templates;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return { ...selected, id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, difficulty: selected.difficulty || 'Easy', acceptance: 'Practice', hint: selected.hint, generatedBy: 'local' };
}
