# # Primera Etapa
# En esta etapa solo traemos datos y los previsualizamos
# 
# Se decidió Generar esta función con el fin de poder limpiar la data ya que el texto de algunos tweets es un poco extenso y puede llevar el modelo en mal camino.
# 
import pandas as pd
import re
import pickle
from sklearn.model_selection import train_test_split


df = pd.read_csv('..\\Data\\MainData\\sentiment_analysis_dataset.csv')
print(df.head())


def limpiar_texto(texto):
    # Quitar menciones
    texto = re.sub(r'@\w+', '', texto)
    # Quitar hashtags (solo el símbolo #, no la palabra)
    texto = re.sub(r'#', '', texto)
    # Quitar URLs
    texto = re.sub(r'https?:\/\/\S+', '', texto)
    # Quitar signos de puntuación, pero permitir letras con tilde y ñ
    texto = re.sub(r'[^\w\sáéíóúÁÉÍÓÚñÑ]', '', texto)
    # Quitar espacios múltiples
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

 
# # Segunda Etapa
# En esta etapa se procedio a limpiar datos y reordenar los mismos al mapiar los sentimientos.
# hay dos que pueden ser inutiles como los emojies en algunos comentarios.


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

 
# # Tercera Etapa
# Almacenamiento de datos y divicion de los mismos


with open('..\\Data\\CleanData\\sentiment_data_limpio.pkl', 'wb') as archivo:
    pickle.dump(df, archivo)


X = df['clean_text']
y = df['sentiment_label']


X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.18, random_state=40, stratify=y
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