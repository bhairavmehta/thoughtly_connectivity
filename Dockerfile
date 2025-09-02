FROM continuumio/miniconda3:latest

WORKDIR /app

COPY environment.yml .
RUN conda env create -f environment.yml && conda clean -afy

SHELL ["conda", "run", "-n", "thought-agent", "/bin/bash", "-lc"]

WORKDIR /app/backend/src
COPY backend/src .

EXPOSE 8080

ENTRYPOINT ["conda", "run", "-n", "thought-agent", "--no-capture-output"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
