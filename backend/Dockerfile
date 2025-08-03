# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /code/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /code/

# Usar entrypoint para ejecutar migraciones y collectstatic en despliegue
ENTRYPOINT ["/code/entrypoint.sh"]

# Usar Gunicorn para producción
CMD ["sh", "-c", "gunicorn localback.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
