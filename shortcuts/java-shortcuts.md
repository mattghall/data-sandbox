# Java Interview Cheat Sheet

## Strings

```java
s.length();
s.charAt(i);
s.substring(start, end);
s.indexOf("abc");
s.equals(other);
s.toCharArray();
String.valueOf(num);

StringBuilder sb = new StringBuilder();
sb.append("text");
sb.toString();
```

## Arrays

```java
int[] arr = new int[]{1,2,3};
Arrays.sort(arr);
Arrays.binarySearch(arr, target);
Arrays.equals(a, b);

int[][] grid = new int[rows][cols];
```

## Loops

### Enhanced for-each loop
```java
// Arrays
for (int num : arr) {
    System.out.println(num);
}

// Collections
for (String item : list) {
    // process item
}

// 2D arrays
for (int[] row : grid) {
    for (int cell : row) {
        // process cell
    }
}
```

### Traditional for loop
```java
// Standard iteration
for (int i = 0; i < arr.length; i++) {
    // access arr[i]
}

// Reverse iteration
for (int i = arr.length - 1; i >= 0; i--) {
    // process backwards
}

// Step by 2
for (int i = 0; i < n; i += 2) {
    // skip every other
}
```

### While loops
```java
// Standard while
int i = 0;
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
```java
// Map iteration
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    String key = entry.getKey();
    Integer value = entry.getValue();
}

// Keys only
for (String key : map.keySet()) {
    // process key
}

// Values only  
for (Integer value : map.values()) {
    // process value
}

// Set iteration
for (String item : set) {
    // process item
}
```

## Collections

### List
```java
List<Integer> list = new ArrayList<>();
list.add(x);
list.get(i);
list.set(i, val);
list.remove(i);
list.size();
Collections.sort(list);
```

### Set
```java
Set<Integer> set = new HashSet<>();
set.add(x);
set.contains(x);
set.remove(x);
```

### Map
```java
Map<String, Integer> map = new HashMap<>();
map.put(key, val);
map.get(key);
map.getOrDefault(key, 0);
map.containsKey(key);
map.remove(key);
```

## Queue & Stack

### Queue (BFS)
```java
Queue<Integer> q = new LinkedList<>();
q.offer(x);
q.poll();
q.peek();
```

### Stack
```java
Stack<Integer> stack = new Stack<>();
stack.push(x);
stack.pop();
stack.peek();
```

## PriorityQueue (Heaps)

### Min-heap
```java
PriorityQueue<Integer> pq = new PriorityQueue<>();
```

### Max-heap
```java
PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
```

## Sorting

```java
Arrays.sort(arr);
Collections.sort(list);

list.sort((a, b) -> a.value - b.value);
```

## Streams

### Basic Stream Operations
```java
list.stream()
    .filter(x -> x > 5)
    .map(x -> x * 2)
    .collect(Collectors.toList());

// Convert to array
int[] arr = list.stream().mapToInt(i -> i).toArray();
```

### Sort by Properties
```java
// Sort objects by property
list.sort(Comparator.comparing(Person::getName));
list.sort(Comparator.comparing(Person::getAge).reversed());

// Multiple criteria
list.sort(Comparator.comparing(Person::getAge)
          .thenComparing(Person::getName));

// Custom comparator with streams
List<Person> sorted = people.stream()
    .sorted(Comparator.comparing(Person::getAge))
    .collect(Collectors.toList());

// Sort by multiple fields
people.sort(Comparator.comparing((Person p) -> p.age)
            .thenComparing(p -> p.name));
```

### Common Stream Patterns
```java
// Group by property
Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::getCity));

// Find max/min by property
Optional<Person> oldest = people.stream()
    .max(Comparator.comparing(Person::getAge));

// Count occurrences
Map<String, Long> counts = words.stream()
    .collect(Collectors.groupingBy(w -> w, Collectors.counting()));
```

## Math Helpers

```java
Math.max(a, b);
Math.min(a, b);
Math.abs(x);
Math.pow(a, b);
Math.sqrt(x);

