# docker build -t coq-blocks-app .
# docker run -p 8000:8000 coq-blocks-app

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

WORKDIR /app/coq_blocks

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
