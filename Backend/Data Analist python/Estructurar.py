import pickle
from collections import defaultdict, Counter
from time import sleep
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

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
# Estructuras necesarias
frecuencia_palabras_por_clase = defaultdict(Counter)
total_palabras_por_clase = defaultdict(int)
documentos_por_clase = defaultdict(int)
vocabulario = set()

print("\nIniciando procesamiento de documentos...")
sleep(5)
# Tokenización simple (se puede mejorar)
def tokenizar(texto):
    tokens = texto.lower().split()
    tokens = [palabra for palabra in tokens if len(palabra) > 2]
    print(f"Ejemplo de tokenización: '{texto[:30]}...' -> {tokens[:5]}... ({len(tokens)} tokens)")
    return tokens
def obtener_ngramas(tokens, n=2):
    """Genera n-gramas a partir de tokens."""
    return [' '.join(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

# Recorrido del conjunto de entrenamiento
for texto, etiqueta in zip(X_train, y_train):
    palabras = tokenizar(texto)
    bigramas = obtener_ngramas(palabras, 2)
    documentos_por_clase[etiqueta] += 1
    total_palabras_por_clase[etiqueta] += len(palabras)
    vocabulario.update(palabras)
    for palabra in palabras:
        frecuencia_palabras_por_clase[etiqueta][palabra] += 1
    for palabra in palabras + bigramas:  # Combina palabras y bigramas
        frecuencia_palabras_por_clase[etiqueta][palabra] += 1

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