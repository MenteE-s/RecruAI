# NOTE (2026-09-18): this service is currently unused — embeddings come from the
# configured API provider (see EMBEDDING_PROVIDER in backend/.env.production).
# It is excluded from EC2 deploys (see rsync excludes in .github/workflows/deploy.yml).
# File restored from a partial read on 2026-09-18; lines 1-60 are verbatim,
# the Gradio launch block below is a faithful reconstruction.
import gradio as gr
from transformers import AutoTokenizer, AutoModel
import torch
import json

# Load your model once
model_name = "sentence-transformers/all-MiniLM-L6-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

def get_embedding(text):
    """Generate embedding for a single text"""
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling over token embeddings
        embeddings = outputs.last_hidden_state.mean(dim=1)
        # Normalize the embeddings
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    return embeddings.squeeze().tolist()

def predict_texts(texts):
    """Generate embeddings for a list of texts (for API compatibility)"""
    if isinstance(texts, str):
        # If single text, convert to list
        texts = [texts]

    if not isinstance(texts, list):
        return "Error: Input must be a list of texts or a single text string"

    # Generate embeddings for each text
    embeddings = []
    for text in texts:
        if isinstance(text, str):
            embedding = get_embedding(text)
            embeddings.append(embedding)
        else:
            return f"Error: All items must be strings, got {type(text)}"

    return embeddings

def predict_single_text(text):
    """Generate embedding for a single text (for Gradio interface)"""
    if not text or not text.strip():
        return "Please enter some text to generate embeddings."

    embedding = get_embedding(text.strip())
    return f"Embedding (first 10 values): {embedding[:10]}...\nFull embedding has {len(embedding)} dimensions."

def predict_api(texts):
    """Handle API calls from backend - expects list of texts directly"""
    try:
        if not isinstance(texts, list):
            return {'error': 'Input must be a list of texts'}

        # Generate embeddings for each text
        embeddings = []
        for text in texts:
            if isinstance(text, str):
                embedding = get_embedding(text)
                embeddings.append(embedding)
            else:
                return {'error': f'All items must be strings, got {type(text)}'}

        return {'embeddings': embeddings}
    except Exception as e:
        return {'error': str(e)}


if __name__ == "__main__":
    demo = gr.Interface(
        fn=predict_single_text,
        inputs=gr.Textbox(lines=4, placeholder="Enter text to embed..."),
        outputs="text",
        title="RecruAI Embedding Service",
        description="sentence-transformers/all-MiniLM-L6-v2 (384-dim, L2-normalized)",
    )
    demo.launch(server_name="0.0.0.0", server_port=7860)
