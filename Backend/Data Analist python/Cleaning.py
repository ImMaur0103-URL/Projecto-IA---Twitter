import pandas as pd
import re
import pickle
import os
import sys
from sklearn.model_selection import train_test_split

# Añadir la ruta para importar los módulos del backend
backend_dir = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')), 'Backend\\modules')
sys.path.append(backend_dir)

# Importar funciones de los módulos utils
from utils import limpiar_texto

df = pd.read_csv('..\\Data\\MainData\\sentiment_analysis_dataset.csv')
print(df.head())

# Ya no necesitamos definir limpiar_texto aquí, lo importamos desde utils
df['clean_text'] = df['text'].apply(limpiar_texto)
df[['text', 'clean_text']].head(20)

df['date'] = pd.to_datetime(df['date'], format='%b %d, %Y · %I:%M %p UTC', errors='coerce')
df['date'].isnull().sum()

sentiment_map = {
    'scared': 0,
    'sad': 0,
    'mad': 0,
    'peaceful': 1,
    'joyful': 2,
    'powerful': 2
}

df['sentiment_label'] = df['sentiment'].map(sentiment_map)

print(df['date'].head())
df[['sentiment', 'sentiment_label']].drop_duplicates()

# Almacenamiento de datos limpios
with open('..\\Data\\CleanData\\sentiment_data_limpio.pkl', 'wb') as archivo:
    pickle.dump(df, archivo)

X = df['clean_text']
y = df['sentiment_label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.185, random_state=38, stratify=y
)

print(f"Entrenamiento: {len(X_train)} muestras")
print(f"Prueba: {len(X_test)} muestras")

# Guardar datos de entrenamiento
with open('..\\Data\\TrainingData\\X_train.pkl', 'wb') as archivo:
    pickle.dump(X_train, archivo)

with open('..\\Data\\TrainingData\\y_train.pkl', 'wb') as archivo:
    pickle.dump(y_train, archivo)

# Guardar datos de prueba
with open('..\\Data\\TestData\\X_test.pkl', 'wb') as archivo:
    pickle.dump(X_test, archivo)

with open('..\\Data\\TestData\\y_test.pkl', 'wb') as archivo:
    pickle.dump(y_test, archivo)