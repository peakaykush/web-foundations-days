# SnapShare: System Architecture & Scaling Plan

This scaling plan details the architectural blueprint and capacity estimations for **SnapShare**, a photo-sharing platform where users publish photos and scroll an algorithmic and chronological feed of posts from creators they follow.

---

## 1. Assumptions & Baseline Numbers

- **Registered Users:** 10,000,000 (10 million).
- **Daily Active Users (DAU):** 10% of registered users = **1,000,000 active users / day**.
- **User Activity Patterns:**
  - Each active user uploads **1 photo / day**.
  - Each active user views **50 feed pages / day**.
- **Media File Sizes:**
  - Average original photo: **2 MB**.
  - Generated thumbnail: **50 KB** (0.05 MB).
  - Total storage per uploaded photo: **2.05 MB**.
- **Traffic Dynamics:**
  - Seconds per day: $24 \text{ hours} \times 60 \text{ minutes} \times 60 \text{ seconds} = 86,400 \text{ seconds}$.
  - Peak-to-average traffic multiplier: **$5\times$**.

---

## 2. Capacity Estimations & Calculations

### A. Photo Uploads per Second
- **Daily Uploads:**
  $$\text{Daily Uploads} = 1,000,000 \text{ active users} \times 1 \text{ upload/day} = 1,000,000 \text{ uploads/day}$$
- **Average Uploads / Second:**
  $$\text{Average Uploads/sec} = \frac{1,000,000 \text{ uploads}}{86,400 \text{ seconds}} \approx 11.57 \text{ uploads/sec} \approx 12 \text{ uploads/sec}$$
- **Peak Uploads / Second ($5\times$ multiplier):**
  $$\text{Peak Uploads/sec} = 11.57 \times 5 \approx 57.87 \text{ uploads/sec} \approx 58 \text{ uploads/sec}$$

### B. Feed Views per Second
- **Daily Feed Views:**
  $$\text{Daily Feed Views} = 1,000,000 \text{ active users} \times 50 \text{ views/day} = 50,000,000 \text{ feed views/day}$$
- **Average Feed Views / Second:**
  $$\text{Average Feed Views/sec} = \frac{50,000,000 \text{ views}}{86,400 \text{ seconds}} \approx 578.7 \text{ views/sec} \approx 579 \text{ views/sec}$$
- **Peak Feed Views / Second ($5\times$ multiplier):**
  $$\text{Peak Feed Views/sec} = 578.7 \times 5 \approx 2,893.5 \text{ views/sec} \approx 2,894 \text{ views/sec}$$

### C. Photo Storage per Year
- **Daily Storage Ingestion:**
  - Original photos: $1,000,000 \times 2 \text{ MB} = 2,000,000 \text{ MB} = 2,000 \text{ GB} = 2 \text{ TB / day}$
  - Thumbnails: $1,000,000 \times 0.05 \text{ MB} = 50,000 \text{ MB} = 50 \text{ GB} = 0.05 \text{ TB / day}$
  - Total daily storage: $2.05 \text{ TB / day}$
- **Annual Storage Consumption (365 days):**
  $$\text{Storage/year} = 2.05 \text{ TB/day} \times 365 \text{ days} = 748.25 \text{ TB / year} \approx 0.75 \text{ PB / year}$$

---

## 3. Traffic Profile: Read-Heavy vs. Write-Heavy

**SnapShare is overwhelmingly read-heavy.**

- **Read-to-Write Ratio:**
  $$\text{Read-to-Write Ratio} = \frac{50,000,000 \text{ feed views}}{1,000,000 \text{ uploads}} = 50:1$$
- **Architectural Implications:**
  1. **Aggressive Multi-Tier Caching:** Feed queries and user timeline metadata must be cached in memory (e.g., Redis) so that the primary database is not queried on every page scroll.
  2. **Edge Media Delivery (CDN):** Image and thumbnail assets must be cached at geographically distributed Content Delivery Network (CDN) edge nodes to offload greater than 95% of bandwidth and read requests from internal infrastructure.
  3. **Read Scaling via Database Replicas:** Read replicas must handle the high volume of relational queries (user profiles, follower relationships, comments), isolating the primary database exclusively for writes and updates.
  4. **Asynchronous Ingestion:** Upload workflows should perform write operations asynchronously where possible, deferring intensive tasks like image transformation to background queues.

---

## 4. Why Photos Should Not Be Stored in the Database

Photos must **never** be stored as raw binary data (BLOBs) inside a relational database for the following reasons:
- **Buffer Pool & Memory Pollution:** Databases rely on in-memory caching (RAM) to keep indexing B-trees and active relational records fast; storing multi-megabyte image binaries floods RAM and evicts critical database indexes.
- **Backup & Replication Degradation:** Daily database dumps, point-in-time recovery, and read-replica streaming replication become prohibitively slow and expensive when database size balloons by 750 TB per year.
- **Prohibitive Storage Costs:** High-performance SSD storage configured for transactional databases costs substantially more per gigabyte than scalable cloud storage.
- **Connection Saturation:** Streaming 2 MB binary streams through database connections monopolizes database connection pools, starving standard relational queries.

### Where Photos Go Instead
Photos and thumbnails must be stored in dedicated **Object Storage** (e.g., AWS S3, Google Cloud Storage, Cloudflare R2). The database stores only lightweight metadata: `photo_id`, `user_id`, `caption`, `created_at`, and the public URL or S3 object key pointing to the file.

