from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import pickle
import os
import sys
from math import log

from modules.NaiveBayes import NaiveBayesClassifier, cargar_clasificador, obtener_etiqueta_sentimiento

# --------------------------
# crear clasificador
# --------------------------

# Cargar datos de la etapa 3
with open('..\\Data\\ModelData\\frecuencia_palabras_por_clase.pkl', 'rb') as f:
    frecuencia_palabras_por_clase = pickle.load(f)

with open('..\\Data\\ModelData\\total_palabras_por_clase.pkl', 'rb') as f:
    total_palabras_por_clase = pickle.load(f)

with open('..\\Data\\ModelData\\documentos_por_clase.pkl', 'rb') as f:
    documentos_por_clase = pickle.load(f)

with open('..\\Data\\ModelData\\vocabulario.pkl', 'rb') as f:
    vocabulario = pickle.load(f)

# Crear el clasificador y asignarle las estructuras cargadas
clasificador = NaiveBayesClassifier(alpha=2)
clasificador.frecuencia_palabras_por_clase = frecuencia_palabras_por_clase
clasificador.total_palabras_por_clase = total_palabras_por_clase
clasificador.documentos_por_clase = documentos_por_clase
clasificador.vocabulario = vocabulario
clasificador.tam_vocabulario = len(vocabulario)

# Entrenar y guardar el modelo
clasificador.entrenar()
clasificador.guardar_modelo()

# --------------------------
# Sección de pruebas
# --------------------------

# Cargar datos de prueba
with open('..\\Data\\TestData\\X_test.pkl', 'rb') as f:
    X_test = pickle.load(f)

with open('..\\Data\\TestData\\y_test.pkl', 'rb') as f:
    y_test = pickle.load(f)

# Clasificar todos los textos de prueba usando el clasificador
predicciones = [clasificador.clasificar(texto) for texto in X_test]

# Evaluar
accuracy = accuracy_score(y_test, predicciones)
precision = precision_score(y_test, predicciones, average='weighted', zero_division=0)
recall = recall_score(y_test, predicciones, average='weighted', zero_division=0)
f1 = f1_score(y_test, predicciones, average='weighted', zero_division=0)
conf_matrix = confusion_matrix(y_test, predicciones)

print("\nResultados de evaluación del modelo:")
print(f"Accuracy     : {accuracy:.4f}")
print(f"Precision    : {precision:.4f}")
print(f"Recall       : {recall:.4f}")
print(f"F1-Score     : {f1:.4f}")
print("\nMatriz de Confusión:")
print(conf_matrix)
print("\nReporte por clase:")
print(classification_report(y_test, predicciones, zero_division=0))