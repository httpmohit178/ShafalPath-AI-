import { useState } from 'react';
import { Play, Sparkles, Terminal, RotateCcw, CheckCircle2 } from 'lucide-react';
import { API } from '../context/AuthContext';

const STARTER_CODE = {
  javascript: `// Two Sum - Optimal O(n) HashMap Solution
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}

console.log("Indices:", JSON.stringify(twoSum([2, 7, 11, 15], 9)));`,
  python: `# Two Sum - Optimal O(n) Dictionary Solution
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []

print("Indices:", two_sum([2, 7, 11, 15], 9))`,
  cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        if (mp.count(target - nums[i])) {
            cout << "Indices: [" << mp[target - nums[i]] << ", " << i << "]" << endl;
            return 0;
        }
        mp[nums[i]] = i;
    }
    return 0;
}`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (map.containsKey(target - nums[i])) {
                System.out.println("Indices: [" + map.get(target - nums[i]) + ", " + i + "]");
                return;
            }
            map.put(nums[i], i);
        }
    }
}`,
};

export default function LiveCoding() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTER_CODE.javascript);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [running, setRunning] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang]);
    setOutput('');
    setError('');
    setAiReview('');
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('');
    setError('');
    try {
      const { data } = await API.post('/ai/run-code', { language, code, stdin, problemTitle: 'Two Sum' });
      setOutput(data.stdout || '(Program exited with no console output)');
      setError(data.stderr || '');
      setAiReview(data.aiReview || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live DSA Compiler & AI Code Coach</h1>
          <p className="text-sm opacity-70">Compile & run real code in 4 languages with instant Big-O complexity feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-4 py-2 rounded-xl border theme-card font-medium text-sm"
          >
            <option value="javascript">JavaScript (Node 18)</option>
            <option value="python">Python 3.10</option>
            <option value="cpp">C++ 17 (GCC)</option>
            <option value="java">Java 15</option>
          </select>
          <button
            onClick={() => setCode(STARTER_CODE[language])}
            className="p-2.5 rounded-xl border theme-card hover:opacity-80"
            title="Reset Starter Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {running ? 'Compiling...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border theme-card overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono opacity-75">
            <span>solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'js'}</span>
            <span>UTF-8 • Auto-Indent</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-[420px] p-4 font-mono text-sm bg-zinc-950 text-emerald-400 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border theme-card p-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Custom Input (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter custom test input..."
              className="w-full h-20 p-3 rounded-xl border theme-card font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border theme-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70">
              <Terminal className="w-4 h-4 text-orange-500" />
              <span>Console Output</span>
            </div>
            <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs min-h-[110px] whitespace-pre-wrap overflow-x-auto">
              {error ? <span className="text-red-400">{error}</span> : output || 'Click "Run Code" to see live output...'}
            </pre>
          </div>

          {aiReview && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                <Sparkles className="w-4 h-4" />
                <span>AI Complexity & Code Review</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line">{aiReview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