((x % mod) + mod) % mod;  // safe modulo
```

## Common Patterns

### Two Pointers
```java
int i = 0, j = arr.length - 1;
while (i < j) {
    // logic
}
```

### Sliding Window
```java
int left = 0;
for (int right = 0; right < n; right++) {
    // expand
    while (windowInvalid) {
        left++;
    }
}
```

### BFS
```java
Queue<int[]> q = new LinkedList<>();
q.offer(new int[]{r, c});
while (!q.isEmpty()) {
    int[] cur = q.poll();
}
```

### DFS
```java
void dfs(int node) {
    if (visited[node]) return;
    visited[node] = true;
    for (int nei : graph[node]) dfs(nei);
}
```

## Quick Data Structures

### Graph adjacency list
```java
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
graph.get(u).add(v);
```

### Frequency map
```java
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}
```

## Redis

### Setup & Connection
```java
// Add dependency: jedis:4.4.0
Jedis jedis = new Jedis("localhost", 6379);
JedisPool pool = new JedisPool("localhost", 6379);

// With connection pool (recommended)
try (Jedis jedis = pool.getResource()) {
    // operations here
}
```

### String Operations
```java
jedis.set("key", "value");
String value = jedis.get("key");
jedis.incr("counter");
jedis.decr("counter");
jedis.incrBy("counter", 5);
jedis.expire("key", 60);  // seconds
jedis.ttl("key");         // time to live
jedis.del("key");
jedis.exists("key");
```

### List Operations
```java
jedis.lpush("list", "item1", "item2");
jedis.rpush("list", "item3");
String item = jedis.lpop("list");
String item = jedis.rpop("list");
List<String> range = jedis.lrange("list", 0, -1);  // all
Long length = jedis.llen("list");
String element = jedis.lindex("list", 0);
```

### Hash Operations
```java
jedis.hset("user:123", "name", "John");
jedis.hset("user:123", "age", "25");
String name = jedis.hget("user:123", "name");
Map<String, String> user = jedis.hgetAll("user:123");
jedis.hdel("user:123", "age");
Boolean exists = jedis.hexists("user:123", "name");
Set<String> fields = jedis.hkeys("user:123");
```

### Set Operations
```java
jedis.sadd("tags", "java", "redis", "coding");
jedis.srem("tags", "coding");
Set<String> members = jedis.smembers("tags");
Boolean isMember = jedis.sismember("tags", "java");
Long size = jedis.scard("tags");
Set<String> union = jedis.sunion("set1", "set2");
Set<String> inter = jedis.sinter("set1", "set2");
```

### Sorted Set (ZSet)
```java
jedis.zadd("leaderboard", 1000, "player1");
jedis.zadd("leaderboard", 1500, "player2");
List<String> top = jedis.zrevrange("leaderboard", 0, 9);  // top 10
Double score = jedis.zscore("leaderboard", "player1");
Long rank = jedis.zrank("leaderboard", "player1");
Long count = jedis.zcard("leaderboard");
jedis.zrem("leaderboard", "player1");
```

### Common Java Patterns
```java
// Caching with JSON serialization
ObjectMapper mapper = new ObjectMapper();
User user = new User("John", 25);
jedis.setex("user:123", 3600, mapper.writeValueAsString(user));
String json = jedis.get("user:123");
User cached = mapper.readValue(json, User.class);

// Session management
public void saveSession(String sessionId, Map<String, Object> data) {
    for (Map.Entry<String, Object> entry : data.entrySet()) {
        jedis.hset("session:" + sessionId, entry.getKey(), 
                  entry.getValue().toString());
    }
    jedis.expire("session:" + sessionId, 1800);  // 30 min
}

// Rate limiting
public boolean isRateLimited(String userId) {
    String key = "rate:limit:" + userId;
    String result = jedis.set(key, "1", SetParams.setParams().nx().ex(60));
    return result == null;  // null means key already exists
}

// Distributed lock
public boolean acquireLock(String lockKey, int expireTime) {
    String result = jedis.set(lockKey, "locked", 
                             SetParams.setParams().nx().ex(expireTime));
    return "OK".equals(result);
}
```