---

## 5. System Architecture Diagram

```
                             [ User Clients ]
                               /          \
                     (Reads)  /            \ (Writes / Uploads)
                             v              v
                     +---------------+  +-------------------------+
                     |  CDN Edge     |  |   Load Balancer (LB)    |
                     | (Static Media)|  +-------------------------+
                     +---------------+               |
                            |                        v
                            |           +-------------------------+
                            |           |   App Server Cluster    |
                            |           |   (Stateless Services)  |
                            |           +-------------------------+
                            |               /        |          \
                            |              /         |           \
                            |             v          v            v
                            |      +-------+   +-----------+   +---------+
                            |      | Cache |   |  Message  |   | Primary |
                            |      | (Feed |   |   Queue   |   | Database|
                            |      | Redis)|   |  (Rabbit) |   | (Writes)|
                            |      +-------+   +-----------+   +---------+
                            |                        |              | (Replication)
                            |                        v              v
                            |                 +-------------+  +---------+
                            |                 |  Thumbnail  |  |  Read   |
                            |                 |   Worker    |  | Replica |
                            |                 +-------------+  | (Reads) |
                            |                   /       \      +---------+
                            v                  v         \
                   +-------------------------------+      \ (Metadata Update)
                   |         Object Storage        |<------
                   | (Originals & Thumbnails / S3) |
                   +-------------------------------+
```

---

## 6. Component Explanations

1. **CDN (Content Delivery Network):** Caches images and thumbnails geographically close to users to deliver media with minimal latency while protecting internal servers from massive bandwidth demands.
2. **Load Balancer:** Distributes incoming HTTP/HTTPS traffic across multiple stateless application server instances to prevent bottlenecks and eliminate single points of failure.
3. **App Servers:** Executes core application logic, handles authentication, orchestrates photo metadata insertion, and coordinates read and write operations statelessly.
4. **Cache (e.g., Redis):** Holds frequently accessed feed data and user session information in memory to return timeline requests with sub-millisecond latency without hitting the database.
5. **Primary Database (Write DB):** Serves as the single authoritative source of truth for transactional writes, handling user accounts, follower relationships, and new photo metadata entries.
6. **Read Replica Database:** Replicates data from the primary database asynchronously to handle the heavy volume of read-only queries generated by feed requests and profile views.
7. **Object Storage (e.g., AWS S3):** Stores raw image files and generated thumbnails in a durable, virtually unlimited, and cost-effective distributed file store.
8. **Message Queue (e.g., RabbitMQ / Amazon SQS):** Decouples upload requests from resource-intensive image processing tasks by buffering thumbnail generation jobs reliably.
9. **Thumbnail Worker:** Consumes thumbnail generation tasks from the queue asynchronously, generating scaled 50 KB versions of uploaded photos and saving them back to object storage.

---

## 7. Step-by-Step Photo Upload Flow

1. **Upload Initiation:** The client application transmits the 2 MB photo file along with post metadata (caption, tags) to the Load Balancer, which routes the request to an available App Server.
2. **File Persistence:** The App Server validates the image format, assigns a unique UUID filename, and uploads the raw 2 MB file directly into Object Storage.
3. **Metadata Storage:** The App Server writes the photo's relational metadata (photo ID, user ID, upload timestamp, original image URL) to the **Primary Database**.
4. **Asynchronous Job Dispatch:** The App Server publishes an event payload `{ photo_id: "...", original_url: "...", user_id: "..." }` into the **Message Queue**.
5. **Immediate Client Acknowledgement:** Without waiting for thumbnail creation, the App Server returns an immediate `201 Created` HTTP response to the client, keeping upload response latency under 300 ms.
6. **Worker Processing:** A background **Thumbnail Worker** pulls the message from the queue, retrieves the original photo from Object Storage, and compresses/resizes it into a 50 KB thumbnail.
7. **Thumbnail Storage & Database Update:** The worker uploads the thumbnail to Object Storage, updates the photo record in the Primary Database with the new thumbnail URL, and acknowledges the message in the queue.
8. **Feed Invalidation / Fan-Out:** The worker invalidates or prepends the new post to the in-memory feed caches of the user's followers in the Cache layer.

---

## 8. Architectural Trade-offs

### Trade-off 1: Pre-computed Feeds (Push Model) vs. On-Demand Feed Generation (Pull Model)
- **Decision:** Use a hybrid model. For standard users with moderate follower counts, pre-compute follower feeds upon upload (fan-out on write into Redis lists). For high-profile accounts ("celebrities" with over 100,000 followers), defer feed merging to query time (fan-out on read).
- **Pros:** Prevents massive write amplification spikes when popular creators post photos while providing instant, sub-50ms feed load times for the vast majority of active users.
- **Cons:** Increases system complexity, as the application layer must maintain two separate feed retrieval code paths depending on creator follower tiers.

### Trade-off 2: Asynchronous vs. Synchronous Thumbnail Generation
- **Decision:** Asynchronous processing via a message queue and dedicated background workers.
- **Pros:** Keeps upload requests snappy and responsive for the end user; prevents app server CPU exhaustion during sudden spikes in upload volume.
- **Cons:** Introduces eventual consistency—for a few seconds after publishing, a user's feed may display a loading placeholder or the full-resolution image while the thumbnail job is processed by the worker queue.
