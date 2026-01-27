# Vision Agent - Fazenda Digital
# Dockerfile para deploy em servidor edge

FROM python:3.11-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Variáveis de ambiente padrão
ENV API_BASE_URL=http://localhost:3000
ENV VISION_AGENT_API_KEY=dev-vision-key
ENV DEMO_MODE=false

# Executar
CMD ["python", "main.py"]
