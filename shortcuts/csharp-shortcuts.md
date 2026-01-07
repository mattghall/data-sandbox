# C# Interview Cheat Sheet

## Strings

```csharp
s.Length;
s[i];
s.Substring(start, end - start);
s.IndexOf("abc");
s.Equals(other);
s.ToCharArray();
num.ToString();

StringBuilder sb = new StringBuilder();
sb.Append("text");
sb.ToString();
```

## Arrays

```csharp
int[] arr = new int[] {1, 2, 3};
Array.Sort(arr);
Array.BinarySearch(arr, target);
arr.SequenceEqual(b);

int[,] grid = new int[rows, cols];
// or
int[][] jaggedGrid = new int[rows][];
```

## Loops

### Enhanced for-each loop
```csharp
// Arrays
foreach (int num in arr)
{
    Console.WriteLine(num);
}

// Collections
foreach (string item in list)
{
    // process item
}

// 2D arrays
foreach (int[] row in grid)
{
    foreach (int cell in row)
    {
        // process cell
    }
}
```

### Traditional for loop
```csharp
// Standard iteration
for (int i = 0; i < arr.Length; i++)
{
    // access arr[i]
}

// Reverse iteration
for (int i = arr.Length - 1; i >= 0; i--)
{
    // process backwards
}

// Step by 2
for (int i = 0; i < n; i += 2)
{
    // skip every other
}
```

### While loops
```csharp
// Standard while
int i = 0;
while (i < n)
{
    // process
    i++;
}

// Do-while (executes at least once)
do
{
    // process
    i++;
} while (i < n);
```

### Loop with Dictionary/Set iteration
```csharp
// Dictionary iteration
foreach (KeyValuePair<string, int> entry in dict)
{
    string key = entry.Key;
    int value = entry.Value;
}

// Keys only
foreach (string key in dict.Keys)
{
    // process key
}

// Values only  
foreach (int value in dict.Values)
{
    // process value
}

// Set iteration
foreach (string item in set)
{
    // process item
}
```

## Collections

### List
```csharp
List<int> list = new List<int>();
list.Add(x);
list[i];
list[i] = val;
list.RemoveAt(i);
list.Count;
list.Sort();
```

### HashSet
```csharp
HashSet<int> set = new HashSet<int>();
set.Add(x);
set.Contains(x);
set.Remove(x);
```

### Dictionary
```csharp
Dictionary<string, int> dict = new Dictionary<string, int>();
dict[key] = val;
dict[key];
dict.TryGetValue(key, out int value);
dict.ContainsKey(key);
dict.Remove(key);
```

## Queue & Stack

### Queue (BFS)
```csharp
Queue<int> q = new Queue<int>();
q.Enqueue(x);
q.Dequeue();
q.Peek();
```

### Stack
```csharp
Stack<int> stack = new Stack<int>();
stack.Push(x);
stack.Pop();
stack.Peek();
```

## PriorityQueue (Heaps)

#### Min-heap
```csharp
// .NET 6+
PriorityQueue<int, int> pq = new PriorityQueue<int, int>();
pq.Enqueue(item, priority);
pq.Dequeue();

// Before .NET 6 - use SortedSet or custom implementation
SortedSet<int> minHeap = new SortedSet<int>();
```

#### Max-heap
```csharp
// .NET 6+ with custom comparer
PriorityQueue<int, int> pq = new PriorityQueue<int, int>(
    Comparer<int>.Create((a, b) => b.CompareTo(a)));
```

## Sorting

```csharp
Array.Sort(arr);
list.Sort();
list.Sort((a, b) => a.Value.CompareTo(b.Value));
```

## Streams

### Basic LINQ Operations
```csharp
// Filter, map, collect pattern
var result = list.Where(x => x > 5)
                 .Select(x => x * 2)
                 .ToList();

// Convert to array
int[] arr = list.Where(x => x > 0).ToArray();

// Aggregate (equivalent to reduce)
int sum = arr.Aggregate(0, (acc, x) => acc + x);
```

### Sort by Properties
```csharp
// Sort objects by property
list.Sort((a, b) => a.Name.CompareTo(b.Name));
list.Sort((a, b) => b.Age.CompareTo(a.Age)); // descending

// Multiple criteria
list.Sort((a, b) => a.Age == b.Age ? 
    a.Name.CompareTo(b.Name) : a.Age.CompareTo(b.Age));

// LINQ sorting (creates new sequence)
var sorted = people.OrderBy(p => p.Age).ToList();

// Sort by multiple fields
var sortedMultiple = people.OrderBy(p => p.Age)
                          .ThenBy(p => p.Name)
                          .ToList();
```

### Common LINQ Patterns
```csharp
// Group by property
var byCity = people.GroupBy(p => p.City)
                   .ToDictionary(g => g.Key, g => g.ToList());

// Find max/min by property
var oldest = people.OrderByDescending(p => p.Age).First();
// Or using MaxBy (.NET 6+)
var oldest = people.MaxBy(p => p.Age);

// Count occurrences
var counts = words.GroupBy(w => w)
                  .ToDictionary(g => g.Key, g => g.Count());
```

