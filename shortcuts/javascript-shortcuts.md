# JavaScript Interview Cheat Sheet

## Strings

```javascript
s.length;
s.charAt(i);
s.substring(start, end);
s.indexOf("abc");
s === other;
s.split('');
String(num);

let sb = [];
sb.push("text");
sb.join('');
```

## Arrays

```javascript
let arr = [1, 2, 3];
arr.sort((a, b) => a - b);
arr.indexOf(target);
JSON.stringify(a) === JSON.stringify(b);

let grid = Array(rows).fill().map(() => Array(cols));
```

## Loops

### Enhanced for-each loop
```javascript
// Arrays
for (let num of arr) {
    console.log(num);
}

// Collections
for (let item of list) {
    // process item
}

// 2D arrays
for (let row of grid) {
    for (let cell of row) {
        // process cell
    }
}
```

### Traditional for loop
```javascript
// Standard iteration
for (let i = 0; i < arr.length; i++) {
    // access arr[i]
}

// Reverse iteration
for (let i = arr.length - 1; i >= 0; i--) {
    // process backwards
}

// Step by 2
for (let i = 0; i < n; i += 2) {
    // skip every other
}
```

### While loops
```javascript
// Standard while
let i = 0;
while (i < n) {
    // process
    i++;
}

// Do-while (executes at least once)
do {
    // process
    i++;
} while (i < n);
```

### Loop with Map/Set iteration
```javascript
// Map iteration
for (let [key, value] of map) {
    // process key and value
}

// Keys only
for (let key of map.keys()) {
    // process key
}

// Values only  
for (let value of map.values()) {
    // process value
}

// Set iteration
for (let item of set) {
    // process item
}
```

## Collections

### Array (List equivalent)
```javascript
let list = [];
list.push(x);
list[i];
list[i] = val;
list.splice(i, 1);
list.length;
list.sort((a, b) => a - b);
```

### Set
```javascript
let set = new Set();
set.add(x);
set.has(x);
set.delete(x);
```

### Map
```javascript
let map = new Map();
map.set(key, val);
map.get(key);
map.get(key) || 0;
map.has(key);
map.delete(key);
```

## Queue & Stack

### Queue (BFS)
```javascript
let q = [];
q.push(x);
q.shift();
q[0];
```

### Stack
```javascript
let stack = [];
stack.push(x);
stack.pop();
stack[stack.length - 1];
```

## PriorityQueue (Heaps)

### Min-heap
```javascript
// No native PriorityQueue in JS
// Use library or manual implementation
class MinHeap {
    constructor() { this.heap = []; }
    push(val) { /* implementation */ }
    pop() { /* implementation */ }
}
```

### Max-heap
```javascript
// No native PriorityQueue in JS
// Use library or manual implementation
class MaxHeap {
    constructor() { this.heap = []; }
    push(val) { /* implementation */ }
    pop() { /* implementation */ }
}
```

## Sorting

```javascript
arr.sort((a, b) => a - b);
list.sort((a, b) => a - b);
list.sort((a, b) => a.value - b.value);
```

## Streams

### Basic Stream Operations
```javascript
// Filter, map, collect pattern
arr.filter(x => x > 5)
   .map(x => x * 2);

// Convert to array (already an array)
let result = list.filter(x => x > 0);

// Reduce (equivalent to collect)
let sum = arr.reduce((acc, x) => acc + x, 0);
```

### Sort by Properties
```javascript
// Sort objects by property
list.sort((a, b) => a.name.localeCompare(b.name));
list.sort((a, b) => b.age - a.age); // descending

// Multiple criteria
list.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));

// Functional sorting (creates new array)
let sorted = [...people].sort((a, b) => a.age - b.age);

// Sort by multiple fields with helper
people.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
```

### Common Stream Patterns
```javascript
// Group by property
let byCity = people.reduce((acc, person) => {
    acc[person.city] = acc[person.city] || [];
    acc[person.city].push(person);
    return acc;
}, {});

// Find max/min by property
let oldest = people.reduce((max, person) => 
    person.age > max.age ? person : max
);

// Count occurrences
let counts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
}, {});
```

