FROM python:3.9.0-slim

WORKDIR /app
COPY ./ ./
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000
CMD ["python", "App.Py"] 