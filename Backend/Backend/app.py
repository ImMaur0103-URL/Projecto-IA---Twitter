from fastapi import FastAPI
import modules.NaiveBayes as NB


app = FastAPI()

@app.get("/api/Analizar")
def read_root(text):
    clasificador = NB.NaiveBayesClassifier()
    try:
        clasificador.cargar_modelo()
        Clasificacion = clasificador.clasificar(text)
        Sentimiento = NB.obtener_etiqueta_sentimiento(Clasificacion)

        return {'Sentimiento':Sentimiento, 'Valor':Clasificacion}
    except:
        pass

    