## Math Helpers

```javascript
Math.max(a, b);
Math.min(a, b);
Math.abs(x);
Math.pow(a, b);
Math.sqrt(x);

((x % mod) + mod) % mod;  // safe modulo
```

## Common Patterns

### Two Pointers
```javascript
let i = 0, j = arr.length - 1;
while (i < j) {
    // logic
}
```

### Sliding Window
```javascript
let left = 0;
for (let right = 0; right < n; right++) {
    // expand
    while (windowInvalid) {
        left++;
    }
}
```

### BFS
```javascript
let q = [];
q.push([r, c]);
while (q.length > 0) {
    let [row, col] = q.shift();
}
```

### DFS
```javascript
function dfs(node) {
    if (visited[node]) return;
    visited[node] = true;
    for (let neighbor of graph[node]) dfs(neighbor);
}
```

## Quick Data Structures

### Graph adjacency list
```javascript
let graph = Array(n).fill().map(() => []);
graph[u].push(v);
```

### Frequency map
```javascript
let freq = new Map();
for (let c of s) {
    freq.set(c, (freq.get(c) || 0) + 1);
}

// Alternative with object
let freq = {};
for (let c of s) {
    freq[c] = (freq[c] || 0) + 1;
}
```

## Redis

### Setup & Connection
```javascript
// npm install redis
const redis = require('redis');
const client = redis.createClient({
    host: 'localhost',
    port: 6379
});

await client.connect();
```

### String Operations
```javascript
await client.set("key", "value");
let value = await client.get("key");
await client.incr("counter");
await client.decr("counter");
await client.incrBy("counter", 5);
await client.expire("key", 60);  // seconds
await client.ttl("key");         // time to live
await client.del("key");
await client.exists("key");
```

### List Operations
```javascript
await client.lPush("list", "item1", "item2");
await client.rPush("list", "item3");
let item = await client.lPop("list");
let item = await client.rPop("list");
let range = await client.lRange("list", 0, -1);  // all
let length = await client.lLen("list");
let element = await client.lIndex("list", 0);
```

### Hash Operations
```javascript
await client.hSet("user:123", "name", "John");
await client.hSet("user:123", "age", "25");
let name = await client.hGet("user:123", "name");
let user = await client.hGetAll("user:123");
await client.hDel("user:123", "age");
let exists = await client.hExists("user:123", "name");
let fields = await client.hKeys("user:123");
```

### Set Operations
```javascript
await client.sAdd("tags", "javascript", "redis", "coding");
await client.sRem("tags", "coding");
let members = await client.sMembers("tags");
let isMember = await client.sIsMember("tags", "javascript");
let size = await client.sCard("tags");
let union = await client.sUnion("set1", "set2");
let inter = await client.sInter("set1", "set2");
```

### Sorted Set (ZSet)
```javascript
await client.zAdd("leaderboard", { score: 1000, value: "player1" });
await client.zAdd("leaderboard", { score: 1500, value: "player2" });
let top = await client.zRevRange("leaderboard", 0, 9);  // top 10
let score = await client.zScore("leaderboard", "player1");
let rank = await client.zRank("leaderboard", "player1");
let count = await client.zCard("leaderboard");
await client.zRem("leaderboard", "player1");
```

### Common JavaScript Patterns
```javascript
// Caching with JSON serialization
const user = { name: "John", age: 25 };
await client.setEx("user:123", 3600, JSON.stringify(user));
const json = await client.get("user:123");
const cached = JSON.parse(json);

// Session management
async function saveSession(sessionId, data) {
    for (const [key, value] of Object.entries(data)) {
        await client.hSet(`session:${sessionId}`, key, String(value));
    }
    await client.expire(`session:${sessionId}`, 1800);  // 30 min
}

// Rate limiting
async function isRateLimited(userId) {
    const key = `rate:limit:${userId}`;
    const result = await client.set(key, "1", { EX: 60, NX: true });
    return result === null;  // null means key already exists
}

// Distributed lock
async function acquireLock(lockKey, expireTime) {
    const result = await client.set(lockKey, "locked", { EX: expireTime, NX: true });
    return result === "OK";
}
```