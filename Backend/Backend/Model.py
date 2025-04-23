from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import pickle
from math import log

# --------------------------
# Cargar datos de la etapa 3
# --------------------------

with open('..\\Data\\ModelData/frecuencia_palabras_por_clase.pkl', 'rb') as f:
    frecuencia_palabras_por_clase = pickle.load(f)

with open('..\\Data\\ModelData/total_palabras_por_clase.pkl', 'rb') as f:
    total_palabras_por_clase = pickle.load(f)

with open('..\\Data\\ModelData/documentos_por_clase.pkl', 'rb') as f:
    documentos_por_clase = pickle.load(f)

with open('..\\Data\\ModelData/vocabulario.pkl', 'rb') as f:
    vocabulario = pickle.load(f)

# --------------------------
# Cálculo de probabilidades
# --------------------------

total_documentos = sum(documentos_por_clase.values())
tam_vocabulario = len(vocabulario)
alpha = 1  # Suavizado de Laplace

# Probabilidades previas en log
log_probabilidades_previas = {
    clase: log(documentos_por_clase[clase] / total_documentos)
    for clase in documentos_por_clase
}

# Tablas de probabilidad condicional (con Laplace), también en log
tablas_condicionales = {}

for clase, frecuencias in frecuencia_palabras_por_clase.items():
    total_palabras = total_palabras_por_clase[clase]
    tabla = {}
    for palabra in vocabulario:
        freq = frecuencias[palabra]
        prob = (freq + alpha) / (total_palabras + alpha * tam_vocabulario)
        tabla[palabra] = log(prob)
    tablas_condicionales[clase] = tabla

# --------------------------
# Guardar modelo entrenado
# --------------------------

modelo_entrenado = {
    'log_probabilidades_previas': log_probabilidades_previas,
    'tablas_condicionales': tablas_condicionales,
    'total_palabras_por_clase': total_palabras_por_clase,
    'tam_vocabulario': tam_vocabulario,
    'alpha': alpha
}

with open('..\\Data\\ModelData\\modelo_entrenado.pkl', 'wb') as f:
    pickle.dump(modelo_entrenado, f)
with open('..\\Data\\ModelData\\log_probabilidades_previas.pkl', 'wb') as f:
    pickle.dump(log_probabilidades_previas, f)
with open('..\\Data\\ModelData\\tablas_condicionales.pkl', 'wb') as f:
    pickle.dump(tablas_condicionales, f)


# --------------------------
# Sección de pruebas
# --------------------------

# Función de clasificación
def clasificar(texto, modelo):
    palabras = texto.lower().split()
    puntajes = {}

    for clase in modelo['log_probabilidades_previas']:
        log_prob = modelo['log_probabilidades_previas'][clase]
        tabla_condicional = modelo['tablas_condicionales'][clase]
        total_palabras = modelo['total_palabras_por_clase'][clase]
        alpha = modelo['alpha']
        tam_vocab = modelo['tam_vocabulario']

        for palabra in palabras:
            if palabra in tabla_condicional:
                log_prob += tabla_condicional[palabra]
            else:
                # Suavizado de Laplace para palabras desconocidas
                log_prob += log(1 / (total_palabras + alpha * tam_vocab))

        puntajes[clase] = log_prob

    return max(puntajes, key=puntajes.get)

# Cargar datos de prueba
with open('..\\Data\\TestData\\X_test.pkl', 'rb') as f:
    X_test = pickle.load(f)

with open('..\\Data\\TestData\\y_test.pkl', 'rb') as f:
    y_test = pickle.load(f)

# Clasificar todos los textos de prueba
predicciones = [clasificar(texto, modelo_entrenado) for texto in X_test]

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

