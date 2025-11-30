---

# **RecruAI Universal RAG – Todo List**

## **1️⃣ Supervisor / Orchestrator Tool**

* **Purpose:** Directs workflow, decides which tools to call based on input type.
* **Functions:**

  * `route_input(input_type)`
  * `orchestrate_workflow(input)`
  * `log_activity(input, output, metadata)`
* **Input:** Raw user input + metadata
* **Output:** Final answer + logs

---

## **2️⃣ Ingestor Tool**

- **Purpose:** Converts any input into text chunks for embedding.
- **Functions:**

  - `ingest_text(text, metadata)`
  - `ingest_pdf(file_path)`
  - `ingest_audio(file_path)` → calls Transcriber
  - `ingest_video(file_path)` → extract audio → Transcriber
  - `ingest_image(file_path)` → optional OCR / caption

- **Input:** Text, PDF, Audio, Video, Image
- **Output:** List of text chunks + metadata

---

## **3️⃣ Transcriber Tool**

- **Purpose:** Converts audio/video to text.
- **Functions:**

  - `transcribe_audio(file_path)`
  - `transcribe_video(file_path)` → extracts audio → calls `transcribe_audio`

- **Input:** Audio, Video
- **Output:** Text transcript

---

## **4️⃣ Embedder Tool**

- **Purpose:** Converts chunks to vector embeddings and stores them.
- **Functions:**

  - `generate_embedding(text_chunk)` → vector
  - `store_embedding(vector, metadata)` → vector DB (pgvector / FAISS / Milvus)

- **Input:** Text chunks
- **Output:** Stored embeddings in vector DB

---

## **5️⃣ Vector Database / Retriever Tool**

- **Purpose:** Fetch relevant chunks from vector DB based on query.
- **Functions:**

  - `query_embedding(query_text)` → embedding vector
  - `retrieve_top_k(query_embedding, k=5, filters=None)` → top-k similar chunks

- **Input:** Query text or embedding
- **Output:** Top-k relevant text chunks with metadata

---

## **6️⃣ Summarizer Tool (Optional)**

- **Purpose:** Condense retrieved chunks for efficient LLM input.
- **Functions:**

  - `summarize_chunks(chunks)` → summarized text

- **Input:** List of chunks
- **Output:** Condensed context

---

## **7️⃣ LLM Generator Tool**

- **Purpose:** Generate grounded answers using retrieved chunks.
- **Functions:**

  - `generate_answer(query, context)` → LLM response

- **Input:** User query + retrieved context
- **Output:** Generated answer

---

## **8️⃣ Filter / Safety Tool**

- **Purpose:** Ensure responses are safe for kids, humans, AI, or sensitive content.
- **Functions:**

  - `check_safety(text)` → flag or modify
  - `sanitize_content(text)` → remove inappropriate content

- **Input:** LLM generated text
- **Output:** Safe text output

---

## **9️⃣ Metadata Manager Tool**

- **Purpose:** Annotate and manage metadata for retrieval and filtering.
- **Functions:**

  - `add_metadata(chunk, type, source, timestamp, user_type)`
  - `filter_by_metadata(filters)` → assist Retriever

- **Input:** Text chunks
- **Output:** Annotated chunks ready for vector DB

---

## **🔟 Optional Utility Tools**

- **Translation Tool:** `translate_text(text, target_lang)`
- **OCR Tool:** `extract_text_from_image(image_path)`
- **Chunking Tool:** `chunk_text(text, chunk_size)`
- **Feedback / Logging Tool:** `collect_feedback(user_id, response)`

---

## **Workflow Summary**

```text
[User Input: text/audio/video/pdf/image]
          ↓ (Supervisor)
[Ingestor] → [Transcriber if needed]
          ↓
[Embedder] → store embeddings
          ↓
[Retriever] → fetch top-k chunks
          ↓
[Summarizer (optional)]
          ↓
[LLM Generator] → generate answer
          ↓
[Filter / Safety]
          ↓
[Return Response]
```

---

## **Key Notes**

- All content types eventually **convert to text chunks** → embeddings → vector DB.
- Supervisor ensures **one unified pipeline** for all modalities.
- Metadata helps **filter by type, user, source**.
- System is modular → new tools can be added without changing the core pipeline.

---