## Math Helpers

```csharp
Math.Max(a, b);
Math.Min(a, b);
Math.Abs(x);
Math.Pow(a, b);
Math.Sqrt(x);

((x % mod) + mod) % mod;  // safe modulo
```

## Common Patterns

### Two Pointers
```csharp
int i = 0, j = arr.Length - 1;
while (i < j)
{
    // logic
}
```

### Sliding Window
```csharp
int left = 0;
for (int right = 0; right < n; right++)
{
    // expand
    while (windowInvalid)
    {
        left++;
    }
}
```

### BFS
```csharp
Queue<int[]> q = new Queue<int[]>();
q.Enqueue(new int[] {r, c});
while (q.Count > 0)
{
    int[] current = q.Dequeue();
    int row = current[0], col = current[1];
}
```

### DFS
```csharp
void DFS(int node)
{
    if (visited[node]) return;
    visited[node] = true;
    foreach (int neighbor in graph[node])
        DFS(neighbor);
}
```

## Quick Data Structures

### Graph adjacency list
```csharp
List<List<int>> graph = new List<List<int>>();
for (int i = 0; i < n; i++)
    graph.Add(new List<int>());
graph[u].Add(v);
```

### Frequency map
```csharp
Dictionary<char, int> freq = new Dictionary<char, int>();
foreach (char c in s)
{
    if (freq.ContainsKey(c))
        freq[c]++;
    else
        freq[c] = 1;
}

// Or using TryGetValue
foreach (char c in s)
{
    freq.TryGetValue(c, out int count);
    freq[c] = count + 1;
}
```

## Redis

### Setup & Connection
```csharp
// Install-Package StackExchange.Redis
using StackExchange.Redis;

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost");
IDatabase db = redis.GetDatabase();
```

### String Operations
```csharp
db.StringSet("key", "value");
string value = db.StringGet("key");
db.StringIncrement("counter");
db.StringDecrement("counter");
db.StringIncrement("counter", 5);
db.KeyExpire("key", TimeSpan.FromSeconds(60));
TimeSpan? ttl = db.KeyTimeToLive("key");
db.KeyDelete("key");
bool exists = db.KeyExists("key");
```

### List Operations
```csharp
db.ListLeftPush("list", new RedisValue[] {"item1", "item2"});
db.ListRightPush("list", "item3");
RedisValue item = db.ListLeftPop("list");
RedisValue item = db.ListRightPop("list");
RedisValue[] range = db.ListRange("list", 0, -1);  // all
long length = db.ListLength("list");
RedisValue element = db.ListGetByIndex("list", 0);
```

### Hash Operations
```csharp
db.HashSet("user:123", "name", "John");
db.HashSet("user:123", "age", "25");
RedisValue name = db.HashGet("user:123", "name");
HashEntry[] user = db.HashGetAll("user:123");
db.HashDelete("user:123", "age");
bool exists = db.HashExists("user:123", "name");
RedisValue[] fields = db.HashKeys("user:123");
```

### Set Operations
```csharp
db.SetAdd("tags", new RedisValue[] {"csharp", "redis", "coding"});
db.SetRemove("tags", "coding");
RedisValue[] members = db.SetMembers("tags");
bool isMember = db.SetContains("tags", "csharp");
long size = db.SetLength("tags");
RedisValue[] union = db.SetCombine(SetOperation.Union, "set1", "set2");
RedisValue[] inter = db.SetCombine(SetOperation.Intersect, "set1", "set2");
```

### Sorted Set (ZSet)
```csharp
db.SortedSetAdd("leaderboard", "player1", 1000);
db.SortedSetAdd("leaderboard", "player2", 1500);
RedisValue[] top = db.SortedSetRangeByRank("leaderboard", 0, 9, Order.Descending);  // top 10
double? score = db.SortedSetScore("leaderboard", "player1");
long? rank = db.SortedSetRank("leaderboard", "player1");
long count = db.SortedSetLength("leaderboard");
db.SortedSetRemove("leaderboard", "player1");
```

### Common C# Patterns
```csharp
// Caching with JSON serialization
using System.Text.Json;

var user = new { Name = "John", Age = 25 };
string json = JsonSerializer.Serialize(user);
db.StringSet("user:123", json, TimeSpan.FromHours(1));
string cachedJson = db.StringGet("user:123");
var cached = JsonSerializer.Deserialize<dynamic>(cachedJson);

// Session management
public void SaveSession(string sessionId, Dictionary<string, object> data)
{
    foreach (var entry in data)
    {
        db.HashSet($"session:{sessionId}", entry.Key, entry.Value.ToString());
    }
    db.KeyExpire($"session:{sessionId}", TimeSpan.FromMinutes(30));
}

// Rate limiting
public bool IsRateLimited(string userId)
{
    string key = $"rate:limit:{userId}";
    return !db.StringSet(key, "1", TimeSpan.FromSeconds(60), When.NotExists);
}

// Distributed lock
public bool AcquireLock(string lockKey, TimeSpan expireTime)
{
    return db.StringSet(lockKey, "locked", expireTime, When.NotExists);
}
```