# Dockerfile para o backend FastAPI

# Multi-stage: build frontend, depois backend
FROM node:20 AS frontend-build
WORKDIR /frontend
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src ./src
COPY index.html ./
RUN npm install && npm run build

FROM python:3.11-slim
WORKDIR /app

# Instala dependências do sistema (se necessário)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements e instala dependências Python
COPY src-tauri/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do backend
COPY src-tauri/backend/ ./

# Copia o build do frontend para dentro do backend
COPY --from=frontend-build /frontend/dist ./frontend

# Expõe a porta padrão do FastAPI
EXPOSE 8000

# Comando para rodar o backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
