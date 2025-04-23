import pickle
import os
import sys
from collections import defaultdict, Counter
from time import sleep

# Añadir la ruta para importar los módulos del backend
backend_dir = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')), 'Backend\\modules')
sys.path.append(backend_dir)
# Importar funciones de los módulos
from utils import tokenizar, obtener_ngramas
from NaiveBayes import NaiveBayesClassifier


print("Iniciando carga de datos de entrenamiento...")
# Cargar los datos entrenados
with open('..\\Data\\TrainingData\\X_train.pkl', 'rb') as archivo:
    X_train = pickle.load(archivo)
    print(f"X_train cargado: {len(X_train)} documentos")
    print(f"Muestra de X_train (primeros 2 documentos): {X_train[:2]}")

with open('..\\Data\\TrainingData\\y_train.pkl', 'rb') as archivo:
    y_train = pickle.load(archivo)
    print(f"y_train cargado: {len(y_train)} etiquetas")
    print(f"Muestra de y_train (primeras 2 etiquetas): {y_train[:2]}")
    print(f"Clases únicas en y_train: {set(y_train)}")
sleep(5)

# Crear instancia del clasificador Naive Bayes
clasificador = NaiveBayesClassifier()

# Procesar documentos usando el clasificador
print("\nIniciando procesamiento de documentos...")
sleep(5)

# En lugar de definir nuestras propias estructuras, utilizamos el clasificador
frecuencia_palabras_por_clase, total_palabras_por_clase, documentos_por_clase, vocabulario = clasificador.procesar_documentos(X_train, y_train, usar_bigramas=True)

print("\nEstadísticas del procesamiento:")
print(f"Tamaño del vocabulario: {len(vocabulario)}")
print(f"Distribución de documentos por clase: {dict(documentos_por_clase)}")
print(f"Total de palabras por clase: {dict(total_palabras_por_clase)}")
print(f"Muestra de palabras frecuentes por clase:")

# Guardar estructuras para la etapa 4
with open('..\\Data\\ModelData\\frecuencia_palabras_por_clase.pkl', 'wb') as archivo:
    pickle.dump(frecuencia_palabras_por_clase, archivo)

with open('..\\Data\\ModelData\\total_palabras_por_clase.pkl', 'wb') as archivo:
    pickle.dump(total_palabras_por_clase, archivo)

with open('..\\Data\\ModelData\\documentos_por_clase.pkl', 'wb') as archivo:
    pickle.dump(documentos_por_clase, archivo)

with open('..\\Data\\ModelData\\vocabulario.pkl', 'wb') as archivo:
    pickle.dump(vocabulario, archivo)